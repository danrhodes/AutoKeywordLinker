const { MarkdownView } = require('obsidian');
const { escapeRegex, getContext } = require('../utils/helpers');
const { getFrontmatterBounds, isInsideAlias, isPartOfUrl, isInsideLinkOrCode, isInsideBlockReference, isInsideTable, isInsideMath } = require('../utils/detection');
const { getEffectiveKeywordSettings, buildKeywordMap, checkLinkScope } = require('../utils/linking');
const { findTargetFile, getAliasesForNote, noteHasTag, noteHasLinkToTarget, ensureNoteExists } = require('../utils/noteManagement');
const { sanitizeTagName, addTagsToContent, addTagToTargetNote } = require('../utils/tagManagement');

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

        // Build a map of all keywords to their target notes
        const keywordMap = buildKeywordMap(this.app, this.settings);

        // Sort keywords by length (longest first)
        const sortedKeywords = Object.keys(keywordMap).sort((a, b) => b.length - a.length);

        // Track found keywords for firstOccurrenceOnly mode
        const foundKeywords = new Set();

        // Track all replacements made (for cursor position adjustment)
        const allReplacements = [];

        // Process each keyword
        for (let keyword of sortedKeywords) {
            const target = keywordMap[keyword].target;
            const enableTags = keywordMap[keyword].enableTags;
            const linkScope = keywordMap[keyword].linkScope || 'vault-wide';
            const scopeFolder = keywordMap[keyword].scopeFolder || '';
            const useRelativeLinks = keywordMap[keyword].useRelativeLinks || false;
            const blockRef = keywordMap[keyword].blockRef || '';
            const requireTag = keywordMap[keyword].requireTag || '';
            const onlyInNotesLinkingTo = keywordMap[keyword].onlyInNotesLinkingTo || false;
            const suggestMode = keywordMap[keyword].suggestMode || false;
            const preventSelfLink = keywordMap[keyword].preventSelfLink || false;
            const keywordIndex = keywordMap[keyword].keywordIndex;

            // Skip empty keywords or targets
            if (!keyword.trim() || !target || !target.trim()) continue;

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

            const flags = this.settings.caseSensitive ? 'g' : 'gi';
            const escapedKeyword = escapeRegex(keyword);
            const startBoundary = /^\w/.test(keyword) ? '\\b' : '(?<![\\w])';
            const endBoundary = /\w$/.test(keyword) ? '\\b' : '(?![\\w])';
            const pattern = new RegExp(`${startBoundary}${escapedKeyword}${endBoundary}`, flags);

            let match;
            const replacements = [];
            let keywordFoundInThisFile = false;

            // Find all potential matches
            while ((match = pattern.exec(content)) !== null) {
                const matchIndex = match.index;
                const matchText = match[0];

                // CRITICAL: Skip if inside frontmatter
                if (frontmatterBounds && matchIndex >= frontmatterBounds.start && matchIndex < frontmatterBounds.end) {
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

                // For firstOccurrenceOnly, skip if we already found this keyword
                if (this.settings.firstOccurrenceOnly) {
                    const keyLower = keyword.toLowerCase();

                    if (foundKeywords.has(keyLower)) {
                        break;
                    }

                    const existingLinkPattern = this.settings.caseSensitive
                        ? new RegExp(`\\[\\[([^\\]]+\\|)?${escapeRegex(keyword)}\\]\\]`)
                        : new RegExp(`\\[\\[([^\\]]+\\|)?${escapeRegex(keyword)}\\]\\]`, 'i');

                    const existingSuggestPattern = this.settings.caseSensitive
                        ? new RegExp(`<span class="akl-suggested-link"[^>]*>${escapeRegex(keyword)}</span>`)
                        : new RegExp(`<span class="akl-suggested-link"[^>]*>${escapeRegex(keyword)}</span>`, 'i');

                    if (existingLinkPattern.test(content) || existingSuggestPattern.test(content)) {
                        break;
                    }

                    foundKeywords.add(keyLower);
                }

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

                keywordFoundInThisFile = true;

                if (this.settings.firstOccurrenceOnly) {
                    break;
                }
            }

            // If keyword was found and tags are enabled, prepare to add tags
            if (keywordFoundInThisFile && enableTags) {
                const tagName = sanitizeTagName(keyword);
                tagsToAdd.add(tagName);

                if (target !== file.basename) {
                    targetNotesForTags.set(target, tagName);
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
