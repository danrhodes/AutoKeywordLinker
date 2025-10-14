// Import required Obsidian API components
const { Plugin, PluginSettingTab, Setting, Notice, Modal, MarkdownView } = require('obsidian');

// Default settings that will be used when the plugin is first installed
const DEFAULT_SETTINGS = {
    // Array of keyword objects, each containing the keyword, target note, and variations
    keywords: [
        { keyword: 'Keyword1', target: 'Keyword1', variations: [], enableTags: false },
        { keyword: 'Keyword2', target: 'Keyword2', variations: [], enableTags: false }
    ],
    autoLinkOnSave: false,          // Whether to automatically link keywords when saving a note
    caseSensitive: false,            // Whether keyword matching should be case-sensitive
    firstOccurrenceOnly: true,       // Whether to link only the first occurrence of each keyword
    autoCreateNotes: true,           // Whether to automatically create notes that don't exist
    newNoteFolder: '',               // Folder where new notes will be created (empty = root)
    newNoteTemplate: '# {{keyword}}\n\nCreated: {{date}}\n\n',  // Template for new notes
    statistics: {                    // Statistics tracking
        totalLinksCreated: 0,
        totalNotesProcessed: 0,
        lastRunDate: null
    }
}

// Main plugin class - this is the entry point for the plugin
module.exports = class AutoKeywordLinker extends Plugin {
    
    /**
     * Called when the plugin is loaded
     * Sets up commands, settings, and event listeners
     */
    async onload() {
        // Load saved settings from disk (or use defaults if none exist)
        await this.loadSettings();

        // Register command: Link keywords in the currently active note
        this.addCommand({
            id: 'link-keywords-in-current-note',
            name: 'Link keywords in current note',
            callback: () => this.linkKeywordsInCurrentNote(false)  // false = not preview mode
        });

        // Register command: Preview keyword linking in the currently active note
        this.addCommand({
            id: 'preview-keywords-in-current-note',
            name: 'Preview keyword linking in current note',
            callback: () => this.linkKeywordsInCurrentNote(true)   // true = preview mode
        });

        // Register command: Link keywords in all notes in the vault
        this.addCommand({
            id: 'link-keywords-in-all-notes',
            name: 'Link keywords in all notes',
            callback: () => this.linkKeywordsInAllNotes(false)     // false = not preview mode
        });

        // Register command: Preview keyword linking in all notes
        this.addCommand({
            id: 'preview-keywords-in-all-notes',
            name: 'Preview keyword linking in all notes',
            callback: () => this.linkKeywordsInAllNotes(true)      // true = preview mode
        });

        // Register command: View statistics
        this.addCommand({
            id: 'view-statistics',
            name: 'View statistics',
            callback: () => this.showStatistics()
        });

        // Register command: Export keywords
        this.addCommand({
            id: 'export-keywords',
            name: 'Export keywords to JSON',
            callback: () => this.exportKeywords()
        });

        // Register command: Import keywords
        this.addCommand({
            id: 'import-keywords',
            name: 'Import keywords from JSON',
            callback: () => this.importKeywords()
        });

        // Add the settings tab to Obsidian's settings panel
        this.addSettingTab(new AutoKeywordLinkerSettingTab(this.app, this));

        // If auto-link on save is enabled, set up the event listener
        if (this.settings.autoLinkOnSave) {
            this.setupAutoLinkOnSave();
        }
    }

    /**
     * Show statistics modal
     */
    showStatistics() {
        new StatisticsModal(this.app, this.settings).open();
    }

    /**
     * Export keywords to JSON file
     */
    async exportKeywords() {
        try {
            const dataStr = JSON.stringify(this.settings.keywords, null, 2);
            const date = new Date().toISOString().split('T')[0];
            const filename = `auto-keyword-linker-export-${date}.json`;
            
            // Create file in vault root
            await this.app.vault.create(filename, dataStr);
            new Notice(`Keywords exported to ${filename}`);
        } catch (error) {
            new Notice(`Export failed: ${error.message}`);
        }
    }

    /**
     * Import keywords from JSON file
     */
    async importKeywords() {
        new ImportModal(this.app, this).open();
    }

    /**
     * Setup auto-link on save event listener
     */
    setupAutoLinkOnSave() {
        // Debounce timer for tag additions only
        let tagDebounceTimer = null;
        const pendingTagOperations = new Map(); // file path -> Set of tags
        const processingFiles = new Set(); // Track which files are currently being processed

        this.registerEvent(
            // Listen for file modification events
            this.app.vault.on('modify', (file) => {
                // CRITICAL: Only process markdown files, skip all attachments
                // Skip if we're currently processing this file to avoid recursion
                if (file.extension === 'md' && !processingFiles.has(file.path)) {
                    // Mark this file as being processed
                    processingFiles.add(file.path);

                    // Link keywords immediately (without adding tags)
                    this.linkKeywordsInFile(file, false, true).then(result => {
                        // Unmark the file
                        processingFiles.delete(file.path);
                        // If there are tags to add, accumulate them
                        if (result && result.pendingTags) {
                            // Get or create the pending tags entry for this file
                            if (!pendingTagOperations.has(file.path)) {
                                pendingTagOperations.set(file.path, {
                                    tagsToAdd: new Set(),
                                    targetNotesForTags: new Map()
                                });
                            }

                            const pending = pendingTagOperations.get(file.path);

                            // Accumulate tags (using Set to avoid duplicates)
                            result.pendingTags.tagsToAdd.forEach(tag => pending.tagsToAdd.add(tag));

                            // Accumulate target note tags
                            result.pendingTags.targetNotesForTags.forEach((tagName, noteName) => {
                                pending.targetNotesForTags.set(noteName, tagName);
                            });

                            // Clear existing timer
                            if (tagDebounceTimer) {
                                clearTimeout(tagDebounceTimer);
                            }

                            // Set new timer - add tags after 1 second of inactivity
                            tagDebounceTimer = setTimeout(async () => {
                                try {
                                    // Process all pending tag operations
                                    for (const [filePath, tagInfo] of pendingTagOperations.entries()) {
                                        const targetFile = this.app.vault.getAbstractFileByPath(filePath);
                                        if (targetFile && targetFile.extension === 'md') {
                                            // Mark file as being processed to prevent recursion
                                            processingFiles.add(filePath);

                                            await this.addTagsToFile(
                                                targetFile,
                                                Array.from(tagInfo.tagsToAdd),
                                                tagInfo.targetNotesForTags
                                            );

                                            // Unmark after a short delay to ensure modify event is ignored
                                            setTimeout(() => {
                                                processingFiles.delete(filePath);
                                            }, 100);
                                        }
                                    }
                                } finally {
                                    // Always clear the pending operations and timer
                                    pendingTagOperations.clear();
                                    tagDebounceTimer = null;
                                }
                            }, 1000); // 1 second delay
                        }
                    });
                }
            })
        );
    }

    /**
     * Link keywords in the currently active note
     * @param {boolean} preview - If true, show preview modal instead of applying changes
     */
    async linkKeywordsInCurrentNote(preview = false) {
        // Get the currently open file
        const activeFile = this.app.workspace.getActiveFile();
        
        // If no file is open, show error and return
        if (!activeFile) {
            new Notice('No active file');
            return;
        }
        
        // Process the file and get results
        const results = await this.linkKeywordsInFile(activeFile, preview);
        
        // If preview mode and we have results, show preview modal
        if (preview && results) {
            new PreviewModal(this.app, results, activeFile.basename).open();
        } 
        // If not preview mode and changes were made, show success message
        else if (!preview && results && results.changed) {
            new Notice(`Linked ${results.linkCount} keyword(s) in current note!`);
            
            // Update statistics
            this.settings.statistics.totalLinksCreated += results.linkCount;
            this.settings.statistics.totalNotesProcessed += 1;
            this.settings.statistics.lastRunDate = new Date().toISOString();
            await this.saveSettings();
        } 
        // If not preview mode and no changes were made, inform user
        else if (!preview) {
            new Notice('No keywords found to link');
        }
    }

    /**
     * Link keywords in all notes in the vault
     * @param {boolean} preview - If true, show preview modal instead of applying changes
     */
    async linkKeywordsInAllNotes(preview = false) {
        // Get all markdown files in the vault
        const files = this.app.vault.getMarkdownFiles();
        
        // Initialize counters
        let totalLinks = 0;        // Total number of links created
        let filesModified = 0;     // Number of files that were changed
        let previewResults = [];   // Array to store preview results
        
        // Process each file
        for (let file of files) {
            // CRITICAL FIX: Skip non-markdown files (attachments, etc.)
            if (file.extension !== 'md') {
                continue;
            }
            
            const results = await this.linkKeywordsInFile(file, preview);
            
            // If changes were made to this file
            if (results && results.changed) {
                filesModified++;
                totalLinks += results.linkCount;
                
                // If in preview mode, store results for the preview modal
                if (preview) {
                    previewResults.push({
                        fileName: file.basename,
                        ...results
                    });
                }
            }
        }
        
        // Update statistics if not preview mode
        if (!preview && filesModified > 0) {
            this.settings.statistics.totalLinksCreated += totalLinks;
            this.settings.statistics.totalNotesProcessed += filesModified;
            this.settings.statistics.lastRunDate = new Date().toISOString();
            await this.saveSettings();
        }
        
        // If preview mode and we have results, show bulk preview modal
        if (preview && previewResults.length > 0) {
            new BulkPreviewModal(this.app, previewResults, this).open();
        } 
        // If preview mode but no results, inform user
        else if (preview) {
            new Notice('No keywords found to link in any notes');
        } 
        // If not preview mode, show summary of changes
        else {
            new Notice(`Linked ${totalLinks} keyword(s) in ${filesModified} note(s)!`);
        }
    }

    /**
     * Process a single file and link keywords
     * @param {TFile} file - The file to process
     * @param {boolean} preview - If true, don't modify file, just return what would change
     * @param {boolean} skipTags - If true, don't add tags immediately, return them for later processing
     * @returns {Object|null} Results object with change information, or null if no changes
     */
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
        const frontmatterBounds = this.getFrontmatterBounds(content);
        
        // Initialize tracking variables
        let linkCount = 0;
        let changes = [];
        let tagsToAdd = new Set(); // Track tags to add to this file
        let targetNotesForTags = new Map(); // Map of target note -> tag name
        
        // Build a map of all keywords to their target notes
        const keywordMap = this.buildKeywordMap();
        
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
            
            // Skip empty keywords or targets
            if (!keyword.trim() || !target || !target.trim()) continue;
            
            // If auto-create is enabled, ensure the target note exists
            if (this.settings.autoCreateNotes) {
                await this.ensureNoteExists(target);
            }
            
            const flags = this.settings.caseSensitive ? 'g' : 'gi';
            const escapedKeyword = this.escapeRegex(keyword);
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
                
                // Check if this match is inside a link or code block
                if (this.isInsideLinkOrCode(content, matchIndex)) {
                    continue;
                }
                
                // Check if this match is inside an alias portion of a link
                if (this.isInsideAlias(content, matchIndex)) {
                    continue;
                }
                
                // Check if this match is part of a URL
                if (this.isPartOfUrl(content, matchIndex, matchText.length)) {
                    continue;
                }
                
                // For firstOccurrenceOnly, skip if we already found this keyword
                if (this.settings.firstOccurrenceOnly) {
                    const keyLower = keyword.toLowerCase();
                    if (foundKeywords.has(keyLower)) {
                        break;  // Stop looking for this keyword
                    }
                    foundKeywords.add(keyLower);
                }
                
                const replacement = target === matchText ? `[[${matchText}]]` : `[[${target}|${matchText}]]`;
                
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
                    context: this.getContext(content, matchIndex)
                });
                
                keywordFoundInThisFile = true;
                
                if (this.settings.firstOccurrenceOnly) {
                    break;  // Only find first occurrence
                }
            }
            
            // If keyword was found and tags are enabled, prepare to add tags
            if (keywordFoundInThisFile && enableTags) {
                const tagName = this.sanitizeTagName(keyword);
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
            content = await this.addTagsToContent(content, Array.from(tagsToAdd));
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
                    await this.addTagToTargetNote(targetNoteName, tagName);
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

    /**
     * Add tags to a file and its target notes (called after debounce)
     * @param {TFile} file - The file to add tags to
     * @param {Array} tagsToAdd - Array of tag names to add to the current file
     * @param {Map} targetNotesForTags - Map of target note names to tag names
     */
    async addTagsToFile(file, tagsToAdd, targetNotesForTags) {
        // Add tags to the current file
        if (tagsToAdd && tagsToAdd.length > 0) {
            // Check if this file is currently open in an editor
            const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
            const isActiveFile = activeView && activeView.file.path === file.path;
            const editor = isActiveFile ? activeView.editor : null;

            if (editor) {
                // Use editor to avoid "modified externally" warning
                // Read current editor content (which may have changed since we queued tags)
                const currentContent = editor.getValue();

                // Check if tags already exist in the current content
                const tagsAlreadyExist = tagsToAdd.every(tag => {
                    const tagRegex = new RegExp(`#${tag}\\b`);
                    return tagRegex.test(currentContent);
                });

                if (tagsAlreadyExist) {
                    // Tags already present, nothing to do
                    return;
                }

                // Determine what to append
                const existingTagsMatch = currentContent.match(/\n\n((?:#[\w\-]+\s*)+)$/);
                const existingTags = existingTagsMatch ?
                    existingTagsMatch[1].match(/#[\w\-]+/g).map(t => t.substring(1)) :
                    [];

                // Filter out tags that already exist
                const newTags = tagsToAdd.filter(tag => !existingTags.includes(tag));

                if (newTags.length === 0) {
                    return; // No new tags to add
                }

                // Format tags with #
                const tagString = newTags.map(tag => `#${tag}`).join(' ');

                // Use replaceRange to append tags at the end (safer than setValue)
                const lastLine = editor.lastLine();
                const lastLineLength = editor.getLine(lastLine).length;

                if (existingTags.length > 0) {
                    // Find the existing tag line by searching from the end
                    for (let i = lastLine; i >= Math.max(0, lastLine - 10); i--) {
                        const lineContent = editor.getLine(i);
                        if (lineContent.trim().match(/^#[\w\-]+(\s+#[\w\-]+)*$/)) {
                            // Found existing tag line, append to it
                            editor.replaceRange(` ${tagString}`, {line: i, ch: lineContent.length});
                            break;
                        }
                    }
                } else {
                    // Add new tag section at the end
                    editor.replaceRange(`\n\n${tagString}`, {line: lastLine, ch: lastLineLength});
                }
            } else {
                // File not open, use vault.modify
                let content = await this.app.vault.read(file);
                content = await this.addTagsToContent(content, tagsToAdd);
                await this.app.vault.modify(file, content);
            }
        }

        // Add tags to target notes
        if (targetNotesForTags && targetNotesForTags.size > 0) {
            for (const [targetNoteName, tagName] of targetNotesForTags) {
                await this.addTagToTargetNote(targetNoteName, tagName);
            }
        }
    }

    /**
     * Sanitize keyword into a valid tag name
     * Converts spaces to hyphens and removes invalid characters
     * @param {string} keyword - The keyword to convert
     * @returns {string} Sanitized tag name
     */
    sanitizeTagName(keyword) {
        return keyword
            .replace(/\s+/g, '-')  // Replace spaces with hyphens
            .replace(/[^\w\-]/g, '') // Remove invalid characters
            .toLowerCase();
    }

    /**
     * Add tags to the end of content
     * @param {string} content - The file content
     * @param {Array} tags - Array of tag names (without #)
     * @returns {string} Content with tags added
     */
    async addTagsToContent(content, tags) {
        // Check which tags already exist at the end of the document
        const existingTagsMatch = content.match(/\n\n((?:#[\w\-]+\s*)+)$/);
        const existingTags = existingTagsMatch ? 
            existingTagsMatch[1].match(/#[\w\-]+/g).map(t => t.substring(1)) : 
            [];
        
        // Filter out tags that already exist
        const newTags = tags.filter(tag => !existingTags.includes(tag));
        
        if (newTags.length === 0) {
            return content; // No new tags to add
        }
        
        // Format tags with #
        const tagString = newTags.map(tag => `#${tag}`).join(' ');
        
        // Add tags to the end
        if (existingTags.length > 0) {
            // Append to existing tags
            content = content.replace(/\n\n((?:#[\w\-]+\s*)+)$/, `\n\n$1 ${tagString}`);
        } else {
            // Add new tag section
            content = content.trimEnd() + `\n\n${tagString}`;
        }
        
        return content;
    }

    /**
     * Add a tag to a target note
     * @param {string} noteName - Name of the target note
     * @param {string} tagName - Tag to add (without #)
     */
    async addTagToTargetNote(noteName, tagName) {
        // Find the target note
        const files = this.app.vault.getMarkdownFiles();
        const targetFile = files.find(f => f.basename === noteName);
        
        if (!targetFile) {
            return; // Note doesn't exist
        }
        
        // Read the file
        let content = await this.app.vault.read(targetFile);
        
        // Check if tag already exists anywhere in the file
        const tagRegex = new RegExp(`#${tagName}\\b`);
        if (tagRegex.test(content)) {
            return; // Tag already exists
        }
        
        // Add the tag to the end
        content = await this.addTagsToContent(content, [tagName]);
        
        // Save the file
        await this.app.vault.modify(targetFile, content);
    }

    /**
     * Get the start and end positions of YAML frontmatter
     * @param {string} content - The full content
     * @returns {Object|null} Object with start and end positions, or null if no frontmatter
     */
    getFrontmatterBounds(content) {
        // Frontmatter must start at the very beginning of the file with ---
        if (!content.startsWith('---')) {
            return null;
        }
        
        // Find the closing ---
        const lines = content.split('\n');
        let endLine = -1;
        
        // Start from line 1 (skip the opening ---)
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '---' || lines[i].trim() === '...') {
                endLine = i;
                break;
            }
        }
        
        // If we found a closing delimiter
        if (endLine !== -1) {
            // Calculate character positions
            let endPos = 0;
            for (let i = 0; i <= endLine; i++) {
                endPos += lines[i].length + 1; // +1 for newline
            }
            
            return {
                start: 0,
                end: endPos
            };
        }
        
        return null;
    }

    /**
     * Check if a position is inside the alias portion of an Obsidian link
     * Format: [[target|alias]] - we want to skip text in the alias part
     * @param {string} content - The full content
     * @param {number} index - Position to check
     * @returns {boolean} True if inside alias portion of a link
     */
    isInsideAlias(content, index) {
        // Look backwards to find [[ and check if there's a | between [[ and our position
        let foundOpenBracket = false;
        let foundPipe = false;
        
        // Search backwards from our position (up to 500 chars)
        for (let i = index - 1; i >= Math.max(0, index - 500); i--) {
            // If we find ]] going backwards, we're not in a link
            if (i > 0 && content[i] === ']' && content[i - 1] === ']') {
                return false;
            }
            
            // If we find a pipe going backwards, mark it
            if (content[i] === '|' && !foundPipe) {
                foundPipe = true;
            }
            
            // If we find [[ going backwards
            if (i < content.length - 1 && content[i] === '[' && content[i + 1] === '[') {
                foundOpenBracket = true;
                break;
            }
            
            // If we hit a newline, stop searching
            if (content[i] === '\n') {
                return false;
            }
        }
        
        // If we found [[ and a | between [[ and our position, check if ]] is ahead
        if (foundOpenBracket && foundPipe) {
            // Look forward to confirm there's a ]] ahead
            for (let i = index; i < Math.min(content.length, index + 500); i++) {
                if (i < content.length - 1 && content[i] === ']' && content[i + 1] === ']') {
                    // We're inside [[...|alias]] structure
                    return true;
                }
                if (content[i] === '\n') {
                    break;
                }
            }
        }
        
        return false;
    }

    /**
     * Check if a position is part of a URL
     * Detects various URL formats including protocol-based and domain-only URLs
     * @param {string} content - The full content
     * @param {number} index - Position to check
     * @param {number} length - Length of the matched text
     * @returns {boolean} True if part of a URL
     */
    isPartOfUrl(content, index, length) {
        // Get surrounding context (500 chars before and after)
        const contextStart = Math.max(0, index - 500);
        const contextEnd = Math.min(content.length, index + length + 500);
        const contextBefore = content.substring(contextStart, index);
        const contextAfter = content.substring(index + length, contextEnd);
        const matchText = content.substring(index, index + length);
        const fullContext = contextBefore + matchText + contextAfter;
        
        // Calculate position in context
        const posInContext = index - contextStart;
        
        // Pattern 1: Check for protocol-based URLs (http://, https://, ftp://, etc.)
        const protocolPattern = /(?:https?|ftp|ftps|sftp|file):\/\/[^\s\]]+/gi;
        let match;
        while ((match = protocolPattern.exec(fullContext)) !== null) {
            const matchStart = match.index;
            const matchEnd = match.index + match[0].length;
            // Check if our position is within this URL
            if (posInContext >= matchStart && posInContext < matchEnd) {
                return true;
            }
        }
        
        // Pattern 2: Check for www. URLs
        const wwwPattern = /\bwww\.[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+[^\s\])"]*/gi;
        while ((match = wwwPattern.exec(fullContext)) !== null) {
            const matchStart = match.index;
            const matchEnd = match.index + match[0].length;
            if (posInContext >= matchStart && posInContext < matchEnd) {
                return true;
            }
        }
        
        // Pattern 3: Check for domain.tld pattern (more conservative)
        // Common TLDs including country codes
        const domainPattern = /\b[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)*\.(com|org|net|edu|gov|mil|int|info|biz|name|museum|coop|aero|asia|cat|jobs|mobi|travel|xxx|pro|tel|post|co\.uk|co\.jp|co\.kr|co\.nz|co\.au|co\.za|co\.in|co\.id|co\.th|co\.il|ac\.uk|gov\.uk|org\.uk|de|fr|it|es|nl|be|ch|at|se|no|dk|fi|ie|pl|cz|hu|ro|bg|gr|pt|ru|ua|sk|si|hr|lt|lv|ee|cn|jp|kr|tw|hk|sg|my|th|vn|id|ph|in|pk|bd|lk|np|af|au|nz|fj|ca|mx|br|ar|cl|co|pe|ve|ec|uy|py|bo|cr|pa|gt|hn|ni|sv|cu|do|jm|tt|bs|bb|za|eg|ng|ke|gh|tz|ug|zw|ma|dz|tn|sn|ci|cm|ao|mz|na|bw|mw|zm|rw|so|sd|et|ly|iq|ir|sa|ae|kw|qa|om|ye|jo|lb|sy|il|ps|tr|am|az|ge|kz|uz|tm|tj|kg|mn|io|ai|sh|tv|me|cc|ws|to|ly|gl|gd|ms|vg|ag|lc|vc|dm|kn|gp|mq|aw|cw|sx|bq|tc|ky|bm|pr|vi)(?:\b|\/|:|\?|#|$)/gi;
        while ((match = domainPattern.exec(fullContext)) !== null) {
            const matchStart = match.index;
            const matchEnd = match.index + match[0].length;
            if (posInContext >= matchStart && posInContext < matchEnd) {
                // Additional check: make sure there's no letter immediately before (to avoid false positives)
                if (matchStart === 0 || /[\s\(\[\{<"']/.test(fullContext[matchStart - 1])) {
                    return true;
                }
            }
        }
        
        // Pattern 4: Check if the matched text itself contains a domain pattern
        const simpleTldPattern = /\.(com|org|net|edu|gov|io|ai|me|tv|co|uk|de|fr|it|jp|cn|au|ca|br|in|ru)\b/i;
        if (simpleTldPattern.test(matchText)) {
            return true;
        }
        
        // Pattern 5: Look around the matched text for URL indicators
        // Check 100 chars before and after for URL context
        const localBefore = content.substring(Math.max(0, index - 100), index);
        const localAfter = content.substring(index + length, Math.min(content.length, index + length + 100));
        
        // Check if there's a protocol or www before our match (without whitespace)
        if (/(?:https?|ftp|ftps):\/\/[^\s]*$/.test(localBefore) || /www\.[^\s]*$/.test(localBefore)) {
            return true;
        }
        
        // Check if there's a TLD pattern after our match (without whitespace in between)
        if (/^\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?(?:\/|\?|#|:|\s|$)/.test(localAfter)) {
            return true;
        }
        
        return false;
    }

    /**
     * Check if a position in the content is inside a link or code block
     * @param {string} content - The full content
     * @param {number} index - Position to check
     * @returns {boolean} True if inside link or code
     */
    isInsideLinkOrCode(content, index) {
        // Look backwards to find if we're inside any kind of brackets
        let bracketDepth = 0;
        let insideBrackets = false;
        
        // Scan backwards from position
        for (let i = index - 1; i >= Math.max(0, index - 500); i--) {
            // Check for closing brackets ]]
            if (i > 0 && content[i] === ']' && content[i - 1] === ']') {
                bracketDepth--;
                i--; // Skip both brackets
                continue;
            }
            
            // Check for opening brackets [[ or ![[
            if (i < content.length - 1 && content[i] === '[' && content[i + 1] === '[') {
                bracketDepth++;
                // If we find an opening bracket and our depth is positive, we're inside
                if (bracketDepth > 0) {
                    insideBrackets = true;
                    break;
                }
                i--; // Skip both brackets
                continue;
            }
            
            // If we hit a newline with depth 0, we're not in brackets
            if (content[i] === '\n' && bracketDepth === 0) {
                break;
            }
        }
        
        if (insideBrackets) {
            return true;
        }
        
        // Check if inside code block `...`
        let backtickCount = 0;
        for (let i = 0; i < index; i++) {
            if (content[i] === '`') {
                backtickCount++;
            }
        }
        
        // If odd number of backticks before our position, we're inside code
        if (backtickCount % 2 === 1) {
            return true;
        }
        
        // Check if inside markdown link [text](url)
        let squareBracketDepth = 0;
        for (let i = index - 1; i >= Math.max(0, index - 300); i--) {
            if (content[i] === ']') {
                squareBracketDepth--;
            } else if (content[i] === '[') {
                squareBracketDepth++;
                // If we find [ and depth > 0, we might be in a markdown link
                if (squareBracketDepth > 0) {
                    // Check if there's ]( ahead of our position
                    for (let j = index; j < Math.min(content.length, index + 300); j++) {
                        if (content[j] === ']' && j < content.length - 1 && content[j + 1] === '(') {
                            return true;
                        }
                        if (content[j] === '\n') break;
                    }
                }
            } else if (content[i] === '\n') {
                break;
            }
        }
        
        return false;
    }

    /**
     * Build a map of all keywords (including variations) to their target notes and settings
     * @returns {Object} Map where keys are keywords/variations and values are objects with target and enableTags
     */
    buildKeywordMap() {
        const map = {};
        
        // Iterate through all keyword entries in settings
        for (let item of this.settings.keywords) {
            // Skip items with empty keyword or target
            if (!item.keyword || !item.keyword.trim() || !item.target || !item.target.trim()) {
                continue;
            }
            
            // Add the main keyword with its settings
            map[item.keyword] = {
                target: item.target,
                enableTags: item.enableTags || false
            };
            
            // Add all variations, all pointing to the same target with same settings
            if (item.variations && item.variations.length > 0) {
                for (let variation of item.variations) {
                    if (variation.trim()) {
                        map[variation] = {
                            target: item.target,
                            enableTags: item.enableTags || false
                        };
                    }
                }
            }
        }
        
        return map;
    }

    /**
     * Ensure a note exists, creating it if necessary
     * @param {string} noteName - Name of the note to ensure exists
     */
    async ensureNoteExists(noteName) {
        // FIXED: Search for existing note anywhere in vault first
        const existingFiles = this.app.vault.getMarkdownFiles();
        const existingFile = existingFiles.find(f => f.basename === noteName);
        
        // If file exists anywhere, we're done
        if (existingFile) {
            return;
        }
        
        // File doesn't exist, so create it in the specified folder
        const folder = this.settings.newNoteFolder || '';
        const path = folder ? `${folder}/${noteName}.md` : `${noteName}.md`;
        
        // Start with the template
        let content = this.settings.newNoteTemplate;
        
        // Replace template placeholders
        content = content.replace(/{{keyword}}/g, noteName);  // Replace {{keyword}} with note name
        content = content.replace(/{{date}}/g, new Date().toISOString().split('T')[0]);  // Replace {{date}} with today's date
        
        // Ensure the folder exists before creating the file
        if (folder) {
            const folderExists = this.app.vault.getAbstractFileByPath(folder);
            if (!folderExists) {
                await this.app.vault.createFolder(folder);
            }
        }
        
        // Create the new note
        await this.app.vault.create(path, content);
    }

    /**
     * Get surrounding context for a match (for preview display)
     * @param {string} content - The full content
     * @param {number} index - Position of the match
     * @param {number} contextLength - Number of characters to show on each side
     * @returns {string} Context string with ellipses
     */
    getContext(content, index, contextLength = 40) {
        const start = Math.max(0, index - contextLength);
        const end = Math.min(content.length, index + contextLength);
        return '...' + content.substring(start, end) + '...';
    }

    /**
     * Escape special regex characters in a string
     * @param {string} string - String to escape
     * @returns {string} Escaped string safe for use in regex
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Load plugin settings from disk
     */
    async loadSettings() {
        // Merge saved settings with defaults (in case new settings were added)
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        
        // Ensure statistics object exists
        if (!this.settings.statistics) {
            this.settings.statistics = DEFAULT_SETTINGS.statistics;
        }
        
        // Ensure enableTags field exists for all keywords
        if (this.settings.keywords) {
            for (let keyword of this.settings.keywords) {
                if (keyword.enableTags === undefined) {
                    keyword.enableTags = false;
                }
            }
        }
    }

    /**
     * Save plugin settings to disk
     */
    async saveSettings() {
        await this.saveData(this.settings);
    }
}

/**
 * Statistics Modal
 */
class StatisticsModal extends Modal {
    constructor(app, settings) {
        super(app);
        this.settings = settings;
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.createEl('h2', {text: 'Auto Keyword Linker Statistics'});
        
        const stats = this.settings.statistics;
        
        contentEl.createEl('p', {
            text: `Total Links Created: ${stats.totalLinksCreated || 0}`
        });
        
        contentEl.createEl('p', {
            text: `Total Notes Processed: ${stats.totalNotesProcessed || 0}`
        });
        
        contentEl.createEl('p', {
            text: `Total Keywords Configured: ${this.settings.keywords.length}`
        });
        
        if (stats.lastRunDate) {
            const date = new Date(stats.lastRunDate);
            contentEl.createEl('p', {
                text: `Last Run: ${date.toLocaleString()}`
            });
        }
        
        // Keyword usage breakdown
        contentEl.createEl('h3', {text: 'Configured Keywords'});
        const list = contentEl.createEl('ul');
        for (let keyword of this.settings.keywords) {
            const item = list.createEl('li');
            item.appendText(`${keyword.keyword} → ${keyword.target}`);
            if (keyword.variations && keyword.variations.length > 0) {
                item.appendText(` (${keyword.variations.length} variations)`);
            }
            if (keyword.enableTags) {
                item.appendText(` [Tags enabled]`);
            }
        }
        
        const closeBtn = contentEl.createEl('button', {text: 'Close'});
        closeBtn.style.marginTop = '20px';
        closeBtn.addEventListener('click', () => this.close());
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}

/**
 * Import Modal
 */
class ImportModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.createEl('h2', {text: 'Import Keywords from JSON'});
        
        contentEl.createEl('p', {
            text: 'Select a JSON file from your vault to import keywords. This will ADD to your existing keywords.'
        });
        
        // Get all JSON files in vault
        const jsonFiles = this.app.vault.getFiles().filter(f => f.extension === 'json');
        
        if (jsonFiles.length === 0) {
            contentEl.createEl('p', {
                text: 'No JSON files found in vault. Please create an export first.',
                cls: 'mod-warning'
            });
            
            const closeBtn = contentEl.createEl('button', {text: 'Close'});
            closeBtn.addEventListener('click', () => this.close());
            return;
        }
        
        const dropdown = contentEl.createEl('select');
        dropdown.style.width = '100%';
        dropdown.style.marginBottom = '10px';
        
        for (let file of jsonFiles) {
            const option = dropdown.createEl('option', {
                text: file.path,
                value: file.path
            });
        }
        
        const buttonDiv = contentEl.createDiv();
        buttonDiv.style.display = 'flex';
        buttonDiv.style.gap = '10px';
        buttonDiv.style.marginTop = '20px';
        
        const importBtn = buttonDiv.createEl('button', {text: 'Import', cls: 'mod-cta'});
        importBtn.addEventListener('click', async () => {
            const selectedPath = dropdown.value;
            const file = this.app.vault.getAbstractFileByPath(selectedPath);
            
            if (file) {
                try {
                    const content = await this.app.vault.read(file);
                    const imported = JSON.parse(content);
                    
                    if (!Array.isArray(imported)) {
                        new Notice('Invalid JSON format: expected an array of keywords');
                        return;
                    }
                    
                    // Add imported keywords to existing ones
                    for (let item of imported) {
                        // Ensure enableTags field exists
                        if (item.enableTags === undefined) {
                            item.enableTags = false;
                        }
                        this.plugin.settings.keywords.push(item);
                    }
                    
                    await this.plugin.saveSettings();
                    new Notice(`Imported ${imported.length} keyword(s)`);
                    this.close();
                    
                    // Refresh settings tab if open
                    this.app.setting.close();
                    this.app.setting.open();
                    this.app.setting.openTabById(this.plugin.manifest.id);
                } catch (error) {
                    new Notice(`Import failed: ${error.message}`);
                }
            }
        });
        
        const closeBtn = buttonDiv.createEl('button', {text: 'Cancel'});
        closeBtn.addEventListener('click', () => this.close());
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}

/**
 * Modal for previewing changes to a single note
 */
class PreviewModal extends Modal {
    /**
     * @param {App} app - Obsidian app instance
     * @param {Object} results - Results object from linkKeywordsInFile
     * @param {string} fileName - Name of the file being previewed
     */
    constructor(app, results, fileName) {
        super(app);
        this.results = results;
        this.fileName = fileName;
    }

    /**
     * Called when the modal is opened
     * Builds the modal content
     */
    onOpen() {
        const {contentEl} = this;
        
        // Add title showing which file is being previewed
        contentEl.createEl('h2', {text: `Preview: ${this.fileName}`});
        
        // Show count of keywords found
        contentEl.createEl('p', {text: `Found ${this.results.linkCount} keyword(s) to link:`});
        
        // Create list of changes
        const list = contentEl.createEl('ul');
        for (let change of this.results.changes) {
            const item = list.createEl('li');
            
            // Show the keyword in bold
            item.createEl('strong', {text: change.keyword});
            item.appendText(` → `);
            
            // Show what it will be linked to
            item.createEl('code', {text: `[[${change.target}]]`});
            item.createEl('br');
            
            // Show surrounding context
            item.createEl('small', {text: change.context, cls: 'preview-context'});
        }
        
        // Create button container
        const buttonDiv = contentEl.createDiv({cls: 'modal-button-container'});
        buttonDiv.style.marginTop = '20px';
        buttonDiv.style.display = 'flex';
        buttonDiv.style.gap = '10px';
        
        // Add close button
        const closeBtn = buttonDiv.createEl('button', {text: 'Close'});
        closeBtn.addEventListener('click', () => this.close());
    }

    /**
     * Called when the modal is closed
     * Clean up the modal content
     */
    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}

/**
 * Modal for previewing changes to multiple notes (bulk operation)
 */
class BulkPreviewModal extends Modal {
    /**
     * @param {App} app - Obsidian app instance
     * @param {Array} results - Array of result objects from linkKeywordsInFile
     * @param {Plugin} plugin - Reference to the plugin instance (for applying changes)
     */
    constructor(app, results, plugin) {
        super(app);
        this.results = results;
        this.plugin = plugin;
    }

    /**
     * Called when the modal is opened
     * Builds the modal content
     */
    onOpen() {
        const {contentEl} = this;
        contentEl.createEl('h2', {text: 'Preview: All Notes'});
        
        // Calculate and show total statistics
        const totalLinks = this.results.reduce((sum, r) => sum + r.linkCount, 0);
        contentEl.createEl('p', {text: `Found ${totalLinks} keyword(s) to link in ${this.results.length} note(s):`});
        
        // Create scrollable container for results
        const scrollDiv = contentEl.createDiv({cls: 'preview-scroll'});
        scrollDiv.style.maxHeight = '400px';
        scrollDiv.style.overflowY = 'auto';
        scrollDiv.style.marginBottom = '20px';
        
        // Display results for each file
        for (let result of this.results) {
            const noteDiv = scrollDiv.createDiv({cls: 'preview-note'});
            noteDiv.style.marginBottom = '15px';
            
            // File name as heading
            noteDiv.createEl('h3', {text: result.fileName});
            
            // Number of links to be created
            noteDiv.createEl('p', {text: `${result.linkCount} link(s)`});
            
            // Show first 5 changes
            const list = noteDiv.createEl('ul');
            for (let change of result.changes.slice(0, 5)) {
                const item = list.createEl('li');
                item.createEl('strong', {text: change.keyword});
                item.appendText(` → `);
                item.createEl('code', {text: `[[${change.target}]]`});
            }
            
            // If there are more than 5 changes, show count of remaining
            if (result.changes.length > 5) {
                noteDiv.createEl('p', {text: `... and ${result.changes.length - 5} more`});
            }
        }
        
        // Create button container
        const buttonDiv = contentEl.createDiv({cls: 'modal-button-container'});
        buttonDiv.style.display = 'flex';
        buttonDiv.style.gap = '10px';
        
        // Add "Apply Changes" button (primary action)
        const applyBtn = buttonDiv.createEl('button', {text: 'Apply Changes', cls: 'mod-cta'});
        applyBtn.addEventListener('click', async () => {
            this.close();
            // Actually perform the linking operation
            await this.plugin.linkKeywordsInAllNotes(false);
        });
        
        // Add "Cancel" button
        const closeBtn = buttonDiv.createEl('button', {text: 'Cancel'});
        closeBtn.addEventListener('click', () => this.close());
    }

    /**
     * Called when the modal is closed
     * Clean up the modal content
     */
    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}

/**
 * Settings tab for the plugin
 * Appears in Obsidian's settings under Plugin Options
 */
class AutoKeywordLinkerSettingTab extends PluginSettingTab {
    /**
     * @param {App} app - Obsidian app instance
     * @param {Plugin} plugin - Reference to the plugin instance
     */
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    /**
     * Display the settings tab
     * Called when the user opens the settings
     */
    display() {
        const {containerEl} = this;
        containerEl.empty();  // Clear any existing content

        // Main heading
        containerEl.createEl('h2', {text: 'Auto Keyword Linker Settings'});

        // Keywords section
        containerEl.createEl('h3', {text: 'Keywords & Variations'});
        containerEl.createEl('p', {text: 'Define keywords and their variations. All variations will link to the target note.'});

        // Container for keyword list
        const keywordsDiv = containerEl.createDiv({cls: 'keywords-container'});
        
        // Render all current keywords
        this.renderKeywords(keywordsDiv);

        // Add button to create new keyword entries
        const addBtn = containerEl.createEl('button', {text: '+ Add Keyword'});
        addBtn.style.marginTop = '10px';
        addBtn.addEventListener('click', () => {
            // Add empty keyword object to settings
            this.plugin.settings.keywords.push({
                keyword: '',
                target: '',
                variations: [],
                enableTags: false
            });
            // Re-render the display to show new entry
            this.display();
        });

        // General settings section
        containerEl.createEl('h3', {text: 'General Settings'});

        // First occurrence only toggle
        new Setting(containerEl)
            .setName('First occurrence only')
            .setDesc('Link only the first mention of each keyword per note')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.firstOccurrenceOnly)
                .onChange(async (value) => {
                    this.plugin.settings.firstOccurrenceOnly = value;
                    await this.plugin.saveSettings();
                }));

        // Case sensitive toggle
        new Setting(containerEl)
            .setName('Case sensitive')
            .setDesc('Match keywords with exact case')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.caseSensitive)
                .onChange(async (value) => {
                    this.plugin.settings.caseSensitive = value;
                    await this.plugin.saveSettings();
                }));

        // Auto-create notes toggle
        new Setting(containerEl)
            .setName('Auto-create notes')
            .setDesc('Automatically create target notes if they don\'t exist')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoCreateNotes)
                .onChange(async (value) => {
                    this.plugin.settings.autoCreateNotes = value;
                    await this.plugin.saveSettings();
                }));

        // New note folder setting
        new Setting(containerEl)
            .setName('New note folder')
            .setDesc('Folder where new notes will be created (leave empty for root)')
            .addText(text => text
                .setPlaceholder('My Notes')
                .setValue(this.plugin.settings.newNoteFolder)
                .onChange(async (value) => {
                    this.plugin.settings.newNoteFolder = value;
                    await this.plugin.saveSettings();
                }));

        // New note template setting
        new Setting(containerEl)
            .setName('New note template')
            .setDesc('Template for auto-created notes. Use {{keyword}} and {{date}} as placeholders.')
            .addTextArea(text => text
                .setPlaceholder('# {{keyword}}\n\nCreated: {{date}}')
                .setValue(this.plugin.settings.newNoteTemplate)
                .onChange(async (value) => {
                    this.plugin.settings.newNoteTemplate = value;
                    await this.plugin.saveSettings();
                }));

        // Auto-link on save toggle
        new Setting(containerEl)
            .setName('Auto-link on save')
            .setDesc('Automatically link keywords when you save a note (requires reload)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoLinkOnSave)
                .onChange(async (value) => {
                    this.plugin.settings.autoLinkOnSave = value;
                    await this.plugin.saveSettings();
                    new Notice('Please reload the plugin for this change to take effect');
                }));
    }

    /**
     * Render the list of keywords with their settings
     * @param {HTMLElement} container - Container element to render into
     */
    renderKeywords(container) {
        container.empty();  // Clear existing content

        // Iterate through all keyword entries
        for (let i = 0; i < this.plugin.settings.keywords.length; i++) {
            const item = this.plugin.settings.keywords[i];
            
            // Create container for this keyword entry with border
            const itemDiv = container.createDiv({cls: 'keyword-item'});
            itemDiv.style.border = '1px solid var(--background-modifier-border)';
            itemDiv.style.padding = '10px';
            itemDiv.style.marginBottom = '10px';
            itemDiv.style.borderRadius = '5px';

            // Keyword input field
            new Setting(itemDiv)
                .setName('Keyword')
                .setDesc('The text to search for')
                .addText(text => text
                    .setValue(item.keyword)
                    .onChange(async (value) => {
                        this.plugin.settings.keywords[i].keyword = value;
                        // If target is empty, auto-fill it with the keyword
                        if (!this.plugin.settings.keywords[i].target) {
                            this.plugin.settings.keywords[i].target = value;
                        }
                        await this.plugin.saveSettings();
                    }));

            // Target note input field
            new Setting(itemDiv)
                .setName('Target note')
                .setDesc('The note name to link to')
                .addText(text => text
                    .setValue(item.target)
                    .onChange(async (value) => {
                        this.plugin.settings.keywords[i].target = value;
                        await this.plugin.saveSettings();
                    }));

            // Variations text area (comma-separated)
            new Setting(itemDiv)
                .setName('Variations')
                .setDesc('Alternative spellings that also link to target (comma-separated)')
                .addTextArea(text => text
                    .setPlaceholder('Variation1,Variation2')
                    .setValue(item.variations ? item.variations.join(', ') : '')
                    .onChange(async (value) => {
                        // Parse comma-separated list into array
                        this.plugin.settings.keywords[i].variations = value
                            .split(',')
                            .map(v => v.trim())  // Remove whitespace
                            .filter(v => v.length > 0);  // Remove empty strings
                        await this.plugin.saveSettings();
                    }));

            // Enable tags checkbox
            new Setting(itemDiv)
                .setName('Enable tags')
                .setDesc('Add tags to both the source and target notes when this keyword is linked')
                .addToggle(toggle => toggle
                    .setValue(item.enableTags || false)
                    .onChange(async (value) => {
                        this.plugin.settings.keywords[i].enableTags = value;
                        await this.plugin.saveSettings();
                    }));

            // Delete button for this keyword entry
            const deleteBtn = itemDiv.createEl('button', {text: 'Delete', cls: 'mod-warning'});
            deleteBtn.style.marginTop = '10px';
            deleteBtn.addEventListener('click', async () => {
                // Remove this keyword from the array
                this.plugin.settings.keywords.splice(i, 1);
                await this.plugin.saveSettings();
                // Re-render to show updated list
                this.display();
            });
        }
    }
}