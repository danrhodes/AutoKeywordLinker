const { MarkdownView } = require('obsidian');
const { escapeRegex, getContext } = require('../utils/helpers');
const { getFrontmatterBounds, getSuggestionSpanRanges, contentLinksToTarget, isInsideAlias, isPartOfUrl, isInsideLinkOrCode, isInsideBlockReference, isInsideTable, isInsideMath, isInsideHeading, isInsideFencedCodeBlock } = require('../utils/detection');
const { getEffectiveKeywordSettings, buildKeywordMap, checkLinkScope } = require('../utils/linking');
const { findTargetFile, getAliasesForNote, noteHasTag, noteHasLinkToTarget, ensureNoteExists } = require('../utils/noteManagement');
const { sanitizeTagName, addTagsToContent, addTagToTargetNote } = require('../utils/tagManagement');
const { getIgnoreList, isIgnored } = require('../utils/ignore');
const { getParagraphAt, stripMarkup, buildTargetProfile, buildNoteContext, warmBodyCache, pickTarget } = require('../utils/disambiguation');

class KeywordLinker {
    constructor(app, settings) {
        this.app = app;
        this.settings = settings;
        // Body words of target notes that share keyword text, for context disambiguation
        this.bodyCache = new Map(); // path → { mtime, terms }
    }

    /**
     * Check a keyword entry's per-note rules: self-link protection, "only in notes linking
     * to target", required tag and link scope
     * @param {Object} entry - Keyword map entry
     * @param {TFile} file - The file being processed
     * @returns {boolean} True if the entry may link in this file
     */
    entryAppliesHere(entry, file) {
        const target = entry.target;

        // Self-link protection (global setting OR per-keyword setting)
        if (this.settings.preventSelfLinkGlobal || entry.preventSelfLink) {
            if (file.basename === target.split('/').pop()) {
                return false;
            }
        }

        // Only link in notes that already link to the target
        if (entry.onlyInNotesLinkingTo && !noteHasLinkToTarget(this.app, file, target)) {
            return false;
        }

        // Target note must have the required tag
        if (!noteHasTag(this.app, target, entry.requireTag || '')) {
            return false;
        }

        return checkLinkScope(this.app, file, target, entry.linkScope || 'vault-wide', entry.scopeFolder || '', findTargetFile);
    }

    /**
     * Pick which of several targets sharing keyword text a match should link to,
     * based on the paragraph it's in and the note as a whole
     * @param {Object} state - Per-run caches (noteContext, profiles, picks)
     * @param {Array<Object>} entries - Eligible keyword map entries, in settings order
     * @param {string} keyword - The keyword text
     * @param {string} content - Current content
     * @param {number} index - Match position
     * @param {TFile} file - The file being processed
     * @param {string} originalContent - Content before this run's changes
     * @returns {Object|null} { entry, confident, reasons, others }, or null to leave the match unlinked
     */
    pickTargetForMatch(state, entries, keyword, content, index, file, originalContent) {
        // Links added earlier in this run don't change the paragraph's plain text,
        // so every candidate's pass reaches the same decision for a given match
        const paragraph = getParagraphAt(content, index);
        const memoKey = `${keyword.toLowerCase()}\u0000${stripMarkup(paragraph)}`;
        if (state.picks.has(memoKey)) {
            return state.picks.get(memoKey);
        }

        if (!state.noteContext) {
            state.noteContext = buildNoteContext(this.app, file, originalContent);
        }
        const profiles = entries.map(entry => {
            if (!state.profiles.has(entry)) {
                state.profiles.set(entry, buildTargetProfile(this.app, entry, this.bodyCache));
            }
            return state.profiles.get(entry);
        });

        const result = pickTarget(profiles, state.noteContext, paragraph, keyword);

        let pick = null;
        if (result.confident) {
            pick = { entry: result.entry, confident: true, reasons: result.scores[0].reasons };
        } else if (this.settings.ambiguousFallback !== 'skip') {
            // Unclear: fall back to the first keyword in settings order (the pre-disambiguation behaviour)
            pick = { entry: entries[0], confident: false, reasons: [] };
        }
        if (pick) {
            pick.others = entries.filter(e => e !== pick.entry).map(e => e.target);
        }

        state.picks.set(memoKey, pick);
        return pick;
    }

