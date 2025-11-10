const { MarkdownView } = require('obsidian');
const { escapeRegex, getContext } = require('../utils/helpers');
const { getFrontmatterBounds, isInsideAlias, isPartOfUrl, isInsideLinkOrCode, isInsideBlockReference, isInsideTable } = require('../utils/detection');
const { getEffectiveKeywordSettings, buildKeywordMap, checkLinkScope } = require('../utils/linking');
const { findTargetFile, getAliasesForNote, noteHasTag, noteHasLinkToTarget, ensureNoteExists } = require('../utils/noteManagement');
const { sanitizeTagName, addTagsToContent, addTagToTargetNote } = require('../utils/tagManagement');

class KeywordLinker {
    constructor(app, settings) {
        this.app = app;
        this.settings = settings;
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

        // Save cursor position if file is active
        let savedCursor = null;
        if (editor && !preview) {
            savedCursor = editor.getCursor();
        }

        // Read the file content
        let content = await this.app.vault.read(file);
        const originalContent = content;  // Store original for comparison
        const originalLength = content.length;

        // CRITICAL: Get frontmatter boundaries to skip that section
        const frontmatterBounds = getFrontmatterBounds(content);

        // Initialize tracking variables
        let linkCount = 0;
        let changes = [];
        let tagsToAdd = new Set(); // Track tags to add to this file
        let targetNotesForTags = new Map(); // Map of target note -> tag name

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
                // Get file basename without extension and normalize
                const currentFileBase = file.basename;
                // Compare with target (which may or may not have path)
                const targetBase = target.split('/').pop(); // Get just the filename from path
                if (currentFileBase === targetBase) {
                    continue; // Skip this keyword on its own target note
                }
            }

            // Check if we should only link in notes that already link to target
            if (onlyInNotesLinkingTo && !noteHasLinkToTarget(this.app, file, target)) {
                continue;
            }

            // Check if target note has required tag - skip this keyword if tag requirement not met
            if (!noteHasTag(this.app, target, requireTag)) {
                continue;
            }

            // Check link scope - skip this keyword if scope conditions aren't met
            if (!checkLinkScope(this.app, file, target, linkScope, scopeFolder, findTargetFile)) {
                continue;
            }

            // If auto-create is enabled, ensure the target note exists
            if (this.settings.autoCreateNotes) {
                await ensureNoteExists(this.app, this.settings, target);
            }

            const flags = this.settings.caseSensitive ? 'g' : 'gi';
            const escapedKeyword = escapeRegex(keyword);
            const pattern = new RegExp(`\\b${escapedKeyword}\\b`, flags);

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

                // CRITICAL FIX: Skip if preceded by # (hashtag)
                if (matchIndex > 0 && content[matchIndex - 1] === '#') {
                    continue;
                }

                // CRITICAL FIX: Skip if inside a block reference (^block-id)
                if (isInsideBlockReference(content, matchIndex)) {
                    continue;
                }

                // Check if this match is inside a link or code block
                if (isInsideLinkOrCode(content, matchIndex)) {
                    continue;
                }

                // Check if this match is inside an alias portion of a link
                if (isInsideAlias(content, matchIndex)) {
                    continue;
                }

                // Check if this match is part of a URL
                if (isPartOfUrl(content, matchIndex, matchText.length)) {
                    continue;
                }

                // Note: We DO allow linking inside tables - Obsidian supports wikilinks in tables

