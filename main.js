// Import required Obsidian API components
const { Plugin, PluginSettingTab, Setting, Notice, Modal, MarkdownView } = require('obsidian');

// Stop words to exclude from keyword suggestions
const STOP_WORDS = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it',
    'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they',
    'have', 'had', 'what', 'when', 'where', 'who', 'which', 'why', 'how', 'all', 'each', 'every',
    'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'my', 'me', 'we',
    'us', 'our', 'your', 'their', 'his', 'her', 'i', 'you', 'do', 'does', 'did', 'am', 'been',
    'being', 'get', 'got', 'if', 'or', 'may', 'could', 'would', 'should', 'might', 'must', 'one',
    'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'there', 'then', 'these',
    'those', 'also', 'any', 'about', 'after', 'again', 'before', 'because', 'between', 'during',
    'through', 'under', 'over', 'above', 'below', 'up', 'down', 'out', 'off', 'into', 'since',
    'until', 'while', 'once', 'here', 'there', 'see', 'saw', 'seen', 'go', 'goes', 'going', 'gone',
    'went', 'want', 'wanted', 'make', 'made', 'use', 'used', 'using', 'day', 'days', 'way', 'ways',
    'thing', 'things', 'yes', 'no', 'okay', 'ok'
]);

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

        // Set up file watcher to detect settings changes from sync
        this.setupSettingsWatcher();

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

        // Register command: Suggest keywords
        this.addCommand({
            id: 'suggest-keywords',
            name: 'Suggest keywords from notes',
            callback: () => this.suggestKeywords()
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
     * Set up file watcher to detect settings changes from sync
     * This allows the plugin to automatically reload settings when synced from other devices
     */
    setupSettingsWatcher() {
        // Track if we're currently saving to prevent reload loops
        this.isSaving = false;

        // Use polling to check for settings changes since vault events don't fire for .obsidian files
        // Store the last known state of the settings
        let lastSettingsHash = JSON.stringify(this.settings.keywords);

        // Check for changes every 2 seconds
        this.registerInterval(
            window.setInterval(async () => {
                if (this.isSaving) {
                    // Skip check if we're currently saving
                    return;
                }

                try {
                    // Load the current data from disk
                    const diskData = await this.loadData();

                    if (diskData && diskData.keywords) {
                        const currentHash = JSON.stringify(diskData.keywords);

                        // Compare with our last known state
                        if (currentHash !== lastSettingsHash) {
                            console.log('Auto Keyword Linker: Settings changed externally, reloading...');

                            // Update our settings
                            this.settings = Object.assign({}, DEFAULT_SETTINGS, diskData);

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

                            // Update our hash
                            lastSettingsHash = currentHash;

                            // If settings tab is open, refresh it
                            const settingTab = this.app.setting?.activeTab;
                            if (settingTab instanceof AutoKeywordLinkerSettingTab) {
                                settingTab.display();
                            }

                            // Show a notice to inform the user
                            new Notice('Auto Keyword Linker: Settings synced from another device');
                        }
                    }
                } catch (error) {
                    // Ignore errors - file might be temporarily unavailable during sync
                    console.log('Auto Keyword Linker: Error checking for settings changes:', error);
                }
            }, 2000) // Check every 2 seconds
        );
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
     * Open the Suggested Keyword Builder modal
     */
    async suggestKeywords() {
        new SuggestedKeywordBuilderModal(this.app, this).open();
    }

    /**
     * Extract meaningful words from text
     * @param {string} text - Text to extract words from
     * @param {boolean} isTitle - Whether this is a title (affects processing)
     * @returns {Array} Array of normalized words
     */
    extractWordsFromText(text, isTitle = false) {
        const words = [];

        // Split by common delimiters
        let parts = text.split(/[\s\-_\/\\,;:]+/);

        for (let part of parts) {
            // Handle camelCase and PascalCase
            const subParts = part.split(/(?=[A-Z])/).filter(p => p.length > 0);

            for (let subPart of subParts) {
                // Clean and normalize
                let word = subPart.trim()
                    .replace(/[^\w\s]/g, '') // Remove special chars
                    .trim();

                if (word.length === 0) continue;

                // Normalize to Title Case
                word = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

                // Filter out stop words and short words
                if (word.length >= 3 && !STOP_WORDS.has(word.toLowerCase())) {
                    words.push(word);
                }
            }
        }

        return words;
    }

    /**
     * Extract meaningful phrases (2-4 words) from text
     * @param {string} text - Text to extract phrases from
     * @returns {Array} Array of normalized phrases
     */
    extractPhrasesFromText(text) {
        const phrases = [];

        // Split into sentences/lines
        const lines = text.split(/[.\n]/);

        for (let line of lines) {
            // Extract capitalized words (likely proper nouns/important terms)
            const words = line.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g);

            if (words) {
                for (let phrase of words) {
                    phrase = phrase.trim();

                    // Check if phrase contains stop words only
                    const phraseWords = phrase.split(/\s+/);
                    const hasNonStopWord = phraseWords.some(w => !STOP_WORDS.has(w.toLowerCase()));

                    if (hasNonStopWord && phrase.length >= 5) {
                        phrases.push(phrase);
                    }
                }
            }
        }

        return phrases;
    }

    /**
     * Analyze notes in the vault and extract keyword suggestions
     * @returns {Array} Array of suggestion objects with word, count, and notes
     */
    async analyzeNotesForKeywords() {
        const files = this.app.vault.getMarkdownFiles();
        const wordFrequency = new Map(); // word -> { count, notes: Set }
        const phraseFrequency = new Map(); // phrase -> { count, notes: Set }

        // Get existing keywords (normalized to lowercase for comparison)
        const existingKeywords = new Set(
            this.settings.keywords.map(k => k.keyword.toLowerCase())
        );

        // Add variations to existing keywords set
        for (let item of this.settings.keywords) {
            if (item.variations && item.variations.length > 0) {
                for (let variation of item.variations) {
                    existingKeywords.add(variation.toLowerCase());
                }
            }
        }

        // Process each file
        for (let file of files) {
            // Extract from note title
            const titleWords = this.extractWordsFromText(file.basename, true);
            const titlePhrases = this.extractPhrasesFromText(file.basename);

            // Add title words (weighted 3x)
            for (let word of titleWords) {
                if (!existingKeywords.has(word.toLowerCase())) {
                    if (!wordFrequency.has(word)) {
                        wordFrequency.set(word, { count: 0, notes: new Set() });
                    }
                    const data = wordFrequency.get(word);
                    data.count += 3; // Weight title words higher
                    data.notes.add(file.basename);
                }
            }

            // Add title phrases (weighted 3x)
            for (let phrase of titlePhrases) {
                if (!existingKeywords.has(phrase.toLowerCase())) {
                    if (!phraseFrequency.has(phrase)) {
                        phraseFrequency.set(phrase, { count: 0, notes: new Set() });
                    }
                    const data = phraseFrequency.get(phrase);
                    data.count += 3;
                    data.notes.add(file.basename);
                }
            }

            // Extract from note content (first 5000 chars)
            try {
                const content = await this.app.vault.read(file);
                const limitedContent = content.substring(0, 5000);

                // Remove frontmatter
                const contentWithoutFrontmatter = limitedContent.replace(/^---[\s\S]*?---\n/, '');

                const contentWords = this.extractWordsFromText(contentWithoutFrontmatter, false);
                const contentPhrases = this.extractPhrasesFromText(contentWithoutFrontmatter);

                // Add content words (normal weight)
                for (let word of contentWords) {
                    if (!existingKeywords.has(word.toLowerCase())) {
                        if (!wordFrequency.has(word)) {
                            wordFrequency.set(word, { count: 0, notes: new Set() });
                        }
                        const data = wordFrequency.get(word);
                        data.count += 1;
                        data.notes.add(file.basename);
                    }
                }

                // Add content phrases (normal weight)
                for (let phrase of contentPhrases) {
                    if (!existingKeywords.has(phrase.toLowerCase())) {
                        if (!phraseFrequency.has(phrase)) {
                            phraseFrequency.set(phrase, { count: 0, notes: new Set() });
                        }
                        const data = phraseFrequency.get(phrase);
                        data.count += 1;
                        data.notes.add(file.basename);
                    }
                }
            } catch (error) {
                // Skip files that can't be read
                console.log(`Error reading ${file.path}:`, error);
            }
        }

        // Combine words and phrases into suggestions
        const suggestions = [];

        // Add word suggestions
        for (let [word, data] of wordFrequency) {
            suggestions.push({
                keyword: word,
                count: data.count,
                notes: Array.from(data.notes).slice(0, 5), // Show max 5 notes
                totalNotes: data.notes.size
            });
        }

        // Add phrase suggestions
        for (let [phrase, data] of phraseFrequency) {
            suggestions.push({
                keyword: phrase,
                count: data.count,
                notes: Array.from(data.notes).slice(0, 5),
                totalNotes: data.notes.size
            });
        }

        // Sort by count (descending) then by keyword length (descending)
        suggestions.sort((a, b) => {
            if (b.count !== a.count) {
                return b.count - a.count;
            }
            return b.keyword.length - a.keyword.length;
        });

        return suggestions;
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

        // Process each file - note we're NOT using skipTags, so tags will be added immediately
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
        this.isSaving = true;
        await this.saveData(this.settings);
        // Reset flag after a short delay to ensure the modify event has been processed
        setTimeout(() => {
            this.isSaving = false;
        }, 100);
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
 * Suggested Keyword Builder Modal
 * Analyzes notes and suggests keywords to add
 */
class SuggestedKeywordBuilderModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        this.suggestions = [];
        this.selectedSuggestions = new Map(); // keyword -> { selected: boolean, addAsVariationTo: string|null }
        this.isAnalyzing = true;
        this.searchQuery = '';
    }

    async onOpen() {
        const {contentEl} = this;
        contentEl.addClass('akl-suggestion-modal');

        // Title
        contentEl.createEl('h2', {text: 'Suggested Keyword Builder'});

        // Status area
        const statusEl = contentEl.createDiv({cls: 'akl-status'});
        statusEl.createEl('p', {text: 'Analyzing your notes...', cls: 'akl-analyzing'});

        // Start analysis
        try {
            this.suggestions = await this.plugin.analyzeNotesForKeywords();
            this.isAnalyzing = false;

            // Update status
            statusEl.empty();
            statusEl.createEl('p', {
                text: `Found ${this.suggestions.length} suggestions from ${this.plugin.app.vault.getMarkdownFiles().length} notes`,
                cls: 'akl-stats'
            });

            // Initialize selection state
            for (let suggestion of this.suggestions) {
                this.selectedSuggestions.set(suggestion.keyword, {
                    selected: false,
                    addAsVariationTo: null
                });
            }

            // Render the suggestions UI
            this.renderSuggestions(contentEl);

        } catch (error) {
            statusEl.empty();
            statusEl.createEl('p', {
                text: `Error analyzing notes: ${error.message}`,
                cls: 'akl-error'
            });
            console.error('Error analyzing notes:', error);
        }
    }

    renderSuggestions(container) {
        // Search box
        const searchContainer = container.createDiv({cls: 'akl-search-container'});
        const searchInput = searchContainer.createEl('input', {
            type: 'text',
            placeholder: 'Search suggestions...',
            cls: 'akl-search-input'
        });
        searchInput.value = this.searchQuery;
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.refreshSuggestionList();
        });

        // Selection buttons
        const buttonRow = container.createDiv({cls: 'akl-button-row'});
        const selectAllBtn = buttonRow.createEl('button', {text: 'Select All', cls: 'akl-mini-button'});
        selectAllBtn.addEventListener('click', () => {
            for (let [keyword, state] of this.selectedSuggestions) {
                if (this.matchesSearch(keyword)) {
                    state.selected = true;
                }
            }
            this.refreshSuggestionList();
        });

        const deselectAllBtn = buttonRow.createEl('button', {text: 'Deselect All', cls: 'akl-mini-button'});
        deselectAllBtn.addEventListener('click', () => {
            for (let [keyword, state] of this.selectedSuggestions) {
                if (this.matchesSearch(keyword)) {
                    state.selected = false;
                }
            }
            this.refreshSuggestionList();
        });

        // Suggestions list container
        this.suggestionsListEl = container.createDiv({cls: 'akl-suggestions-list'});
        this.refreshSuggestionList();

        // Action buttons
        const actionRow = container.createDiv({cls: 'akl-action-row'});

        const addBtn = actionRow.createEl('button', {text: 'Add Selected Keywords', cls: 'mod-cta'});
        addBtn.addEventListener('click', () => this.addSelectedKeywords());

        const cancelBtn = actionRow.createEl('button', {text: 'Cancel'});
        cancelBtn.addEventListener('click', () => this.close());
    }

    matchesSearch(keyword) {
        if (!this.searchQuery) return true;
        return keyword.toLowerCase().includes(this.searchQuery.toLowerCase());
    }

    refreshSuggestionList() {
        if (!this.suggestionsListEl) return;

        this.suggestionsListEl.empty();

        // Filter suggestions based on search
        const filteredSuggestions = this.suggestions.filter(s => this.matchesSearch(s.keyword));

        if (filteredSuggestions.length === 0) {
            this.suggestionsListEl.createEl('p', {
                text: 'No suggestions match your search.',
                cls: 'akl-no-results'
            });
            return;
        }

        // Render each suggestion
        for (let suggestion of filteredSuggestions) {
            const state = this.selectedSuggestions.get(suggestion.keyword);

            const itemDiv = this.suggestionsListEl.createDiv({cls: 'akl-suggestion-item'});

            // Checkbox and label
            const headerDiv = itemDiv.createDiv({cls: 'akl-suggestion-header'});

            const checkbox = headerDiv.createEl('input', {type: 'checkbox', cls: 'akl-checkbox'});
            checkbox.checked = state.selected;
            checkbox.addEventListener('change', (e) => {
                state.selected = e.target.checked;
            });

            const labelDiv = headerDiv.createDiv({cls: 'akl-suggestion-label'});
            labelDiv.createSpan({text: suggestion.keyword, cls: 'akl-keyword-text'});
            labelDiv.createSpan({text: ` (${suggestion.totalNotes} notes)`, cls: 'akl-count-text'});

            // Notes preview
            if (suggestion.notes.length > 0) {
                const notesDiv = itemDiv.createDiv({cls: 'akl-notes-preview'});
                notesDiv.createEl('span', {text: 'In: ', cls: 'akl-notes-label'});
                notesDiv.createEl('span', {
                    text: suggestion.notes.join(', ') + (suggestion.totalNotes > 5 ? '...' : ''),
                    cls: 'akl-notes-list'
                });
            }

            // Variation selector
            const variationDiv = itemDiv.createDiv({cls: 'akl-variation-selector'});
            variationDiv.createEl('span', {text: 'Or add as variation to: ', cls: 'akl-variation-label'});

            const select = variationDiv.createEl('select', {cls: 'akl-variation-dropdown'});
            const noneOption = select.createEl('option', {value: '', text: '(None - add as new keyword)'});

            // Add existing keywords as options
            for (let existingKeyword of this.plugin.settings.keywords) {
                if (existingKeyword.keyword.toLowerCase() !== suggestion.keyword.toLowerCase()) {
                    select.createEl('option', {
                        value: existingKeyword.keyword,
                        text: existingKeyword.keyword
                    });
                }
            }

            select.value = state.addAsVariationTo || '';
            select.addEventListener('change', (e) => {
                state.addAsVariationTo = e.target.value || null;
                if (e.target.value) {
                    checkbox.checked = true;
                    state.selected = true;
                }
            });
        }
    }

    async addSelectedKeywords() {
        let addedCount = 0;
        let variationCount = 0;

        for (let [keyword, state] of this.selectedSuggestions) {
            if (!state.selected) continue;

            if (state.addAsVariationTo) {
                // Add as variation to existing keyword
                const existingKeyword = this.plugin.settings.keywords.find(
                    k => k.keyword === state.addAsVariationTo
                );
                if (existingKeyword) {
                    if (!existingKeyword.variations) {
                        existingKeyword.variations = [];
                    }
                    if (!existingKeyword.variations.includes(keyword)) {
                        existingKeyword.variations.push(keyword);
                        variationCount++;
                    }
                }
            } else {
                // Add as new keyword
                this.plugin.settings.keywords.push({
                    keyword: keyword,
                    target: keyword,
                    variations: [],
                    enableTags: false
                });
                addedCount++;
            }
        }

        // Save settings
        await this.plugin.saveSettings();

        // Show result
        let message = '';
        if (addedCount > 0 && variationCount > 0) {
            message = `Added ${addedCount} new keyword(s) and ${variationCount} variation(s)`;
        } else if (addedCount > 0) {
            message = `Added ${addedCount} new keyword(s)`;
        } else if (variationCount > 0) {
            message = `Added ${variationCount} variation(s)`;
        } else {
            message = 'No keywords selected';
        }

        new Notice(message);
        this.close();
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
                    
                    // Add imported keywords to existing ones, checking for duplicates
                    let addedCount = 0;
                    let mergedCount = 0;

                    for (let item of imported) {
                        // Ensure enableTags field exists
                        if (item.enableTags === undefined) {
                            item.enableTags = false;
                        }

                        // Check if this keyword already exists (case-insensitive)
                        const existingIndex = this.plugin.settings.keywords.findIndex(
                            k => k.keyword.toLowerCase() === item.keyword.toLowerCase()
                        );

                        if (existingIndex !== -1) {
                            // Keyword exists - merge variations
                            const existing = this.plugin.settings.keywords[existingIndex];

                            // Ensure variations arrays exist
                            if (!existing.variations) existing.variations = [];
                            if (!item.variations) item.variations = [];

                            // Merge variations, avoiding duplicates (case-insensitive)
                            const existingVariationsLower = existing.variations.map(v => v.toLowerCase());
                            const newVariations = item.variations.filter(
                                v => !existingVariationsLower.includes(v.toLowerCase())
                            );

                            if (newVariations.length > 0) {
                                existing.variations.push(...newVariations);
                                mergedCount++;
                            }
                        } else {
                            // New keyword - add it
                            this.plugin.settings.keywords.push(item);
                            addedCount++;
                        }
                    }
                    
                    await this.plugin.saveSettings();

                    // Build informative message
                    let message = '';
                    if (addedCount > 0 && mergedCount > 0) {
                        message = `Imported: ${addedCount} new keyword(s), merged variations into ${mergedCount} existing keyword(s)`;
                    } else if (addedCount > 0) {
                        message = `Imported ${addedCount} new keyword(s)`;
                    } else if (mergedCount > 0) {
                        message = `Merged variations into ${mergedCount} existing keyword(s)`;
                    } else {
                        message = `No new keywords or variations to import`;
                    }

                    new Notice(message);
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

        // Add custom CSS for improved UI
        this.addCustomStyles();

        // Main heading with stats
        const headerDiv = containerEl.createDiv({cls: 'akl-header'});
        headerDiv.createEl('h2', {text: 'Auto Keyword Linker Settings'});
        const statsSpan = headerDiv.createEl('span', {
            cls: 'akl-stats',
            text: `${this.plugin.settings.keywords.length} keyword${this.plugin.settings.keywords.length !== 1 ? 's' : ''} configured`
        });

        // Keywords section with improved header
        const keywordsHeader = containerEl.createDiv({cls: 'akl-section-header'});
        keywordsHeader.createEl('h3', {text: 'Keywords & Variations'});
        keywordsHeader.createEl('p', {
            text: 'Define keywords and their variations. All variations will link to the target note.',
            cls: 'akl-section-desc'
        });

        // Container for keyword list
        const keywordsDiv = containerEl.createDiv({cls: 'akl-keywords-container'});

        // Render all current keywords
        this.renderKeywords(keywordsDiv);

        // Add button to create new keyword entries
        const addBtnContainer = containerEl.createDiv({cls: 'akl-add-button-container'});
        const addBtn = addBtnContainer.createEl('button', {
            text: '+ Add Keyword',
            cls: 'mod-cta akl-add-button'
        });
        addBtn.addEventListener('click', () => {
            // Add empty keyword object to settings
            this.plugin.settings.keywords.push({
                keyword: '',
                target: '',
                variations: [],
                enableTags: false,
                collapsed: false
            });
            // Re-render the display to show new entry
            this.display();
        });

        // General settings section
        const generalHeader = containerEl.createDiv({cls: 'akl-section-header'});
        generalHeader.createEl('h3', {text: 'General Settings'});

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
     * Update card header title without full re-render
     * @param {HTMLElement} cardTitle - The card title element to update
     * @param {string} keyword - The keyword value
     * @param {string} target - The target value
     */
    updateCardHeader(cardTitle, keyword, target) {
        cardTitle.empty();
        const titleText = keyword || 'New Keyword';
        const targetText = target ? ` → ${target}` : '';
        cardTitle.createSpan({text: titleText, cls: 'akl-keyword-name'});
        if (targetText) {
            cardTitle.createSpan({text: targetText, cls: 'akl-target-name'});
        }
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

            // Initialize collapsed state if not set
            if (item.collapsed === undefined) {
                item.collapsed = false;
            }

            // Create card container for this keyword entry
            const cardDiv = container.createDiv({cls: 'akl-keyword-card'});

            // Card header with collapse toggle
            const cardHeader = cardDiv.createDiv({cls: 'akl-card-header'});

            // Collapse toggle button
            const collapseBtn = cardHeader.createDiv({cls: 'akl-collapse-btn'});
            collapseBtn.innerHTML = item.collapsed ? '▶' : '▼';
            collapseBtn.setAttribute('aria-label', item.collapsed ? 'Expand' : 'Collapse');
            collapseBtn.addEventListener('click', async () => {
                item.collapsed = !item.collapsed;
                await this.plugin.saveSettings();
                this.display();
            });

            // Card title area
            const cardTitle = cardHeader.createDiv({cls: 'akl-card-title'});
            const titleText = item.keyword || 'New Keyword';
            const targetText = item.target ? ` → ${item.target}` : '';
            cardTitle.createSpan({text: titleText, cls: 'akl-keyword-name'});
            if (targetText) {
                cardTitle.createSpan({text: targetText, cls: 'akl-target-name'});
            }

            // Card badges
            const cardBadges = cardHeader.createDiv({cls: 'akl-card-badges'});
            if (item.enableTags) {
                cardBadges.createSpan({text: 'Tags', cls: 'akl-badge akl-badge-tags'});
            }
            if (item.variations && item.variations.length > 0) {
                cardBadges.createSpan({
                    text: `${item.variations.length} var`,
                    cls: 'akl-badge akl-badge-variations'
                });
            }

            // Card body (collapsible)
            const cardBody = cardDiv.createDiv({cls: 'akl-card-body'});
            if (item.collapsed) {
                cardBody.style.display = 'none';
            }

            // Keyword input field
            new Setting(cardBody)
                .setName('Keyword')
                .setDesc('The text to search for in your notes')
                .addText(text => {
                    text.setValue(item.keyword)
                        .setPlaceholder('Enter keyword...')
                        .onChange(async (value) => {
                            this.plugin.settings.keywords[i].keyword = value;
                            await this.plugin.saveSettings();
                            // Update card header title without full re-render
                            this.updateCardHeader(cardTitle, value, this.plugin.settings.keywords[i].target);
                        });
                    text.inputEl.addClass('akl-input');

                    // Auto-fill target only when user leaves the field (on blur)
                    text.inputEl.addEventListener('blur', async () => {
                        // If target is empty, auto-fill it with the keyword
                        if (!this.plugin.settings.keywords[i].target && this.plugin.settings.keywords[i].keyword) {
                            this.plugin.settings.keywords[i].target = this.plugin.settings.keywords[i].keyword;
                            await this.plugin.saveSettings();
                            // Update card header and re-render to show the auto-filled target
                            this.display();
                        }
                    });
                });

            // Target note input field
            new Setting(cardBody)
                .setName('Target note')
                .setDesc('The note name to create links to')
                .addText(text => {
                    text.setValue(item.target)
                        .setPlaceholder('Target note name...')
                        .onChange(async (value) => {
                            this.plugin.settings.keywords[i].target = value;
                            await this.plugin.saveSettings();
                            // Update card header title without full re-render
                            this.updateCardHeader(cardTitle, this.plugin.settings.keywords[i].keyword, value);
                        });
                    text.inputEl.addClass('akl-input');
                });

            // Variations with chip-style interface
            const variationsContainer = cardBody.createDiv({cls: 'akl-variations-section'});
            variationsContainer.createEl('div', {
                text: 'Variations',
                cls: 'setting-item-name'
            });
            variationsContainer.createEl('div', {
                text: 'Alternative spellings that also link to the target note',
                cls: 'setting-item-description'
            });

            // Chips display area
            const chipsContainer = variationsContainer.createDiv({cls: 'akl-chips-container'});
            this.renderVariationChips(chipsContainer, item.variations || [], i);

            // Input for adding new variations
            const addVariationContainer = variationsContainer.createDiv({cls: 'akl-add-variation'});
            const variationInput = addVariationContainer.createEl('input', {
                type: 'text',
                placeholder: 'Type and press Enter to add...',
                cls: 'akl-variation-input'
            });

            variationInput.addEventListener('keydown', async (e) => {
                if (e.key === 'Enter' && variationInput.value.trim()) {
                    e.preventDefault();
                    const newVariation = variationInput.value.trim();
                    if (!item.variations) {
                        item.variations = [];
                    }
                    if (!item.variations.includes(newVariation)) {
                        item.variations.push(newVariation);
                        await this.plugin.saveSettings();
                        this.display();
                    }
                    variationInput.value = '';
                }
            });

            // Enable tags toggle
            new Setting(cardBody)
                .setName('Enable tags')
                .setDesc('Automatically add tags to source and target notes')
                .addToggle(toggle => toggle
                    .setValue(item.enableTags || false)
                    .onChange(async (value) => {
                        this.plugin.settings.keywords[i].enableTags = value;
                        await this.plugin.saveSettings();
                        this.display();
                    }));

            // Card footer with actions
            const cardFooter = cardBody.createDiv({cls: 'akl-card-footer'});

            // Delete button
            const deleteBtn = cardFooter.createEl('button', {
                text: 'Delete Keyword',
                cls: 'akl-delete-btn'
            });
            deleteBtn.addEventListener('click', async () => {
                // Remove this keyword from the array
                this.plugin.settings.keywords.splice(i, 1);
                await this.plugin.saveSettings();
                // Re-render to show updated list
                this.display();
            });
        }
    }

    /**
     * Render variation chips with remove buttons
     * @param {HTMLElement} container - Container for chips
     * @param {Array} variations - Array of variation strings
     * @param {number} keywordIndex - Index of the keyword in settings
     */
    renderVariationChips(container, variations, keywordIndex) {
        container.empty();

        if (variations.length === 0) {
            container.createSpan({
                text: 'No variations added yet',
                cls: 'akl-no-variations'
            });
            return;
        }

        variations.forEach((variation, varIndex) => {
            const chip = container.createDiv({cls: 'akl-chip'});
            chip.createSpan({text: variation, cls: 'akl-chip-text'});

            const removeBtn = chip.createSpan({text: '×', cls: 'akl-chip-remove'});
            removeBtn.setAttribute('aria-label', `Remove ${variation}`);
            removeBtn.addEventListener('click', async () => {
                this.plugin.settings.keywords[keywordIndex].variations.splice(varIndex, 1);
                await this.plugin.saveSettings();
                this.display();
            });
        });
    }

    /**
     * Add custom CSS styles for the improved UI
     */
    addCustomStyles() {
        // Check if styles already exist
        if (document.getElementById('akl-custom-styles')) {
            return;
        }

        const styleEl = document.createElement('style');
        styleEl.id = 'akl-custom-styles';
        styleEl.textContent = `
            /* Header */
            .akl-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5em;
                flex-wrap: wrap;
                gap: 0.5em;
            }

            .akl-stats {
                color: var(--text-muted);
                font-size: 0.9em;
                padding: 0.25em 0.75em;
                background: var(--background-secondary);
                border-radius: 12px;
            }

            /* Section Headers */
            .akl-section-header {
                margin-top: 2em;
                margin-bottom: 1em;
            }

            .akl-section-header h3 {
                margin-bottom: 0.25em;
            }

            .akl-section-desc {
                color: var(--text-muted);
                margin-top: 0;
            }

            /* Keywords Container */
            .akl-keywords-container {
                display: grid;
                gap: 1em;
                margin-bottom: 1em;
            }

            /* Keyword Card */
            .akl-keyword-card {
                border: 1px solid var(--background-modifier-border);
                border-radius: 8px;
                background: var(--background-primary);
                overflow: hidden;
                transition: box-shadow 0.2s ease, transform 0.2s ease;
            }

            .akl-keyword-card:hover {
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            /* Card Header */
            .akl-card-header {
                display: flex;
                align-items: center;
                gap: 0.75em;
                padding: 1em;
                background: var(--background-secondary);
                cursor: pointer;
                border-bottom: 1px solid var(--background-modifier-border);
            }

            .akl-card-header:hover {
                background: var(--background-modifier-hover);
            }

            .akl-collapse-btn {
                font-size: 0.8em;
                color: var(--text-muted);
                user-select: none;
                flex-shrink: 0;
                width: 20px;
                text-align: center;
            }

            .akl-card-title {
                flex: 1;
                display: flex;
                align-items: center;
                gap: 0.5em;
                font-weight: 500;
                flex-wrap: wrap;
            }

            .akl-keyword-name {
                color: var(--text-normal);
                font-size: 1.05em;
            }

            .akl-target-name {
                color: var(--text-muted);
                font-size: 0.9em;
            }

            .akl-card-badges {
                display: flex;
                gap: 0.5em;
                flex-wrap: wrap;
            }

            .akl-badge {
                padding: 0.25em 0.6em;
                border-radius: 10px;
                font-size: 0.75em;
                font-weight: 500;
                white-space: nowrap;
            }

            .akl-badge-tags {
                background: var(--color-accent);
                color: white;
            }

            .akl-badge-variations {
                background: var(--background-modifier-border);
                color: var(--text-muted);
            }

            /* Card Body */
            .akl-card-body {
                padding: 1em;
            }

            .akl-card-body .setting-item {
                border: none;
                padding: 0.75em 0;
            }

            .akl-input {
                width: 100%;
            }

            /* Variations Section */
            .akl-variations-section {
                padding: 0.75em 0;
                border-top: 1px solid var(--background-modifier-border);
                margin-top: 0.5em;
            }

            .akl-variations-section .setting-item-name {
                font-weight: 500;
                margin-bottom: 0.25em;
            }

            .akl-variations-section .setting-item-description {
                color: var(--text-muted);
                font-size: 0.85em;
                margin-bottom: 0.75em;
            }

            .akl-chips-container {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5em;
                margin-bottom: 0.75em;
                min-height: 2em;
                align-items: center;
            }

            .akl-chip {
                display: inline-flex;
                align-items: center;
                gap: 0.4em;
                padding: 0.35em 0.7em;
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 14px;
                font-size: 0.9em;
                transition: background-color 0.2s ease;
            }

            .akl-chip:hover {
                background: var(--background-modifier-hover);
            }

            .akl-chip-text {
                color: var(--text-normal);
            }

            .akl-chip-remove {
                color: var(--text-muted);
                font-size: 1.2em;
                line-height: 1;
                cursor: pointer;
                padding: 0 0.2em;
                border-radius: 50%;
                transition: color 0.2s ease, background-color 0.2s ease;
            }

            .akl-chip-remove:hover {
                color: var(--text-error);
                background: var(--background-modifier-error);
            }

            .akl-no-variations {
                color: var(--text-muted);
                font-style: italic;
                font-size: 0.9em;
            }

            .akl-add-variation {
                margin-top: 0.5em;
            }

            .akl-variation-input {
                width: 100%;
                padding: 0.5em;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background: var(--background-primary);
                color: var(--text-normal);
                font-size: 0.9em;
            }

            .akl-variation-input:focus {
                border-color: var(--color-accent);
                outline: none;
            }

            /* Card Footer */
            .akl-card-footer {
                display: flex;
                justify-content: flex-end;
                padding-top: 0.75em;
                margin-top: 0.75em;
                border-top: 1px solid var(--background-modifier-border);
            }

            .akl-delete-btn {
                padding: 0.5em 1em;
                background: transparent;
                color: var(--text-error);
                border: 1px solid var(--text-error);
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.9em;
                transition: background-color 0.2s ease, color 0.2s ease;
            }

            .akl-delete-btn:hover {
                background: var(--text-error);
                color: white;
            }

            /* Add Button Container */
            .akl-add-button-container {
                display: flex;
                justify-content: center;
                margin: 1.5em 0;
            }

            .akl-add-button {
                padding: 0.75em 1.5em;
                font-size: 1em;
            }

            /* Responsive Design */
            @media (min-width: 768px) {
                .akl-keywords-container {
                    grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
                }
            }

            @media (max-width: 767px) {
                /* Keep everything on one line on narrow screens */
                .akl-card-header {
                    flex-wrap: nowrap;
                    padding: 0.75em 0.5em;
                    gap: 0.4em;
                }

                .akl-collapse-btn {
                    font-size: 0.7em;
                    width: 16px;
                }

                .akl-card-title {
                    flex: 1;
                    min-width: 0;
                    overflow: hidden;
                }

                .akl-keyword-name {
                    font-size: 0.9em;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 100%;
                }

                .akl-target-name {
                    font-size: 0.8em;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .akl-card-badges {
                    flex-shrink: 0;
                }

                .akl-badge {
                    padding: 0.2em 0.4em;
                    font-size: 0.65em;
                }

                .akl-header {
                    flex-direction: column;
                    align-items: flex-start;
                }
            }

            /* Dark mode adjustments */
            .theme-dark .akl-keyword-card:hover {
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }

            /* Animations */
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .akl-keyword-card {
                animation: slideIn 0.2s ease-out;
            }

            /* Suggested Keyword Builder Modal Styles */
            .akl-suggestion-modal {
                max-width: 700px;
                max-height: 80vh;
                overflow-y: auto;
            }

            .akl-status {
                margin-bottom: 1em;
                padding: 1em;
                background: var(--background-secondary);
                border-radius: 6px;
            }

            .akl-analyzing {
                color: var(--text-muted);
                font-style: italic;
            }

            .akl-error {
                color: var(--text-error);
            }

            .akl-search-container {
                margin-bottom: 1em;
            }

            .akl-search-input {
                width: 100%;
                padding: 0.6em;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background: var(--background-primary);
                color: var(--text-normal);
                font-size: 0.95em;
            }

            .akl-search-input:focus {
                outline: none;
                border-color: var(--color-accent);
            }

            .akl-button-row {
                display: flex;
                gap: 0.5em;
                margin-bottom: 1em;
            }

            .akl-mini-button {
                padding: 0.4em 0.8em;
                font-size: 0.85em;
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                cursor: pointer;
                color: var(--text-normal);
            }

            .akl-mini-button:hover {
                background: var(--background-modifier-hover);
            }

            .akl-suggestions-list {
                max-height: 400px;
                overflow-y: auto;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                padding: 0.5em;
                background: var(--background-primary);
                margin-bottom: 1em;
            }

            .akl-suggestion-item {
                padding: 0.75em;
                margin-bottom: 0.5em;
                background: var(--background-secondary);
                border-radius: 4px;
                border: 1px solid var(--background-modifier-border);
            }

            .akl-suggestion-item:hover {
                background: var(--background-modifier-hover);
            }

            .akl-suggestion-header {
                display: flex;
                align-items: center;
                gap: 0.75em;
                margin-bottom: 0.5em;
            }

            .akl-checkbox {
                cursor: pointer;
                width: 16px;
                height: 16px;
            }

            .akl-suggestion-label {
                flex: 1;
            }

            .akl-keyword-text {
                font-weight: 500;
                color: var(--text-normal);
            }

            .akl-count-text {
                color: var(--text-muted);
                font-size: 0.9em;
            }

            .akl-notes-preview {
                margin-bottom: 0.5em;
                padding-left: 2em;
                font-size: 0.85em;
            }

            .akl-notes-label {
                color: var(--text-muted);
                font-weight: 500;
            }

            .akl-notes-list {
                color: var(--text-muted);
                font-style: italic;
            }

            .akl-variation-selector {
                padding-left: 2em;
                display: flex;
                align-items: center;
                gap: 0.5em;
                font-size: 0.85em;
            }

            .akl-variation-label {
                color: var(--text-muted);
            }

            .akl-variation-dropdown {
                flex: 1;
                padding: 0.3em;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background: var(--background-primary);
                color: var(--text-normal);
            }

            .akl-no-results {
                text-align: center;
                padding: 2em;
                color: var(--text-muted);
                font-style: italic;
            }

            .akl-action-row {
                display: flex;
                justify-content: flex-end;
                gap: 0.75em;
                margin-top: 1em;
            }

            .akl-action-row button {
                padding: 0.6em 1.2em;
            }
        `;

        document.head.appendChild(styleEl);
    }
}