    /**
     * Read the body text of targets that share keyword text, so context picks can use it.
     * Optional - picks work from note metadata alone - but call before processContent() when you can.
     * @param {Object} [keywordMap] - Map from buildKeywordMap(), built if not given
     */
    async warmContextCache(keywordMap) {
        if (this.settings.contextDisambiguation === false) return;
        await warmBodyCache(this.app, keywordMap || buildKeywordMap(this.app, this.settings), this.bodyCache);
    }

    /**
     * Process content and apply keyword linking transformations
     * This is the core processing logic, extracted so it can be used with both
     * editor.getValue()/setValue() and vault.process() patterns
     * @param {string} content - The content to process
     * @param {TFile} file - The file being processed (for context checks)
     * @param {boolean} preview - If true, don't track for actual changes
     * @param {boolean} skipTags - If true, don't add tags, just return pending tags
     * @param {Object} [prebuiltKeywordMap] - Map from buildKeywordMap(), built if not given
     * @returns {Object} Processing result with newContent, linkCount, changes, etc.
     */
    processContent(content, file, preview = false, skipTags = false, prebuiltKeywordMap = null) {
        const originalContent = content;
        const originalLength = content.length;

        // CRITICAL: Get frontmatter boundaries to skip that section
        const frontmatterBounds = getFrontmatterBounds(content);

        // Initialize tracking variables
        let linkCount = 0;
        let changes = [];
        let tagsToAdd = new Set();
        let targetNotesForTags = new Map();

        // Per-note opt-outs from the akl-ignore frontmatter property
        const ignoreList = getIgnoreList(content);

        // Build a map of all keywords to their target notes
        // (akl-ignore: all leaves the map empty, so nothing is linked in this note)
        const keywordMap = ignoreList.all ? {} : (prebuiltKeywordMap || buildKeywordMap(this.app, this.settings));

        // Group keywords (including variations and aliases) by target note, so each target
        // is handled once - otherwise every variation/alias could add its own link to the same note
        const targetGroups = new Map(); // lowercase target -> { target, keywords: [{ text, entry, ambiguous }] }
        const addToGroup = (text, entry, ambiguous) => {
            const key = entry.target.toLowerCase();
            if (!targetGroups.has(key)) {
                targetGroups.set(key, { target: entry.target, keywords: [] });
            }
            targetGroups.get(key).keywords.push({ text, entry, ambiguous });
        };

        for (const keyword of Object.keys(keywordMap)) {
            if (!keyword.trim()) continue;
            // Skip keywords whose own text is in this note's ignore list
            if (isIgnored(ignoreList, keyword)) continue;

            // Every target this text can point at (more than one when keywords share text),
            // minus targets in this note's ignore list
            const primary = keywordMap[keyword];
            const entries = [primary, ...(primary.alternatives || [])]
                .filter(e => e.target && e.target.trim() && !isIgnored(ignoreList, e.target));
            if (entries.length === 0) continue;
            if (entries.length === 1) {
                addToGroup(keyword, entries[0], null);
                continue;
            }

            // Shared text: only targets whose rules (scope, tags, ...) allow linking here compete
            const eligible = entries.filter(e => this.entryAppliesHere(e, file));
            if (eligible.length === 1) {
                addToGroup(keyword, eligible[0], null);
            } else {
                // Each candidate's pass keeps only the matches the context picks it for
                eligible.forEach(e => addToGroup(keyword, e, eligible));
            }
        }

        // Context for picking between targets that share keyword text (built on first use)
        const disambiguation = {
            noteContext: null,
            profiles: new Map(), // entry → profile
            picks: new Map()     // keyword + paragraph → pick
        };

        // Longest keywords first, so longer phrases claim text before shorter overlapping ones
        const groups = Array.from(targetGroups.values());
        groups.forEach(group => group.keywords.sort((a, b) => b.text.length - a.text.length));
        groups.sort((a, b) => b.keywords[0].text.length - a.keywords[0].text.length);

        // Track all replacements made (for cursor position adjustment)
        const allReplacements = [];

        // Process each target note
        for (const group of groups) {
            const target = group.target;

            // For firstOccurrenceOnly, leave the note alone if it already links to (or suggests) this target
            if (this.settings.firstOccurrenceOnly && contentLinksToTarget(content, target)) {
                continue;
            }

            // Never match inside an existing suggestion span (its HTML attributes or text)
            const spanRanges = getSuggestionSpanRanges(content);

            // Collect valid matches for every keyword form that points at this target
            const candidates = [];

            for (const { text: keyword, entry: keywordSettings, ambiguous } of group.keywords) {
                // Per-keyword skipCodeBlocks: null means inherit global, true/false overrides
                const perKeywordSkip = keywordSettings.skipCodeBlocks;
                const skipCodeBlocks = perKeywordSkip !== null && perKeywordSkip !== undefined
                    ? perKeywordSkip
                    : (this.settings.skipCodeBlocks || false);

                // Self-link, "only in notes linking to target", required tag and link scope
                if (!ambiguous && !this.entryAppliesHere(keywordSettings, file)) {
                    continue;
                }

                // Case sensitivity is resolved per keyword (keyword/group override or global)
                const flags = keywordSettings.caseSensitive ? 'g' : 'gi';
                const escapedKeyword = escapeRegex(keyword);
                const startBoundary = /^\w/.test(keyword) ? '\\b' : '(?<![\\w])';
                const endBoundary = /\w$/.test(keyword) ? '\\b' : '(?![\\w])';
                const pattern = new RegExp(`${startBoundary}${escapedKeyword}${endBoundary}`, flags);

                let match;

                // Find all potential matches
                while ((match = pattern.exec(content)) !== null) {
                    const matchIndex = match.index;
                    const matchText = match[0];

                    // CRITICAL: Skip if inside frontmatter
                    if (frontmatterBounds && matchIndex >= frontmatterBounds.start && matchIndex < frontmatterBounds.end) {
                        continue;
                    }

                    // Skip if inside an existing suggestion span
                    if (spanRanges.some(r => matchIndex >= r.start && matchIndex < r.end)) {
                        continue;
                    }

                    // Skip if on a heading line (e.g. ## My Heading)
                    if (this.settings.skipHeadings && isInsideHeading(content, matchIndex)) {
                        continue;
                    }

                    // Skip if inside a fenced code block (``` or ~~~)
                    if (skipCodeBlocks && isInsideFencedCodeBlock(content, matchIndex)) {
                        continue;
                    }

                    // Skip if preceded by # (hashtag)
                    if (matchIndex > 0 && content[matchIndex - 1] === '#') {
                        continue;
                    }

                    // Skip if inside a block reference
                    if (isInsideBlockReference(content, matchIndex)) {
                        continue;
                    }

                    // Check if inside a link or code block
                    if (isInsideLinkOrCode(content, matchIndex)) {
                        continue;
                    }

                    // Check if inside an alias portion of a link
                    if (isInsideAlias(content, matchIndex)) {
                        continue;
                    }

                    // Check if part of a URL
                    if (isPartOfUrl(content, matchIndex, matchText.length)) {
                        continue;
                    }

                    // Skip if inside a LaTeX math formula
                    if (isInsideMath(content, matchIndex)) {
                        continue;
                    }

                    // Keyword shared with other targets: keep the match only if the context picks this one
                    let pick = null;
                    if (ambiguous) {
                        pick = this.pickTargetForMatch(disambiguation, ambiguous, keyword, content, matchIndex, file, originalContent);
                        if (!pick || pick.entry !== keywordSettings) {
                            continue;
                        }
                    }

                    candidates.push({ index: matchIndex, matchText, keyword, keywordSettings, pick });
                }
            }

            if (candidates.length === 0) continue;

            // Order by position (longer match first at the same position) and drop overlaps,
            // e.g. "dark matter" and "matter" matching the same text
            candidates.sort((a, b) => a.index - b.index || b.matchText.length - a.matchText.length);
            const selected = [];
            let lastEnd = -1;
            for (const candidate of candidates) {
                if (candidate.index < lastEnd) continue;
                selected.push(candidate);
                lastEnd = candidate.index + candidate.matchText.length;
                // For firstOccurrenceOnly, link only the earliest mention of any form of this target
                if (this.settings.firstOccurrenceOnly) break;
            }

            const replacements = [];

            for (const { index: matchIndex, matchText, keyword, keywordSettings, pick } of selected) {
                const enableTags = keywordSettings.enableTags;
                const useRelativeLinks = keywordSettings.useRelativeLinks || false;
                const blockRef = keywordSettings.blockRef || '';
                const suggestMode = keywordSettings.suggestMode || false;
                const keywordIndex = keywordSettings.keywordIndex;

                // Check if we're inside a table
                const insideTable = isInsideTable(content, matchIndex);

                // Prepare target with optional block reference
                const targetWithBlock = blockRef ? `${target}#${blockRef}` : target;

                // Create replacement link or suggestion
                let replacement;
                if (suggestMode) {
                    const escapedTarget = target.replace(/"/g, '&quot;');
                    const escapedBlock = blockRef.replace(/"/g, '&quot;');
                    const useRelative = useRelativeLinks ? 'true' : 'false';
                    replacement = `<span class="akl-suggested-link" data-target="${escapedTarget}" data-block="${escapedBlock}" data-use-relative="${useRelative}" data-keyword-index="${keywordIndex}">${matchText}</span>`;
                } else if (useRelativeLinks) {
                    const escapedMatchText = insideTable ? matchText.replace(/\|/g, '\\|') : matchText;
                    const encodedTarget = encodeURIComponent(target) + '.md';
                    const blockPart = blockRef ? `#${blockRef}` : '';
                    replacement = `[${escapedMatchText}](${encodedTarget}${blockPart})`;
                } else {
                    if (insideTable) {
                        replacement = target === matchText && !blockRef ? `[[${matchText}]]` : `[[${targetWithBlock}\\|${matchText}]]`;
                    } else {
                        replacement = target === matchText && !blockRef ? `[[${matchText}]]` : `[[${targetWithBlock}|${matchText}]]`;
                    }
                }

                // Store this replacement
                replacements.push({
                    index: matchIndex,
                    length: matchText.length,
                    original: matchText,
                    replacement: replacement,
                    lengthDiff: replacement.length - matchText.length
                });

                // Store change for preview
                const change = {
                    keyword: matchText,
                    target: target,
                    context: getContext(content, matchIndex)
                };
                if (pick) {
                    change.pickedFromContext = pick.confident
                        ? `Chosen from context (${pick.reasons.join('; ')}) over ${pick.others.join(', ')}`
                        : `Context unclear - used the first keyword's target over ${pick.others.join(', ')}`;
                }
                changes.push(change);

                // If tags are enabled, prepare to add tags
                if (enableTags) {
                    const tagName = sanitizeTagName(keyword);
                    tagsToAdd.add(tagName);

                    if (target !== file.basename) {
                        targetNotesForTags.set(target, tagName);
                    }
                }
            }

            // Apply replacements in reverse order to preserve indices
            for (let i = replacements.length - 1; i >= 0; i--) {
                const r = replacements[i];
                content = content.substring(0, r.index) +
                         r.replacement +
                         content.substring(r.index + r.length);
                linkCount++;
            }

            // Store replacements in forward order for cursor adjustment
            for (let i = 0; i < replacements.length; i++) {
                allReplacements.push({
                    index: replacements[i].index,
                    lengthDiff: replacements[i].lengthDiff
                });
            }
        }

        // Sort all replacements by their original index position
        allReplacements.sort((a, b) => a.index - b.index);

        // Add tags to current file if any (unless skipTags is true)
        if (tagsToAdd.size > 0 && !preview && !skipTags) {
            content = addTagsToContent(content, Array.from(tagsToAdd));
        }

        const changed = content !== originalContent;

        return {
            newContent: content,
            originalContent: originalContent,
            originalLength: originalLength,
            changed: changed,
            linkCount: linkCount,
            changes: changes,
            tagsToAdd: tagsToAdd,
            targetNotesForTags: targetNotesForTags,
            allReplacements: allReplacements
        };
    }

    async linkKeywordsInFile(file, preview = false, skipTags = false) {
        // SAFETY CHECK: Ensure we only process markdown files
        if (file.extension !== 'md') {
            return null;
        }

        // Check if this file is currently open in an editor
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        const isActiveFile = activeView && activeView.file.path === file.path;
        const editor = isActiveFile ? activeView.editor : null;

        // If auto-create is enabled, ensure all target notes exist before processing
        // This needs to happen before we enter the processing callback
        const keywordMap = buildKeywordMap(this.app, this.settings);
        if (this.settings.autoCreateNotes) {
            for (const keyword of Object.keys(keywordMap)) {
                const entries = [keywordMap[keyword], ...(keywordMap[keyword].alternatives || [])];
                for (const { target } of entries) {
                    if (target && target.trim()) {
                        await ensureNoteExists(this.app, this.settings, target);
                    }
                }
            }
        }

        // Read targets that share keyword text, so picking between them can use their body text
        await this.warmContextCache(keywordMap);

        let result = null;

        if (editor) {
            // File is open in editor - use editor.getValue()/setValue()
            const savedCursor = !preview ? editor.getCursor() : null;
            const currentContent = editor.getValue();

            // Process the content
            const processed = this.processContent(currentContent, file, preview, skipTags, keywordMap);

            if (!processed.changed) {
                return null;
            }

            // Save if not preview mode
            if (!preview) {
                // Calculate cursor position adjustment
                const lines = processed.originalContent.split('\n');
                let cursorOffset = 0;
                for (let i = 0; i < savedCursor.line && i < lines.length; i++) {
                    cursorOffset += lines[i].length + 1;
                }
                cursorOffset += savedCursor.ch;

                let cursorAdjustment = 0;
                for (const replacement of processed.allReplacements) {
                    if (replacement.index < cursorOffset) {
                        cursorAdjustment += replacement.lengthDiff;
                    }
                }

                let newCursorOffset = cursorOffset + cursorAdjustment;
                const wasCursorNearEnd = cursorOffset >= processed.originalLength - 10;

                // Apply changes via editor
                editor.setValue(processed.newContent);

                // Restore cursor position
                if (processed.tagsToAdd.size > 0 && wasCursorNearEnd) {
                    const newLines = processed.newContent.split('\n');
                    let lastContentLine = -1;

                    for (let i = newLines.length - 1; i >= 0; i--) {
                        const line = newLines[i].trim();
                        if (line !== '' && !line.match(/^#[\w\-]+(\s+#[\w\-]+)*$/)) {
                            lastContentLine = i;
                            break;
                        }
                    }

                    if (lastContentLine >= 0) {
                        editor.setCursor({
                            line: lastContentLine,
                            ch: newLines[lastContentLine].length
                        });
                    } else {
                        editor.setCursor({ line: 0, ch: 0 });
                    }
                } else {
                    const newLines = processed.newContent.split('\n');
                    let remainingOffset = newCursorOffset;
                    let newLine = 0;
                    let newCh = 0;

                    for (let i = 0; i < newLines.length; i++) {
                        if (remainingOffset <= newLines[i].length) {
                            newLine = i;
                            newCh = remainingOffset;
                            break;
                        }
                        remainingOffset -= newLines[i].length + 1;
                    }

                    editor.setCursor({ line: newLine, ch: newCh });
                }

                // Add tags to target notes
                if (!skipTags) {
                    for (const [targetNoteName, tagName] of processed.targetNotesForTags) {
                        await addTagToTargetNote(this.app, targetNoteName, tagName);
                    }
                }
            }

            result = {
                changed: true,
                linkCount: processed.linkCount,
                changes: processed.changes,
                preview: preview ? processed.newContent : null
            };

            if (skipTags && (processed.tagsToAdd.size > 0 || processed.targetNotesForTags.size > 0)) {
                result.pendingTags = {
                    tagsToAdd: Array.from(processed.tagsToAdd),
                    targetNotesForTags: processed.targetNotesForTags
                };
            }
        } else {
            // File not open in editor - use vault.process()
            let processed = null;

            await this.app.vault.process(file, (data) => {
                processed = this.processContent(data, file, preview, skipTags, keywordMap);

                if (!processed.changed || preview) {
                    // Return original data unchanged
                    return data;
                }

                // Return the new content to be saved
                return processed.newContent;
            });

            if (!processed || !processed.changed) {
                return null;
            }

            // Add tags to target notes (only if not preview and not skipTags)
            if (!preview && !skipTags) {
                for (const [targetNoteName, tagName] of processed.targetNotesForTags) {
                    await addTagToTargetNote(this.app, targetNoteName, tagName);
                }
            }

            result = {
                changed: true,
                linkCount: processed.linkCount,
                changes: processed.changes,
                preview: preview ? processed.newContent : null
            };

            if (skipTags && (processed.tagsToAdd.size > 0 || processed.targetNotesForTags.size > 0)) {
                result.pendingTags = {
                    tagsToAdd: Array.from(processed.tagsToAdd),
                    targetNotesForTags: processed.targetNotesForTags
                };
            }
        }

        return result;
    }
}

module.exports = KeywordLinker;