                // For firstOccurrenceOnly, skip if we already found this keyword
                if (this.settings.firstOccurrenceOnly) {
                    const keyLower = keyword.toLowerCase();

                    // Check if we already found this keyword in THIS execution
                    if (foundKeywords.has(keyLower)) {
                        break;  // Stop looking for this keyword
                    }

                    // Also check if the keyword is already linked or suggested in the document content
                    // This handles cases where the keyword was linked/suggested in a previous execution
                    const existingLinkPattern = this.settings.caseSensitive
                        ? new RegExp(`\\[\\[([^\\]]+\\|)?${escapeRegex(keyword)}\\]\\]`)
                        : new RegExp(`\\[\\[([^\\]]+\\|)?${escapeRegex(keyword)}\\]\\]`, 'i');

                    const existingSuggestPattern = this.settings.caseSensitive
                        ? new RegExp(`<span class="akl-suggested-link"[^>]*>${escapeRegex(keyword)}</span>`)
                        : new RegExp(`<span class="akl-suggested-link"[^>]*>${escapeRegex(keyword)}</span>`, 'i');

                    if (existingLinkPattern.test(content) || existingSuggestPattern.test(content)) {
                        break;  // Already linked or suggested in document, skip this keyword entirely
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
                    // Suggest mode: create HTML span instead of actual link
                    const escapedTarget = target.replace(/"/g, '&quot;');
                    const escapedBlock = blockRef.replace(/"/g, '&quot;');
                    const useRelative = useRelativeLinks ? 'true' : 'false';
                    replacement = `<span class="akl-suggested-link" data-target="${escapedTarget}" data-block="${escapedBlock}" data-use-relative="${useRelative}" data-keyword-index="${keywordIndex}">${matchText}</span>`;
                } else if (useRelativeLinks) {
                    // Use relative markdown link format: [text](Target%20Note.md#^block-id)
                    // Escape pipe characters in the display text if inside a table to prevent breaking table columns
                    const escapedMatchText = insideTable ? matchText.replace(/\|/g, '\\|') : matchText;
                    const encodedTarget = encodeURIComponent(target) + '.md';
                    const blockPart = blockRef ? `#${blockRef}` : '';
                    replacement = `[${escapedMatchText}](${encodedTarget}${blockPart})`;
                } else {
                    // Use wikilink format: [[target#^block-id|matchText]]
                    if (insideTable) {
                        // Inside tables: Escape the pipe with single backslash \| to prevent breaking table formatting
                        replacement = target === matchText && !blockRef ? `[[${matchText}]]` : `[[${targetWithBlock}\\|${matchText}]]`;
                    } else {
                        // Outside table: standard wikilink format with | separator for alias
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
                    break;  // Only find first occurrence
                }
            }

            // If keyword was found and tags are enabled, prepare to add tags
            if (keywordFoundInThisFile && enableTags) {
                const tagName = sanitizeTagName(keyword);
                tagsToAdd.add(tagName);

                // Only add to target notes if it's not the current file (avoid duplicate when editing target note itself)
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
            content = await addTagsToContent(content, Array.from(tagsToAdd));
        }

        // Check if content changed
        const changed = content !== originalContent;

        // Save if not preview mode
        if (!preview && changed) {
            if (editor && savedCursor) {
                // Get the current content from the editor (may have changed since we started)
                const currentEditorContent = editor.getValue();

                // If the editor content has changed from what we read, don't apply changes
                // This prevents overwriting content the user is actively typing
                if (currentEditorContent !== originalContent) {
                    return null;
                }

                // Calculate cursor position in original content as character offset
                const lines = originalContent.split('\n');
                let cursorOffset = 0;
                for (let i = 0; i < savedCursor.line && i < lines.length; i++) {
                    cursorOffset += lines[i].length + 1; // +1 for newline
                }
                cursorOffset += savedCursor.ch;

                // Calculate adjustment needed for cursor position
                // We need to account for ALL replacements that happened before the cursor
                // Replacements are sorted by original index position
                let cursorAdjustment = 0;
                for (const replacement of allReplacements) {
                    // Check if replacement starts before the original cursor position
                    if (replacement.index < cursorOffset) {
                        cursorAdjustment += replacement.lengthDiff;
                    }
                }

                // Calculate new cursor position in the content with keyword replacements
                let newCursorOffset = cursorOffset + cursorAdjustment;

                // Account for tag additions if cursor is at/near end
                const wasCursorNearEnd = cursorOffset >= originalLength - 10;

                // Replace entire content using editor
                editor.setValue(content);

                // If cursor was near the end and tags were added, keep it before the tags
                if (tagsToAdd.size > 0 && wasCursorNearEnd) {
                    // Find the last line with actual content (before tags)
                    const newLines = content.split('\n');
                    let lastContentLine = -1;

                    for (let i = newLines.length - 1; i >= 0; i--) {
                        const line = newLines[i].trim();
                        // Skip empty lines and tag lines
                        if (line !== '' && !line.match(/^#[\w\-]+(\s+#[\w\-]+)*$/)) {
                            lastContentLine = i;
                            break;
                        }
                    }

                    if (lastContentLine >= 0) {
                        // Place cursor at end of last content line
                        editor.setCursor({
                            line: lastContentLine,
                            ch: newLines[lastContentLine].length
                        });
                    } else {
                        // Fallback: place at start of document
                        editor.setCursor({ line: 0, ch: 0 });
                    }
                } else {
                    // Convert offset back to line/ch for normal cursor restoration
                    const newLines = content.split('\n');
                    let remainingOffset = newCursorOffset;
                    let newLine = 0;
                    let newCh = 0;

                    for (let i = 0; i < newLines.length; i++) {
                        if (remainingOffset <= newLines[i].length) {
                            newLine = i;
                            newCh = remainingOffset;
                            break;
                        }
                        remainingOffset -= newLines[i].length + 1; // +1 for newline
                    }

                    // Restore adjusted cursor position
                    editor.setCursor({ line: newLine, ch: newCh });
                }
            } else {
                // File not open in editor, use vault.modify
                await this.app.vault.modify(file, content);
            }

            // Add tags to target notes as well (unless skipTags is true)
            if (!skipTags) {
                for (const [targetNoteName, tagName] of targetNotesForTags) {
                    await addTagToTargetNote(this.app, targetNoteName, tagName);
                }
            }
        }

        // Return results
        if (changed) {
            const result = {
                changed: true,
                linkCount: linkCount,
                changes: changes,
                preview: preview ? content : null
            };

            // If skipTags is true and there are tags to add, include them in the result
            if (skipTags && (tagsToAdd.size > 0 || targetNotesForTags.size > 0)) {
                result.pendingTags = {
                    tagsToAdd: Array.from(tagsToAdd),
                    targetNotesForTags: targetNotesForTags
                };
            }

            return result;
        }

        return null;
    }
}

module.exports = KeywordLinker;
