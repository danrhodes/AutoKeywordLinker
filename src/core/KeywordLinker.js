const { MarkdownView } = require('obsidian');
const { escapeRegex, getContext } = require('../utils/helpers');
const { getFrontmatterBounds, getSuggestionSpanRanges, contentLinksToTarget, isInsideAlias, isPartOfUrl, isInsideLinkOrCode, isInsideBlockReference, isInsideTable, isInsideMath, isInsideHeading, isInsideFencedCodeBlock } = require('../utils/detection');
const { getEffectiveKeywordSettings, buildKeywordMap, checkLinkScope } = require('../utils/linking');
const { findTargetFile, getAliasesForNote, noteHasTag, noteHasLinkToTarget, ensureNoteExists } = require('../utils/noteManagement');
const { sanitizeTagName, addTagsToContent, addTagToTargetNote } = require('../utils/tagManagement');
const { getIgnoreList, isIgnored } = require('../utils/ignore');

class KeywordLinker {
    constructor(app, settings) {
        this.app = app;
        this.settings = settings;
    }

    /**
     * Process content and apply keyword linking transformations
     * This is the core processing logic, extracted so it can be used with both
     * editor.getValue()/setValue() and vault.process() patterns
     * @param {string} content - The content to process
     * @param {TFile} file - The file being processed (for context checks)
     * @param {boolean} preview - If true, don't track for actual changes
     * @param {boolean} skipTags - If true, don't add tags, just return pending tags
     * @returns {Object} Processing result with newContent, linkCount, changes, etc.
     */
    processContent(content, file, preview = false, skipTags = false) {
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
        const keywordMap = ignoreList.all ? {} : buildKeywordMap(this.app, this.settings);

        // Group keywords (including variations and aliases) by target note, so each target
        // is handled once - otherwise every variation/alias could add its own link to the same note
        const targetGroups = new Map(); // lowercase target -> { target, keywords: [] }
        for (const keyword of Object.keys(keywordMap)) {
            const target = keywordMap[keyword].target;
            if (!keyword.trim() || !target || !target.trim()) continue;
            // Skip keywords whose target or own text is in this note's ignore list
            if (isIgnored(ignoreList, target) || isIgnored(ignoreList, keyword)) continue;
            const key = target.toLowerCase();
            if (!targetGroups.has(key)) {
                targetGroups.set(key, { target, keywords: [] });
            }
            targetGroups.get(key).keywords.push(keyword);
        }

        // Longest keywords first, so longer phrases claim text before shorter overlapping ones
        const groups = Array.from(targetGroups.values());
        groups.forEach(group => group.keywords.sort((a, b) => b.length - a.length));
        groups.sort((a, b) => b.keywords[0].length - a.keywords[0].length);

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

            for (const keyword of group.keywords) {
                const keywordSettings = keywordMap[keyword];
                const linkScope = keywordSettings.linkScope || 'vault-wide';
                const scopeFolder = keywordSettings.scopeFolder || '';
                const requireTag = keywordSettings.requireTag || '';
                const onlyInNotesLinkingTo = keywordSettings.onlyInNotesLinkingTo || false;
                const preventSelfLink = keywordSettings.preventSelfLink || false;
                // Per-keyword skipCodeBlocks: null means inherit global, true/false overrides
                const perKeywordSkip = keywordSettings.skipCodeBlocks;
                const skipCodeBlocks = perKeywordSkip !== null && perKeywordSkip !== undefined
                    ? perKeywordSkip
                    : (this.settings.skipCodeBlocks || false);

                // Check self-link protection - skip if we're on the target note itself
                // Use global setting OR per-keyword setting
                if (this.settings.preventSelfLinkGlobal || preventSelfLink) {
                    const currentFileBase = file.basename;
                    const targetBase = target.split('/').pop();
                    if (currentFileBase === targetBase) {
                        continue;
                    }
                }

                // Check if we should only link in notes that already link to target
                if (onlyInNotesLinkingTo && !noteHasLinkToTarget(this.app, file, target)) {
                    continue;
                }

                // Check if target note has required tag
                if (!noteHasTag(this.app, target, requireTag)) {
                    continue;
                }

                // Check link scope
                if (!checkLinkScope(this.app, file, target, linkScope, scopeFolder, findTargetFile)) {
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

                    candidates.push({ index: matchIndex, matchText, keyword, keywordSettings });
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

            for (const { index: matchIndex, matchText, keyword, keywordSettings } of selected) {
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
                changes.push({
                    keyword: matchText,
                    target: target,
                    context: getContext(content, matchIndex)
                });

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
        if (this.settings.autoCreateNotes) {
            const keywordMap = buildKeywordMap(this.app, this.settings);
            for (const keyword of Object.keys(keywordMap)) {
                const target = keywordMap[keyword].target;
                if (target && target.trim()) {
                    await ensureNoteExists(this.app, this.settings, target);
                }
            }
        }

        let result = null;

        if (editor) {
            // File is open in editor - use editor.getValue()/setValue()
            const savedCursor = !preview ? editor.getCursor() : null;
            const currentContent = editor.getValue();

            // Process the content
            const processed = this.processContent(currentContent, file, preview, skipTags);

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
                processed = this.processContent(data, file, preview, skipTags);

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
