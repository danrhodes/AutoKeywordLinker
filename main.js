// Import required Obsidian API components
const { Plugin, PluginSettingTab, Setting, Notice, Modal, MarkdownView, FuzzySuggestModal, Menu } = require('obsidian');

// Default stop words to exclude from keyword suggestions
const DEFAULT_STOP_WORDS = [
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
];

// Default settings that will be used when the plugin is first installed
const DEFAULT_SETTINGS = {
    // Array of keyword group objects for organizing keywords
    keywordGroups: [],

    // Array of keyword objects, each containing the keyword, target note, and variations
    keywords: [
        { id: 'kw-1', keyword: 'Keyword1', target: 'Keyword1', variations: [], enableTags: false, linkScope: 'vault-wide', scopeFolder: '', useRelativeLinks: false, blockRef: '', requireTag: '', onlyInNotesLinkingTo: false, suggestMode: false, preventSelfLink: false, groupId: null },
        { id: 'kw-2', keyword: 'Keyword2', target: 'Keyword2', variations: [], enableTags: false, linkScope: 'vault-wide', scopeFolder: '', useRelativeLinks: false, blockRef: '', requireTag: '', onlyInNotesLinkingTo: false, suggestMode: false, preventSelfLink: false, groupId: null }
    ],
    autoLinkOnSave: false,          // Whether to automatically link keywords when saving a note
    caseSensitive: false,            // Whether keyword matching should be case-sensitive
    firstOccurrenceOnly: true,       // Whether to link only the first occurrence of each keyword
    autoCreateNotes: false,           // Whether to automatically create notes that don't exist
    newNoteFolder: '',               // Folder where new notes will be created (empty = root)
    newNoteTemplate: '# {{keyword}}\n\nCreated: {{date}}\n\n',  // Template for new notes
    customStopWords: [],             // Additional stop words to exclude from keyword suggestions (appended to defaults)
    preventSelfLinkGlobal: false,    // Global setting: prevent linking keywords on their target notes
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

        // Register command: Export keywords to JSON
        this.addCommand({
            id: 'export-keywords',
            name: 'Export keywords to JSON',
            callback: () => this.exportKeywords()
        });

        // Register command: Import keywords from JSON
        this.addCommand({
            id: 'import-keywords',
            name: 'Import keywords from JSON',
            callback: () => this.importKeywords()
        });

        // Register command: Download CSV template
        this.addCommand({
            id: 'download-csv-template',
            name: 'Download CSV template',
            callback: () => this.downloadCSVTemplate()
        });

        // Register command: Export keywords to CSV
        this.addCommand({
            id: 'export-keywords-csv',
            name: 'Export keywords to CSV',
            callback: () => this.exportKeywordsToCSV()
        });

        // Register command: Import keywords from CSV
        this.addCommand({
            id: 'import-keywords-csv',
            name: 'Import keywords from CSV',
            callback: () => this.importKeywordsFromCSV()
        });

        // Register command: Suggest keywords
        this.addCommand({
            id: 'suggest-keywords',
            name: 'Suggest keywords from notes',
            callback: () => this.suggestKeywords()
        });

        // Register command: Suggest keywords from current note only
        this.addCommand({
            id: 'suggest-keywords-current-note',
            name: 'Suggest keywords from current note only',
            callback: () => this.suggestKeywordsFromCurrentNote()
        });

        // Register command: Accept all suggestions on current line
        this.addCommand({
            id: 'accept-suggestion-at-cursor',
            name: 'Accept all suggestions on current line',
            editorCallback: (editor) => this.acceptSuggestionAtCursor(editor),
            hotkeys: [
                {
                    modifiers: ["Mod"],
                    key: "Enter"
                }
            ]
        });

        // Register command: Accept all link suggestions in current note
        this.addCommand({
            id: 'accept-all-suggestions',
            name: 'Accept all link suggestions in current note',
            editorCallback: (editor) => this.acceptAllSuggestions(editor)
        });

        // Register command: Review link suggestions (opens modal)
        this.addCommand({
            id: 'review-link-suggestions',
            name: 'Review link suggestions',
            editorCallback: (editor) => this.reviewSuggestions(editor)
        });

        // Add the settings tab to Obsidian's settings panel
        this.addSettingTab(new AutoKeywordLinkerSettingTab(this.app, this));

        // Add custom CSS styles for modals and UI on plugin load
        this.addCustomStyles();

        // Set up context menu for suggested links
        this.setupSuggestionContextMenu();

        // Register markdown post-processor for suggested links (Reading mode)
        this.registerMarkdownPostProcessor((element) => {
            this.processSuggestedLinks(element);
        });

        // Set up Live Preview mode click handler
        this.setupLivePreviewClickHandler();

        // Register editor menu to add our option to right-click menu
        this.registerEvent(
            this.app.workspace.on('editor-menu', (menu, editor) => {
                // Check if there are ANY suggestions in the entire document
                const content = editor.getValue();
                const spanPattern = /<span class="akl-suggested-link"[^>]*>([^<]+)<\/span>/;

                if (spanPattern.test(content)) {
                    // Add menu items at the top
                    menu.addItem((item) => {
                        item
                            .setTitle('📋 Review all link suggestions...')
                            .setIcon('list-checks')
                            .onClick(() => {
                                this.reviewSuggestions(editor);
                            });
                    });

                    menu.addItem((item) => {
                        item
                            .setTitle('✓ Accept all suggestions on this line')
                            .setIcon('check')
                            .onClick(() => {
                                this.acceptSuggestionAtCursor(editor);
                            });
                    });

                    menu.addSeparator();
                }
            })
        );

        // Add status bar item for suggestion count
        this.statusBarItem = this.addStatusBarItem();
        this.updateStatusBar();

        // Update status bar when active leaf changes
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', () => {
                this.updateStatusBar();
            })
        );

        // Update status bar when editor changes
        this.registerEvent(
            this.app.workspace.on('editor-change', () => {
                setTimeout(() => this.updateStatusBar(), 100);
            })
        );

        // If auto-link on save is enabled, set up the event listener
        if (this.settings.autoLinkOnSave) {
            this.setupAutoLinkOnSave();
        }
    }

    /**
     * Process suggested links in rendered markdown
     */
    processSuggestedLinks(element) {
        const suggestedLinks = element.querySelectorAll('.akl-suggested-link');

        suggestedLinks.forEach(span => {
            // Add click handler - just make it clickable to show it's interactive
            span.addEventListener('click', (evt) => {
                evt.preventDefault();
                evt.stopPropagation();

                // Inform user they need to switch to edit mode
                new Notice('Switch to edit mode to accept suggestions, or use the review modal');
            });

            // Handle right-click to show review option
            span.addEventListener('contextmenu', (evt) => {
                evt.preventDefault();
                evt.stopPropagation();

                const menu = new Menu();

                // Option to review all suggestions (will need to switch to edit mode)
                menu.addItem((item) => {
                    item
                        .setTitle('📋 Review link suggestions (opens in edit mode)')
                        .setIcon('list-checks')
                        .onClick(async () => {
                            // Switch to edit mode first
                            const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                            if (view) {
                                await view.setState({mode: 'source'}, {});

                                // Give it a moment to switch modes, then open review
                                setTimeout(() => {
                                    const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
                                    if (editor) {
                                        this.reviewSuggestions(editor);
                                    }
                                }, 100);
                            }
                        });
                });

                menu.showAtMouseEvent(evt);
            });
        });
    }

    /**
     * Update status bar with suggestion count
     */
    updateStatusBar() {
        if (!this.statusBarItem) return;

        const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
        if (!editor) {
            this.statusBarItem.setText('');
            this.statusBarItem.style.display = 'none';
            return;
        }

        const content = editor.getValue();
        const spanPattern = /<span class="akl-suggested-link"[^>]*>([^<]+)<\/span>/g;
        const matches = content.match(spanPattern);
        const count = matches ? matches.length : 0;

        if (count > 0) {
            this.statusBarItem.setText(`💡 ${count} link suggestion${count > 1 ? 's' : ''}`);
            this.statusBarItem.style.cursor = 'pointer';
            this.statusBarItem.style.display = 'inline-block';
            this.statusBarItem.addClass('mod-clickable');
            this.statusBarItem.setAttribute('aria-label', 'Click to review suggestions');

            // Add click handler to open review modal
            this.statusBarItem.onclick = () => {
                const currentEditor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
                if (currentEditor) {
                    this.reviewSuggestions(currentEditor);
                }
            };
        } else {
            this.statusBarItem.setText('');
            this.statusBarItem.style.display = 'none';
            this.statusBarItem.onclick = null;
        }
    }

    /**
     * Set up context menu for suggested links
     */
    setupSuggestionContextMenu() {
        this.registerDomEvent(document, 'contextmenu', (evt) => {
            const target = evt.target;

            // Check if right-click was on a suggested link
            if (target && target.classList && target.classList.contains('akl-suggested-link')) {
                evt.preventDefault();

                // Create a context menu
                const menu = new Menu();

                menu.addItem((item) => {
                    item
                        .setTitle('Accept link suggestion')
                        .setIcon('check')
                        .onClick(() => {
                            this.acceptSuggestionElement(target);
                        });
                });

                menu.showAtMouseEvent(evt);
            }
        });
    }

    /**
     * Set up click handler for Live Preview mode
     */
    setupLivePreviewClickHandler() {
        this.registerDomEvent(document, 'click', (evt) => {
            // Check if we're in a markdown view
            const view = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (!view) return;

            const editor = view.editor;
            if (!editor) return;

            // Get the clicked position in the editor
            const clickedElement = evt.target;

            // Check if the clicked element or its parent has our suggestion class
            let suggestionElement = null;
            if (clickedElement.classList && clickedElement.classList.contains('akl-suggested-link')) {
                suggestionElement = clickedElement;
            } else if (clickedElement.parentElement && clickedElement.parentElement.classList &&
                       clickedElement.parentElement.classList.contains('akl-suggested-link')) {
                suggestionElement = clickedElement.parentElement;
            }

            if (suggestionElement) {
                evt.preventDefault();
                evt.stopPropagation();

                // Get cursor position
                const cursor = editor.getCursor();
                const line = editor.getLine(cursor.line);

                // Try to find suggestion at this line
                this.showSuggestionMenuAtLine(editor, cursor.line, line, evt);
            }
        });

        // Also handle right-click for Live Preview
        this.registerDomEvent(document, 'contextmenu', (evt) => {
            const view = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (!view) return;

            const editor = view.editor;
            if (!editor) return;

            const clickedElement = evt.target;

            let suggestionElement = null;
            if (clickedElement.classList && clickedElement.classList.contains('akl-suggested-link')) {
                suggestionElement = clickedElement;
            } else if (clickedElement.parentElement && clickedElement.parentElement.classList &&
                       clickedElement.parentElement.classList.contains('akl-suggested-link')) {
                suggestionElement = clickedElement.parentElement;
            }

            if (suggestionElement) {
                evt.preventDefault();
                evt.stopPropagation();

                const cursor = editor.getCursor();
                const line = editor.getLine(cursor.line);

                this.showSuggestionMenuAtLine(editor, cursor.line, line, evt);
            }
        });
    }

    /**
     * Show suggestion menu for a specific line
     */
    showSuggestionMenuAtLine(editor, lineNumber, lineText, evt) {
        // Find all suggestion spans in this line
        const spanPattern = /<span class="akl-suggested-link" data-target="([^"]*)" data-block="([^"]*)" data-use-relative="([^"]*)"[^>]*>([^<]+)<\/span>/g;
        const matches = [...lineText.matchAll(spanPattern)];

        if (matches.length === 0) return;

        // If there's only one match, show menu for it
        // If there are multiple, show menu for the first one (could be enhanced to detect which one was clicked)
        const match = matches[0];
        const targetNote = match[1];
        const blockRef = match[2];
        const useRelative = match[3] === 'true';
        const matchText = match[4];

        const menu = new Menu();

        menu.addItem((item) => {
            item
                .setTitle(`Accept link suggestion: "${matchText}"`)
                .setIcon('check')
                .onClick(() => {
                    this.acceptSuggestionInLine(editor, lineNumber, lineText, matchText, targetNote, blockRef, useRelative);
                });
        });

        menu.showAtMouseEvent(evt);
    }

    /**
     * Accept a suggestion in a specific line
     */
    acceptSuggestionInLine(editor, lineNumber, lineText, matchText, targetNote, blockRef, useRelative) {
        // Find the exact span to replace
        const spanPattern = new RegExp(`<span class="akl-suggested-link" data-target="${this.escapeRegex(targetNote)}" data-block="${this.escapeRegex(blockRef)}" data-use-relative="${useRelative ? 'true' : 'false'}"[^>]*>${this.escapeRegex(matchText)}</span>`);

        if (!spanPattern.test(lineText)) return;

        // Check if current line is inside a table
        const content = editor.getValue();
        const lineStart = editor.posToOffset({ line: lineNumber, ch: 0 });
        const insideTable = this.isInsideTable(content, lineStart);

        // Create the actual link
        let link;
        const targetWithBlock = blockRef ? `${targetNote}#${blockRef}` : targetNote;

        if (useRelative) {
            // Use relative markdown link format
            // Escape pipe characters in the display text if inside a table to prevent breaking table columns
            const escapedMatchText = insideTable ? matchText.replace(/\|/g, '\\|') : matchText;
            const encodedTarget = encodeURIComponent(targetNote) + '.md';
            const blockPart = blockRef ? `#${blockRef}` : '';
            link = `[${escapedMatchText}](${encodedTarget}${blockPart})`;
        } else {
            // Use wikilink format
            if (insideTable) {
                // Inside tables: Escape the pipe with single backslash \| to prevent breaking table formatting
                link = targetNote === matchText && !blockRef ? `[[${matchText}]]` : `[[${targetWithBlock}\\|${matchText}]]`;
            } else {
                // Outside table: standard wikilink format with | separator for alias
                link = targetNote === matchText && !blockRef ? `[[${matchText}]]` : `[[${targetWithBlock}|${matchText}]]`;
            }
        }

        // Replace in the line
        const newLine = lineText.replace(spanPattern, link);
        editor.setLine(lineNumber, newLine);

        new Notice('Link suggestion accepted');

        // Update status bar
        setTimeout(() => this.updateStatusBar(), 100);
    }

    /**
     * Review all link suggestions in a modal
     */
    reviewSuggestions(editor) {
        const content = editor.getValue();
        const suggestions = [];

        // Parse all lines to find suggestions
        const lines = content.split('\n');
        const spanPattern = /<span class="akl-suggested-link" data-target="([^"]*)" data-block="([^"]*)" data-use-relative="([^"]*)"[^>]*>([^<]+)<\/span>/g;

        lines.forEach((line, lineNumber) => {
            let match;
            spanPattern.lastIndex = 0; // Reset regex state
            while ((match = spanPattern.exec(line)) !== null) {
                suggestions.push({
                    lineNumber: lineNumber,
                    targetNote: match[1],
                    blockRef: match[2],
                    useRelative: match[3] === 'true',
                    matchText: match[4],
                    fullMatch: match[0]
                });
            }
        });

        if (suggestions.length === 0) {
            new Notice('No link suggestions found in current note');
            return;
        }

        // Open the review modal
        new SuggestionReviewModal(this.app, editor, suggestions).open();
    }

    /**
     * Accept all link suggestions on the current line
     */
    acceptSuggestionAtCursor(editor) {
        const cursor = editor.getCursor();
        let line = editor.getLine(cursor.line);

        // Find ALL suggestion spans on this line
        const spanPattern = /<span class="akl-suggested-link" data-target="([^"]*)" data-block="([^"]*)" data-use-relative="([^"]*)"[^>]*>([^<]+)<\/span>/g;
        const matches = [...line.matchAll(spanPattern)];

        if (matches.length === 0) {
            new Notice('No link suggestions found on this line');
            return;
        }

        // Check if current line is inside a table
        const content = editor.getValue();
        const lineStart = editor.posToOffset({ line: cursor.line, ch: 0 });
        const insideTable = this.isInsideTable(content, lineStart);

        // Process all matches - replace each span with its corresponding link
        let acceptedCount = 0;
        matches.forEach(match => {
            const fullMatch = match[0];
            const targetNote = match[1];
            const blockRef = match[2];
            const useRelative = match[3] === 'true';
            const matchText = match[4];

            // Create the actual link
            let link;
            const targetWithBlock = blockRef ? `${targetNote}#${blockRef}` : targetNote;

            if (useRelative) {
                // Use relative markdown link format
                // Escape pipe characters in the display text if inside a table to prevent breaking table columns
                const escapedMatchText = insideTable ? matchText.replace(/\|/g, '\\|') : matchText;
                const encodedTarget = encodeURIComponent(targetNote) + '.md';
                const blockPart = blockRef ? `#${blockRef}` : '';
                link = `[${escapedMatchText}](${encodedTarget}${blockPart})`;
            } else {
                // Use wikilink format
                if (insideTable) {
                    // Inside tables: Escape the pipe with single backslash \| to prevent breaking table formatting
                    link = targetNote === matchText && !blockRef ? `[[${matchText}]]` : `[[${targetWithBlock}\\|${matchText}]]`;
                } else {
                    // Outside table: standard wikilink format with | separator for alias
                    link = targetNote === matchText && !blockRef ? `[[${matchText}]]` : `[[${targetWithBlock}|${matchText}]]`;
                }
            }

            // Replace this span with the link
            line = line.replace(fullMatch, link);
            acceptedCount++;
        });

        // Update the line with all replacements
        editor.setLine(cursor.line, line);

        new Notice(`Accepted ${acceptedCount} link suggestion${acceptedCount > 1 ? 's' : ''} on this line`);

        // Update status bar
        setTimeout(() => this.updateStatusBar(), 100);
    }

    /**
     * Accept all link suggestions in the current note
     */
    acceptAllSuggestions(editor) {
        const content = editor.getValue();
        let newContent = content;
        let count = 0;

        // Find all suggestion spans
        const spanPattern = /<span class="akl-suggested-link" data-target="([^"]*)" data-block="([^"]*)" data-use-relative="([^"]*)"[^>]*>([^<]+)<\/span>/g;

        newContent = content.replace(spanPattern, (match, targetNote, blockRef, useRelative, matchText, offset) => {
            count++;

            // Check if this match is inside a table
            const insideTable = this.isInsideTable(content, offset);

            // Create the actual link
            let link;
            const targetWithBlock = blockRef ? `${targetNote}#${blockRef}` : targetNote;

            if (useRelative === 'true') {
                // Use relative markdown link format
                // Escape pipe characters in the display text if inside a table to prevent breaking table columns
                const escapedMatchText = insideTable ? matchText.replace(/\|/g, '\\|') : matchText;
                const encodedTarget = encodeURIComponent(targetNote) + '.md';
                const blockPart = blockRef ? `#${blockRef}` : '';
                link = `[${escapedMatchText}](${encodedTarget}${blockPart})`;
            } else {
                // Use wikilink format
                if (insideTable) {
                    // Inside tables: Escape the pipe with single backslash \| to prevent breaking table formatting
                    link = targetNote === matchText && !blockRef ? `[[${matchText}]]` : `[[${targetWithBlock}\\|${matchText}]]`;
                } else {
                    // Outside table: standard wikilink format with | separator for alias
                    link = targetNote === matchText && !blockRef ? `[[${matchText}]]` : `[[${targetWithBlock}|${matchText}]]`;
                }
            }

            return link;
        });

        if (count > 0) {
            editor.setValue(newContent);
            new Notice(`Accepted ${count} link suggestion${count > 1 ? 's' : ''}`);
            // Update status bar
            setTimeout(() => this.updateStatusBar(), 100);
        } else {
            new Notice('No link suggestions found in current note');
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

                            // Ensure customStopWords exists and is an array
                            if (!this.settings.customStopWords || !Array.isArray(this.settings.customStopWords)) {
                                this.settings.customStopWords = DEFAULT_SETTINGS.customStopWords;
                            }

                            // Ensure enableTags, linkScope, useRelativeLinks, and blockRef fields exist for all keywords
                            if (this.settings.keywords) {
                                for (let keyword of this.settings.keywords) {
                                    if (keyword.enableTags === undefined) {
                                        keyword.enableTags = false;
                                    }
                                    if (keyword.linkScope === undefined) {
                                        keyword.linkScope = 'vault-wide';
                                    }
                                    if (keyword.scopeFolder === undefined) {
                                        keyword.scopeFolder = '';
                                    }
                                    if (keyword.useRelativeLinks === undefined) {
                                        keyword.useRelativeLinks = false;
                                    }
                                    if (keyword.blockRef === undefined) {
                                        keyword.blockRef = '';
                                    }
                                    if (keyword.requireTag === undefined) {
                                        keyword.requireTag = '';
                                    }
                                    if (keyword.onlyInNotesLinkingTo === undefined) {
                                        keyword.onlyInNotesLinkingTo = false;
                                    }
                                }
                            }

                            // Update our hash
                            lastSettingsHash = currentHash;

                            // Settings synced silently in background
                            // UI will update next time settings are opened
                        }
                    }
                } catch (error) {
                    // Ignore errors - file might be temporarily unavailable during sync
                    console.log('Auto Keyword Linker: Error checking for settings changes:', error);
                }
            }, 15000) // Check every 15 seconds
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
     * Download CSV template for bulk keyword import
     */
    async downloadCSVTemplate() {
        try {
            const headers = 'keyword,target,variations,enableTags,linkScope,scopeFolder,useRelativeLinks,blockRef,requireTag,onlyInNotesLinkingTo,suggestMode,preventSelfLink';
            const example1 = 'Python,Languages/Python,"python|py|Python3",false,vault-wide,,false,,,false,false';
            const example2 = 'JavaScript,Languages/JavaScript,"js|javascript",false,vault-wide,,false,,,false,false';
            const example3 = 'API,Documentation/API,"api|REST API",false,same-folder,,false,,reviewed,true,false';

            const csvContent = `${headers}\n${example1}\n${example2}\n${example3}\n`;

            const filename = 'auto-keyword-linker-template.csv';
            await this.app.vault.create(filename, csvContent);
            new Notice(`CSV template downloaded: ${filename}`);
        } catch (error) {
            new Notice(`Template download failed: ${error.message}`);
        }
    }

    /**
     * Export keywords to CSV file
     */
    async exportKeywordsToCSV() {
        try {
            const headers = 'keyword,target,variations,enableTags,linkScope,scopeFolder,useRelativeLinks,blockRef,requireTag,onlyInNotesLinkingTo,suggestMode,preventSelfLink';
            const rows = [headers];

            for (let item of this.settings.keywords) {
                // Convert variations array to pipe-separated string
                const variations = (item.variations && item.variations.length > 0)
                    ? `"${item.variations.join('|')}"`
                    : '';

                // Build CSV row
                const row = [
                    this.escapeCSV(item.keyword),
                    this.escapeCSV(item.target),
                    variations,
                    item.enableTags || false,
                    item.linkScope || 'vault-wide',
                    this.escapeCSV(item.scopeFolder || ''),
                    item.useRelativeLinks || false,
                    this.escapeCSV(item.blockRef || ''),
                    this.escapeCSV(item.requireTag || ''),
                    item.onlyInNotesLinkingTo || false,
                    item.suggestMode || false,
                    item.preventSelfLink || false
                ].join(',');

                rows.push(row);
            }

            const csvContent = rows.join('\n');
            const date = new Date().toISOString().split('T')[0];
            const filename = `auto-keyword-linker-export-${date}.csv`;

            await this.app.vault.create(filename, csvContent);
            new Notice(`Keywords exported to ${filename}`);
        } catch (error) {
            new Notice(`CSV export failed: ${error.message}`);
        }
    }

    /**
     * Import keywords from CSV file
     */
    async importKeywordsFromCSV() {
        new ImportCSVModal(this.app, this).open();
    }

    /**
     * Escape CSV field if it contains special characters
     */
    escapeCSV(field) {
        if (typeof field !== 'string') return field;
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
            return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
    }

    /**
     * Parse CSV line respecting quoted fields
     */
    parseCSVLine(line) {
        const fields = [];
        let currentField = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"' && inQuotes && nextChar === '"') {
                // Escaped quote
                currentField += '"';
                i++; // Skip next quote
            } else if (char === '"') {
                // Toggle quote mode
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                // Field separator
                fields.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }

        // Add last field
        fields.push(currentField.trim());

        return fields;
    }

    /**
     * Open the Suggested Keyword Builder modal
     */
    async suggestKeywords() {
        new SuggestedKeywordBuilderModal(this.app, this).open();
    }

    /**
     * Open the Suggested Keyword Builder modal for current note only
     */
    async suggestKeywordsFromCurrentNote() {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
            new Notice('No active note found. Please open a note first.');
            return;
        }
        new SuggestedKeywordBuilderModal(this.app, this, activeFile).open();
    }

    /**
     * Get combined stop words (default + custom)
     * @returns {Set} Set of stop words to exclude
     */
    getStopWords() {
        const stopWords = new Set(DEFAULT_STOP_WORDS);
        // Add custom stop words from settings
        if (this.settings.customStopWords && Array.isArray(this.settings.customStopWords)) {
            for (let word of this.settings.customStopWords) {
                if (word && typeof word === 'string') {
                    stopWords.add(word.toLowerCase().trim());
                }
            }
        }
        return stopWords;
    }

    /**
     * Extract meaningful words from text
     * @param {string} text - Text to extract words from
     * @param {boolean} isTitle - Whether this is a title (affects processing)
     * @returns {Array} Array of normalized words
     */
    extractWordsFromText(text, isTitle = false) {
        const words = [];
        const stopWords = this.getStopWords();

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
                if (word.length >= 3 && !stopWords.has(word.toLowerCase())) {
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
        const stopWords = this.getStopWords();

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
                    const hasNonStopWord = phraseWords.some(w => !stopWords.has(w.toLowerCase()));

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

        // Add auto-discovered aliases from frontmatter to existing keywords set
        for (let item of this.settings.keywords) {
            const aliases = this.getAliasesForNote(item.target);
            if (aliases && aliases.length > 0) {
                for (let alias of aliases) {
                    existingKeywords.add(alias.toLowerCase());
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
                let contentWithoutFrontmatter = limitedContent.replace(/^---[\s\S]*?---\n/, '');

                // Remove all wikilinks [[link]] and [[link|alias]] - they're already keywords or shouldn't be suggested
                contentWithoutFrontmatter = contentWithoutFrontmatter.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '');

                // Remove markdown links [text](url)
                contentWithoutFrontmatter = contentWithoutFrontmatter.replace(/\[([^\]]+)\]\([^)]+\)/g, '');

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
     * Analyze a single note and extract keyword suggestions
     * @param {TFile} file - The file to analyze
     * @returns {Array} Array of suggestion objects with word, count, and notes
     */
    async analyzeCurrentNoteForKeywords(file) {
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

        // Add auto-discovered aliases from frontmatter to existing keywords set
        for (let item of this.settings.keywords) {
            const aliases = this.getAliasesForNote(item.target);
            if (aliases && aliases.length > 0) {
                for (let alias of aliases) {
                    existingKeywords.add(alias.toLowerCase());
                }
            }
        }

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

        // Extract from note content (entire content for single note)
        try {
            const content = await this.app.vault.read(file);

            // Remove frontmatter
            let contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\n/, '');

            // Remove all wikilinks [[link]] and [[link|alias]] - they're already keywords or shouldn't be suggested
            contentWithoutFrontmatter = contentWithoutFrontmatter.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '');

            // Remove markdown links [text](url)
            contentWithoutFrontmatter = contentWithoutFrontmatter.replace(/\[([^\]]+)\]\([^)]+\)/g, '');

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
            console.log(`Error reading ${file.path}:`, error);
            throw error;
        }

        // Combine words and phrases into suggestions
        const suggestions = [];

        // Add word suggestions
        for (let [word, data] of wordFrequency) {
            suggestions.push({
                keyword: word,
                count: data.count,
                notes: Array.from(data.notes),
                totalNotes: data.notes.size
            });
        }

        // Add phrase suggestions
        for (let [phrase, data] of phraseFrequency) {
            suggestions.push({
                keyword: phrase,
                count: data.count,
                notes: Array.from(data.notes),
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

            // Update status bar to reflect new suggestions
            setTimeout(() => this.updateStatusBar(), 100);
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
                        file: file,  // Include the file object for later processing
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
            if (onlyInNotesLinkingTo && !this.noteHasLinkToTarget(file, target)) {
                continue;
            }

            // Check if target note has required tag - skip this keyword if tag requirement not met
            if (!this.noteHasTag(target, requireTag)) {
                continue;
            }

            // Check link scope - skip this keyword if scope conditions aren't met
            if (!this.checkLinkScope(file, target, linkScope, scopeFolder)) {
                continue;
            }

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

                // CRITICAL FIX: Skip if inside a block reference (^block-id)
                if (this.isInsideBlockReference(content, matchIndex)) {
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
                        ? new RegExp(`\\[\\[([^\\]]+\\|)?${this.escapeRegex(keyword)}\\]\\]`)
                        : new RegExp(`\\[\\[([^\\]]+\\|)?${this.escapeRegex(keyword)}\\]\\]`, 'i');

                    const existingSuggestPattern = this.settings.caseSensitive
                        ? new RegExp(`<span class="akl-suggested-link"[^>]*>${this.escapeRegex(keyword)}</span>`)
                        : new RegExp(`<span class="akl-suggested-link"[^>]*>${this.escapeRegex(keyword)}</span>`, 'i');

                    if (existingLinkPattern.test(content) || existingSuggestPattern.test(content)) {
                        break;  // Already linked or suggested in document, skip this keyword entirely
                    }

                    foundKeywords.add(keyLower);
                }

                // Check if we're inside a table
                const insideTable = this.isInsideTable(content, matchIndex);

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
        // First, check if we're inside the (url) part
        let parenDepth = 0;
        for (let i = index - 1; i >= Math.max(0, index - 300); i--) {
            if (content[i] === ')') {
                parenDepth--;
            } else if (content[i] === '(') {
                parenDepth++;
                // If we find ( and depth > 0, check if it's preceded by ]
                if (parenDepth > 0 && i > 0 && content[i - 1] === ']') {
                    return true; // We're inside ](url) part of a markdown link
                }
            } else if (content[i] === '\n') {
                break;
            }
        }

        // Check if we're inside the [text] part
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
     * Check if a position is inside a block reference (^block-id)
     * Block references are in the format: ^some-block-id at the end of a line
     * @param {string} content - The full content
     * @param {number} index - Position to check
     * @returns {boolean} True if inside a block reference
     */
    isInsideBlockReference(content, index) {
        // Find the start of the current line
        let lineStart = index;
        while (lineStart > 0 && content[lineStart - 1] !== '\n') {
            lineStart--;
        }

        // Find the end of the current line
        let lineEnd = index;
        while (lineEnd < content.length && content[lineEnd] !== '\n') {
            lineEnd++;
        }

        // Get the current line
        const line = content.substring(lineStart, lineEnd);

        // Check if there's a ^ before our position on this line
        const positionInLine = index - lineStart;

        // Look for ^ character before the match position
        const caretIndex = line.lastIndexOf('^', positionInLine);

        if (caretIndex !== -1) {
            // Check if there's only word characters, hyphens, and underscores between ^ and our position
            // This matches the typical block ID format: ^block-id or ^block_id
            const textBetween = line.substring(caretIndex, positionInLine + 1);

            // If the text between ^ and our position only contains valid block ID characters
            // then we're inside a block reference
            if (/^\^[\w\-]*$/.test(textBetween)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if a position is inside a Markdown table
     * Tables are defined by lines containing pipes (|) with a header separator line
     * @param {string} content - The full content
     * @param {number} index - Position to check
     * @returns {boolean} True if inside a table
     */
    isInsideTable(content, index) {
        // Find the current line
        let lineStart = index;
        while (lineStart > 0 && content[lineStart - 1] !== '\n') {
            lineStart--;
        }

        let lineEnd = index;
        while (lineEnd < content.length && content[lineEnd] !== '\n') {
            lineEnd++;
        }

        const currentLine = content.substring(lineStart, lineEnd);

        // Check if current line contains pipes (potential table row)
        if (!currentLine.includes('|')) {
            return false;
        }

        // Look backwards to find if there's a table separator line (like | --- | --- |)
        // This confirms we're in a table
        let searchStart = lineStart - 1;
        const maxLookback = 10; // Look back up to 10 lines
        let linesChecked = 0;

        while (searchStart > 0 && linesChecked < maxLookback) {
            // Find previous line start
            let prevLineEnd = searchStart;
            while (searchStart > 0 && content[searchStart - 1] !== '\n') {
                searchStart--;
            }

            const prevLine = content.substring(searchStart, prevLineEnd).trim();

            // Check if this line is a table separator (contains | and - and :)
            // Examples: | --- | --- | or |:---|:---:| or |-----|-----|
            if (prevLine.includes('|') && prevLine.includes('-')) {
                // Simple check: if line has pipes and dashes, likely a separator
                const withoutPipes = prevLine.replace(/\|/g, '');
                const dashCount = (withoutPipes.match(/-/g) || []).length;

                // If mostly dashes (table separator), we're in a table
                if (dashCount >= 3) {
                    return true;
                }
            }

            // Also check forward from current position to find separator
            linesChecked++;
            searchStart--;
        }

        // Look forward as well (in case we're in the header row before separator)
        let searchEnd = lineEnd + 1;
        linesChecked = 0;

        while (searchEnd < content.length && linesChecked < 3) {
            let nextLineStart = searchEnd;
            while (searchEnd < content.length && content[searchEnd] !== '\n') {
                searchEnd++;
            }

            const nextLine = content.substring(nextLineStart, searchEnd).trim();

            if (nextLine.includes('|') && nextLine.includes('-')) {
                const withoutPipes = nextLine.replace(/\|/g, '');
                const dashCount = (withoutPipes.match(/-/g) || []).length;

                if (dashCount >= 3) {
                    return true;
                }
            }

            linesChecked++;
            searchEnd++;
        }

        return false;
    }

    /**
     * Get effective settings for a keyword by merging group settings with keyword-specific settings
     * Keyword-specific settings override group settings
     * @param {Object} keyword - The keyword object
     * @returns {Object} Merged settings
     */
    getEffectiveKeywordSettings(keyword) {
        // Start with defaults
        const settings = {
            enableTags: false,
            linkScope: 'vault-wide',
            scopeFolder: '',
            useRelativeLinks: false,
            blockRef: '',
            requireTag: '',
            onlyInNotesLinkingTo: false,
            suggestMode: false,
            preventSelfLink: false
        };

        // If keyword is in a group, apply group settings as base
        if (keyword.groupId) {
            const group = this.settings.keywordGroups.find(g => g.id === keyword.groupId);
            if (group && group.settings) {
                Object.assign(settings, group.settings);
            }
        }

        // Override with keyword-specific settings only if explicitly set (not null/undefined)
        // null means "inherit from group", so we skip those
        if (keyword.enableTags !== null && keyword.enableTags !== undefined) settings.enableTags = keyword.enableTags;
        if (keyword.linkScope !== null && keyword.linkScope !== undefined && keyword.linkScope !== 'vault-wide') settings.linkScope = keyword.linkScope;
        if (keyword.scopeFolder !== null && keyword.scopeFolder !== undefined && keyword.scopeFolder !== '') settings.scopeFolder = keyword.scopeFolder;
        if (keyword.useRelativeLinks !== null && keyword.useRelativeLinks !== undefined) settings.useRelativeLinks = keyword.useRelativeLinks;
        if (keyword.blockRef !== null && keyword.blockRef !== undefined && keyword.blockRef !== '') settings.blockRef = keyword.blockRef;
        if (keyword.requireTag !== null && keyword.requireTag !== undefined && keyword.requireTag !== '') settings.requireTag = keyword.requireTag;
        if (keyword.onlyInNotesLinkingTo !== null && keyword.onlyInNotesLinkingTo !== undefined) settings.onlyInNotesLinkingTo = keyword.onlyInNotesLinkingTo;
        if (keyword.suggestMode !== null && keyword.suggestMode !== undefined) settings.suggestMode = keyword.suggestMode;
        if (keyword.preventSelfLink !== null && keyword.preventSelfLink !== undefined) settings.preventSelfLink = keyword.preventSelfLink;

        return settings;
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

            // Get effective settings (merges group settings with keyword-specific settings)
            const effectiveSettings = this.getEffectiveKeywordSettings(item);

            // Add the main keyword with its settings
            map[item.keyword] = {
                target: item.target,
                ...effectiveSettings,
                keywordIndex: this.settings.keywords.indexOf(item)
            };

            // Add all manual variations, all pointing to the same target with same settings
            if (item.variations && item.variations.length > 0) {
                for (let variation of item.variations) {
                    if (variation.trim()) {
                        map[variation] = {
                            target: item.target,
                            ...effectiveSettings,
                            keywordIndex: this.settings.keywords.indexOf(item)
                        };
                    }
                }
            }

            // Auto-discover aliases from the target note's frontmatter
            const aliases = this.getAliasesForNote(item.target);
            if (aliases && aliases.length > 0) {
                for (let alias of aliases) {
                    if (alias.trim()) {
                        // Add alias to keyword map (only if not already present)
                        if (!map[alias]) {
                            map[alias] = {
                                target: item.target,
                                ...effectiveSettings,
                                keywordIndex: this.settings.keywords.indexOf(item)
                            };
                        }
                    }
                }
            }
        }

        return map;
    }

    /**
     * Check if a keyword should be linked based on its link scope settings
     * @param {TFile} sourceFile - The file being processed (source)
     * @param {string} targetNoteName - The target note name
     * @param {string} linkScope - The link scope setting ('vault-wide', 'same-folder', 'source-folder', 'target-folder')
     * @param {string} scopeFolder - The folder path for source-folder or target-folder scopes
     * @returns {boolean} True if the keyword should be linked
     */
    checkLinkScope(sourceFile, targetNoteName, linkScope, scopeFolder) {
        // Vault-wide: always link
        if (linkScope === 'vault-wide') {
            return true;
        }

        // Get source file's folder
        const sourceFolder = sourceFile.parent ? sourceFile.parent.path : '';

        // Same folder only: check if source and target are in the same folder
        if (linkScope === 'same-folder') {
            // Find the target file
            const targetFile = this.findTargetFile(targetNoteName);
            if (!targetFile) {
                return false; // Target doesn't exist
            }
            const targetFolder = targetFile.parent ? targetFile.parent.path : '';
            return sourceFolder === targetFolder;
        }

        // Source in folder: check if source file is in the specified folder
        if (linkScope === 'source-folder') {
            if (!scopeFolder) {
                return true; // No folder specified, allow linking
            }
            // Normalize folder paths (remove leading/trailing slashes)
            const normalizedScopeFolder = scopeFolder.replace(/^\/+|\/+$/g, '');
            const normalizedSourceFolder = sourceFolder.replace(/^\/+|\/+$/g, '');

            // Check if source is in the specified folder or a subfolder
            return normalizedSourceFolder === normalizedScopeFolder ||
                   normalizedSourceFolder.startsWith(normalizedScopeFolder + '/');
        }

        // Target in folder: check if target file is in the specified folder
        if (linkScope === 'target-folder') {
            if (!scopeFolder) {
                return true; // No folder specified, allow linking
            }
            const targetFile = this.findTargetFile(targetNoteName);
            if (!targetFile) {
                return false; // Target doesn't exist
            }
            const targetFolder = targetFile.parent ? targetFile.parent.path : '';

            // Normalize folder paths
            const normalizedScopeFolder = scopeFolder.replace(/^\/+|\/+$/g, '');
            const normalizedTargetFolder = targetFolder.replace(/^\/+|\/+$/g, '');

            // Check if target is in the specified folder or a subfolder
            return normalizedTargetFolder === normalizedScopeFolder ||
                   normalizedTargetFolder.startsWith(normalizedScopeFolder + '/');
        }

        // Default: allow linking
        return true;
    }

    /**
     * Find a target file by name
     * @param {string} noteName - Name of the note (with or without .md extension)
     * @returns {TFile|null} The file object or null if not found
     */
    findTargetFile(noteName) {
        const files = this.app.vault.getMarkdownFiles();
        const noteBasename = noteName.endsWith('.md') ? noteName.slice(0, -3) : noteName;

        for (let file of files) {
            // Check if basename matches
            if (file.basename.toLowerCase() === noteBasename.toLowerCase()) {
                return file;
            }
            // Also check full path without extension (for notes in folders)
            const pathWithoutExt = file.path.endsWith('.md') ? file.path.slice(0, -3) : file.path;
            if (pathWithoutExt.toLowerCase() === noteBasename.toLowerCase()) {
                return file;
            }
        }
        return null;
    }

    /**
     * Get aliases from a note's YAML frontmatter
     * @param {string} noteName - Name of the note (with or without .md extension)
     * @returns {Array<string>} Array of aliases, or empty array if none found
     */
    getAliasesForNote(noteName) {
        try {
            // Find the file - try with and without .md extension
            const files = this.app.vault.getMarkdownFiles();
            let targetFile = null;

            // Remove .md extension if present for comparison
            const noteBasename = noteName.endsWith('.md') ? noteName.slice(0, -3) : noteName;

            for (let file of files) {
                // Check if basename matches (case-insensitive for better matching)
                if (file.basename.toLowerCase() === noteBasename.toLowerCase()) {
                    targetFile = file;
                    break;
                }
                // Also check full path without extension (for notes in folders)
                const pathWithoutExt = file.path.endsWith('.md') ? file.path.slice(0, -3) : file.path;
                if (pathWithoutExt.toLowerCase() === noteBasename.toLowerCase()) {
                    targetFile = file;
                    break;
                }
            }

            // If file not found, return empty array
            if (!targetFile) {
                return [];
            }

            // Use Obsidian's metadataCache to get frontmatter (much faster than reading file)
            const cache = this.app.metadataCache.getFileCache(targetFile);
            if (!cache || !cache.frontmatter) {
                return [];
            }

            // Extract aliases - could be 'aliases' or 'alias', could be array or string
            const frontmatter = cache.frontmatter;
            let aliases = [];

            // Check for 'aliases' field (most common)
            if (frontmatter.aliases) {
                if (Array.isArray(frontmatter.aliases)) {
                    aliases = aliases.concat(frontmatter.aliases);
                } else if (typeof frontmatter.aliases === 'string') {
                    aliases.push(frontmatter.aliases);
                }
            }

            // Also check for 'alias' field (singular)
            if (frontmatter.alias) {
                if (Array.isArray(frontmatter.alias)) {
                    aliases = aliases.concat(frontmatter.alias);
                } else if (typeof frontmatter.alias === 'string') {
                    aliases.push(frontmatter.alias);
                }
            }

            // Filter out empty strings and return
            return aliases.filter(a => a && typeof a === 'string' && a.trim());
        } catch (error) {
            console.error('Error getting aliases for note:', noteName, error);
            return [];
        }
    }

    /**
     * Check if a note has a required tag (in frontmatter or inline)
     * @param {string} noteName - Name of the note (with or without .md extension)
     * @param {string} requiredTag - The tag to check for (without # prefix)
     * @returns {boolean} True if note has the tag, false otherwise
     */
    noteHasTag(noteName, requiredTag) {
        try {
            // If no tag required, return true (no restriction)
            if (!requiredTag || requiredTag.trim() === '') {
                return true;
            }

            // Normalize the required tag (remove # if present)
            const normalizedTag = requiredTag.trim().replace(/^#/, '').toLowerCase();

            // Find the file - try with and without .md extension
            let targetFile = null;
            const files = this.app.vault.getMarkdownFiles();
            const noteBasename = noteName.replace(/\.md$/, '');

            for (let file of files) {
                // Check if basename matches (case-insensitive for better matching)
                if (file.basename.toLowerCase() === noteBasename.toLowerCase()) {
                    targetFile = file;
                    break;
                }
                // Also check full path without extension (for notes in folders)
                const pathWithoutExt = file.path.endsWith('.md') ? file.path.slice(0, -3) : file.path;
                if (pathWithoutExt.toLowerCase() === noteBasename.toLowerCase()) {
                    targetFile = file;
                    break;
                }
            }

            // If file not found, return false (can't verify tag)
            if (!targetFile) {
                return false;
            }

            // Use Obsidian's metadataCache to get tags
            const cache = this.app.metadataCache.getFileCache(targetFile);
            if (!cache) {
                return false;
            }

            // Check frontmatter tags
            if (cache.frontmatter) {
                const frontmatter = cache.frontmatter;
                let frontmatterTags = [];

                // Check for 'tags' field (most common)
                if (frontmatter.tags) {
                    if (Array.isArray(frontmatter.tags)) {
                        frontmatterTags = frontmatter.tags;
                    } else if (typeof frontmatter.tags === 'string') {
                        frontmatterTags = [frontmatter.tags];
                    }
                }

                // Check for 'tag' field (singular)
                if (frontmatter.tag) {
                    if (Array.isArray(frontmatter.tag)) {
                        frontmatterTags = frontmatterTags.concat(frontmatter.tag);
                    } else if (typeof frontmatter.tag === 'string') {
                        frontmatterTags.push(frontmatter.tag);
                    }
                }

                // Normalize and check frontmatter tags
                for (let tag of frontmatterTags) {
                    if (typeof tag === 'string') {
                        const normalized = tag.replace(/^#/, '').toLowerCase();
                        if (normalized === normalizedTag) {
                            return true;
                        }
                    }
                }
            }

            // Check inline tags (from metadataCache)
            if (cache.tags) {
                for (let tagInfo of cache.tags) {
                    // tagInfo.tag includes the # prefix
                    const normalized = tagInfo.tag.replace(/^#/, '').toLowerCase();
                    if (normalized === normalizedTag) {
                        return true;
                    }
                }
            }

            // Tag not found
            return false;
        } catch (error) {
            console.error('Error checking tag for note:', noteName, error);
            return false;
        }
    }

    /**
     * Check if a note has an existing link to a target note
     * @param {TFile} sourceFile - The source file to check
     * @param {string} targetNoteName - The target note name to look for links to
     * @returns {boolean} True if the source note has at least one link to the target note
     */
    noteHasLinkToTarget(sourceFile, targetNoteName) {
        try {
            // If no file provided, return false
            if (!sourceFile) {
                return false;
            }

            // Use Obsidian's metadataCache to get all links from the source file
            const cache = this.app.metadataCache.getFileCache(sourceFile);
            if (!cache || !cache.links || cache.links.length === 0) {
                return false;
            }

            // Normalize target note name (remove .md extension if present)
            const normalizedTarget = targetNoteName.replace(/\.md$/, '').toLowerCase();

            // Check each link in the source file
            for (let link of cache.links) {
                // link.link is the raw link destination (e.g., "Languages/Python" or "Python")
                const linkDest = link.link.toLowerCase();

                // Direct match
                if (linkDest === normalizedTarget) {
                    return true;
                }

                // Check if link destination ends with the target (handles paths)
                // e.g., link: "Languages/Python" matches target: "Python"
                if (linkDest.endsWith('/' + normalizedTarget)) {
                    return true;
                }

                // Check if target ends with the link (handles partial paths)
                // e.g., link: "Python" matches target: "Languages/Python"
                if (normalizedTarget.endsWith('/' + linkDest)) {
                    return true;
                }

                // Try to resolve the link to an actual file and compare basenames
                const linkedFile = this.app.metadataCache.getFirstLinkpathDest(link.link, sourceFile.path);
                if (linkedFile) {
                    const linkedBasename = linkedFile.basename.toLowerCase();
                    const targetBasename = normalizedTarget.split('/').pop();

                    if (linkedBasename === targetBasename) {
                        return true;
                    }
                }
            }

            // No matching link found
            return false;
        } catch (error) {
            console.error('Error checking links in note:', sourceFile.path, error);
            return false;
        }
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
     * Generate a unique ID for keywords or groups
     * @param {string} prefix - Prefix for the ID (e.g., 'kw' for keywords, 'grp' for groups)
     * @returns {string} Unique ID
     */
    generateId(prefix = 'id') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
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

        // Ensure customStopWords exists and is an array
        if (!this.settings.customStopWords || !Array.isArray(this.settings.customStopWords)) {
            this.settings.customStopWords = DEFAULT_SETTINGS.customStopWords;
        }

        // Ensure keywordGroups array exists (migration for existing users)
        if (!this.settings.keywordGroups) {
            this.settings.keywordGroups = [];
        }

        // Ensure enableTags, linkScope, id, and groupId fields exist for all keywords
        if (this.settings.keywords) {
            for (let keyword of this.settings.keywords) {
                // Add ID if missing (migration for existing keywords)
                if (!keyword.id) {
                    keyword.id = this.generateId('kw');
                }
                // Add groupId if missing (migration for existing keywords)
                if (keyword.groupId === undefined) {
                    keyword.groupId = null;
                }
                // Use null for boolean settings to allow group inheritance
                // Only set to false if explicitly undefined (for migration)
                if (keyword.enableTags === undefined) {
                    keyword.enableTags = null;
                }
                // Convert false to null for keywords in groups to enable inheritance
                if (keyword.groupId && keyword.enableTags === false) {
                    keyword.enableTags = null;
                }
                if (keyword.linkScope === undefined) {
                    keyword.linkScope = 'vault-wide';
                }
                if (keyword.scopeFolder === undefined) {
                    keyword.scopeFolder = '';
                }
                if (keyword.requireTag === undefined) {
                    keyword.requireTag = '';
                }
                if (keyword.onlyInNotesLinkingTo === undefined) {
                    keyword.onlyInNotesLinkingTo = null;
                }
                if (keyword.groupId && keyword.onlyInNotesLinkingTo === false) {
                    keyword.onlyInNotesLinkingTo = null;
                }
                if (keyword.suggestMode === undefined) {
                    keyword.suggestMode = null;
                }
                if (keyword.groupId && keyword.suggestMode === false) {
                    keyword.suggestMode = null;
                }
                if (keyword.preventSelfLink === undefined) {
                    keyword.preventSelfLink = null;
                }
                if (keyword.groupId && keyword.preventSelfLink === false) {
                    keyword.preventSelfLink = null;
                }
                if (keyword.useRelativeLinks === undefined) {
                    keyword.useRelativeLinks = null;
                }
                if (keyword.groupId && keyword.useRelativeLinks === false) {
                    keyword.useRelativeLinks = null;
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

    /**
     * Add custom CSS styles for the improved UI
     * This is called on plugin load to ensure styles are available for all modals
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

            /* Tab Navigation */
            .akl-tab-nav {
                display: flex;
                gap: 0.5em;
                margin-bottom: 1.5em;
                border-bottom: 2px solid var(--background-modifier-border);
                padding-bottom: 0;
            }

            .akl-tab-button {
                padding: 0.75em 1.25em;
                background: transparent;
                border: none;
                border-bottom: 2px solid transparent;
                color: var(--text-muted);
                cursor: pointer;
                font-size: 0.95em;
                font-weight: 500;
                transition: all 0.2s ease;
                margin-bottom: -2px;
            }

            .akl-tab-button:hover {
                color: var(--text-normal);
                background: var(--background-modifier-hover);
            }

            .akl-tab-active {
                color: var(--interactive-accent) !important;
                border-bottom-color: var(--interactive-accent) !important;
            }

            /* Responsive: Wrap tabs on portrait phones */
            @media (max-width: 600px) and (orientation: portrait) {
                .akl-tab-nav {
                    flex-wrap: wrap;
                }

                .akl-tab-button {
                    padding: 0.6em 1em;
                    font-size: 0.9em;
                    flex: 0 1 auto;
                }
            }

            .akl-tab-content {
                animation: fadeIn 0.2s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .akl-stats-bar {
                color: var(--text-muted);
                font-size: 0.9em;
                padding: 0.75em 1em;
                background: var(--background-secondary);
                border-radius: 8px;
                margin-bottom: 1.5em;
            }

            /* Section Headers */
            .akl-section-header {
                margin-top: 2em;
                margin-bottom: 1em;
            }

            .akl-subsection-header {
                margin-top: 1.5em;
                margin-bottom: 0.75em;
                font-size: 1em;
                font-weight: 600;
            }

            /* Empty State */
            .akl-empty-state {
                text-align: center;
                padding: 3em 2em;
                color: var(--text-muted);
            }

            .akl-empty-state p:first-child {
                font-size: 1.1em;
                font-weight: 500;
                margin-bottom: 0.5em;
                color: var(--text-normal);
            }

            .akl-empty-hint {
                font-size: 0.9em;
            }

            .akl-hint-text {
                color: var(--text-muted);
                font-size: 0.9em;
                margin: 0.5em 0;
            }

            /* Group-specific styles */
            .akl-group-card {
                border-left: 3px solid var(--interactive-accent);
            }

            .akl-groups-container {
                display: grid;
                gap: 1em;
                margin-bottom: 1em;
            }

            .akl-group-keywords-section,
            .akl-group-settings-section {
                margin-top: 1.5em;
                padding-top: 1.5em;
                border-top: 1px solid var(--background-modifier-border);
            }

            .akl-keywords-list {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5em;
                margin: 1em 0;
            }

            .akl-keyword-chip {
                display: inline-flex;
                align-items: center;
                gap: 0.5em;
                padding: 0.4em 0.8em;
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 12px;
                font-size: 0.9em;
                transition: all 0.2s ease;
            }

            .akl-keyword-chip:hover {
                background: var(--background-modifier-hover);
            }

            .akl-chip-remove {
                cursor: pointer;
                color: var(--text-muted);
                font-size: 1.2em;
                line-height: 1;
                transition: color 0.2s ease;
            }

            .akl-chip-remove:hover {
                color: var(--text-error);
            }

            .akl-button-secondary {
                padding: 0.6em 1.2em;
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                color: var(--text-normal);
                cursor: pointer;
                font-size: 0.9em;
                transition: all 0.2s ease;
            }

            .akl-button-secondary:hover {
                background: var(--background-modifier-hover);
                border-color: var(--interactive-accent);
            }

            .akl-delete-btn {
                padding: 0.5em 1em;
                background: transparent;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                color: var(--text-muted);
                cursor: pointer;
                font-size: 0.85em;
                transition: all 0.2s ease;
            }

            .akl-delete-btn:hover {
                background: var(--background-modifier-error);
                border-color: var(--text-error);
                color: var(--text-on-accent);
            }

            .akl-section-header h3 {
                margin-bottom: 0.25em;
            }

            .akl-section-desc {
                color: var(--text-muted);
                margin-top: 0;
            }

            /* Search Container */
            .akl-search-container {
                margin-bottom: 1em;
            }

            .akl-search-input {
                width: 100%;
                padding: 0.6em 1em;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                background: var(--background-primary);
                color: var(--text-normal);
                font-size: 0.95em;
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
            }

            .akl-search-input:focus {
                outline: none;
                border-color: var(--interactive-accent);
                box-shadow: 0 0 0 2px var(--interactive-accent-hover);
            }

            .akl-search-input::placeholder {
                color: var(--text-muted);
            }

            /* No Results Message */
            .akl-no-results {
                text-align: center;
                padding: 3em 2em;
                color: var(--text-muted);
            }

            .akl-no-results p:first-child {
                font-size: 1.1em;
                font-weight: 500;
                margin-bottom: 0.5em;
                color: var(--text-normal);
            }

            .akl-no-results-hint {
                font-size: 0.9em;
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

            .akl-badge-md-links {
                background: var(--interactive-accent);
                color: white;
            }

            .akl-badge-suggest {
                background: #ffaa00;
                color: white;
            }

            .akl-badge-group {
                background: var(--interactive-accent);
                color: white;
            }

            .akl-badge-variations {
                background: var(--background-modifier-border);
                color: var(--text-muted);
            }

            /* Suggested Link Styles */
            .akl-suggested-link {
                background-color: rgba(255, 170, 0, 0.15);
                border-bottom: 2px dotted #ffaa00;
                cursor: pointer;
                position: relative;
                transition: background-color 0.2s ease;
            }

            .akl-suggested-link:hover {
                background-color: rgba(255, 170, 0, 0.25);
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

            /* Auto-discovered alias chips - different style */
            .akl-chip-auto {
                background: var(--interactive-accent-hover);
                border: 1px solid var(--interactive-accent);
                opacity: 0.85;
            }

            .akl-chip-auto:hover {
                opacity: 1;
                background: var(--interactive-accent-hover);
            }

            .akl-chip-auto-indicator {
                font-size: 0.9em;
                opacity: 0.7;
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

            .akl-controls-container {
                display: flex;
                gap: 1em;
                margin-bottom: 1em;
                flex-wrap: wrap;
            }

            .akl-sort-container {
                display: flex;
                align-items: center;
                gap: 0.5em;
            }

            .akl-sort-label {
                color: var(--text-muted);
                font-size: 0.9em;
                white-space: nowrap;
            }

            .akl-sort-select {
                padding: 0.5em 0.8em;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background: var(--background-primary);
                color: var(--text-normal);
                font-size: 0.9em;
                cursor: pointer;
            }

            .akl-sort-select:focus {
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
    constructor(app, plugin, currentFile = null) {
        super(app);
        this.plugin = plugin;
        this.currentFile = currentFile; // If provided, analyze only this file
        this.suggestions = [];
        this.selectedSuggestions = new Map(); // keyword -> { selected: boolean, addAsVariationTo: string|null }
        this.isAnalyzing = true;
        this.searchQuery = '';
        this.sortOrder = 'frequency-desc'; // Default sort order
    }

    async onOpen() {
        const {contentEl} = this;
        contentEl.addClass('akl-suggestion-modal');

        // Title
        const titleText = this.currentFile
            ? `Suggested Keyword Builder - ${this.currentFile.basename}`
            : 'Suggested Keyword Builder';
        contentEl.createEl('h2', {text: titleText});

        // Status area
        const statusEl = contentEl.createDiv({cls: 'akl-status'});
        const analyzeText = this.currentFile
            ? 'Analyzing current note...'
            : 'Analyzing your notes...';
        statusEl.createEl('p', {text: analyzeText, cls: 'akl-analyzing'});

        // Start analysis
        try {
            // Use different analysis method based on scope
            if (this.currentFile) {
                this.suggestions = await this.plugin.analyzeCurrentNoteForKeywords(this.currentFile);
            } else {
                this.suggestions = await this.plugin.analyzeNotesForKeywords();
            }
            this.isAnalyzing = false;

            // Update status
            statusEl.empty();
            const noteCount = this.currentFile ? 1 : this.plugin.app.vault.getMarkdownFiles().length;
            const noteText = noteCount === 1 ? 'note' : 'notes';
            statusEl.createEl('p', {
                text: `Found ${this.suggestions.length} suggestions from ${noteCount} ${noteText}`,
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
        // Search and sort controls
        const controlsContainer = container.createDiv({cls: 'akl-controls-container'});

        // Search box
        const searchContainer = controlsContainer.createDiv({cls: 'akl-search-container'});
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

        // Sort order dropdown
        const sortContainer = controlsContainer.createDiv({cls: 'akl-sort-container'});
        const sortLabel = sortContainer.createEl('label', {
            text: 'Sort by: ',
            cls: 'akl-sort-label'
        });
        const sortSelect = sortContainer.createEl('select', {cls: 'akl-sort-select'});

        const sortOptions = [
            { value: 'frequency-desc', label: 'Most Common First' },
            { value: 'frequency-asc', label: 'Least Common First' },
            { value: 'alpha-asc', label: 'A to Z' },
            { value: 'alpha-desc', label: 'Z to A' },
            { value: 'length-asc', label: 'Shortest First' },
            { value: 'length-desc', label: 'Longest First' }
        ];

        for (let option of sortOptions) {
            const optionEl = sortSelect.createEl('option', {
                value: option.value,
                text: option.label
            });
            if (option.value === this.sortOrder) {
                optionEl.selected = true;
            }
        }

        sortSelect.addEventListener('change', (e) => {
            this.sortOrder = e.target.value;
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

    sortSuggestions(suggestions) {
        const sorted = [...suggestions]; // Create a copy to avoid mutating original

        switch (this.sortOrder) {
            case 'frequency-desc':
                // Most common first (most notes)
                sorted.sort((a, b) => b.totalNotes - a.totalNotes);
                break;

            case 'frequency-asc':
                // Least common first (fewest notes)
                sorted.sort((a, b) => a.totalNotes - b.totalNotes);
                break;

            case 'alpha-asc':
                // A to Z
                sorted.sort((a, b) => a.keyword.localeCompare(b.keyword));
                break;

            case 'alpha-desc':
                // Z to A
                sorted.sort((a, b) => b.keyword.localeCompare(a.keyword));
                break;

            case 'length-asc':
                // Shortest first
                sorted.sort((a, b) => a.keyword.length - b.keyword.length);
                break;

            case 'length-desc':
                // Longest first
                sorted.sort((a, b) => b.keyword.length - a.keyword.length);
                break;

            default:
                // Default to frequency descending
                sorted.sort((a, b) => b.totalNotes - a.totalNotes);
        }

        return sorted;
    }

    refreshSuggestionList() {
        if (!this.suggestionsListEl) return;

        this.suggestionsListEl.empty();

        // Filter suggestions based on search
        let filteredSuggestions = this.suggestions.filter(s => this.matchesSearch(s.keyword));

        if (filteredSuggestions.length === 0) {
            this.suggestionsListEl.createEl('p', {
                text: 'No suggestions match your search.',
                cls: 'akl-no-results'
            });
            return;
        }

        // Sort suggestions based on selected sort order
        filteredSuggestions = this.sortSuggestions(filteredSuggestions);

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
                    enableTags: false,
                    linkScope: 'vault-wide',
                    scopeFolder: ''
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
 * Import CSV Modal
 */
class ImportCSVModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.createEl('h2', {text: 'Import Keywords from CSV'});

        contentEl.createEl('p', {
            text: 'Select a CSV file from your vault to import keywords. This will ADD to your existing keywords.'
        });

        // Get all CSV files in vault
        const csvFiles = this.app.vault.getFiles().filter(f => f.extension === 'csv');

        if (csvFiles.length === 0) {
            contentEl.createEl('p', {
                text: 'No CSV files found in vault. Download a template first or export existing keywords.',
                cls: 'mod-warning'
            });

            const closeBtn = contentEl.createEl('button', {text: 'Close'});
            closeBtn.addEventListener('click', () => this.close());
            return;
        }

        const dropdown = contentEl.createEl('select');
        dropdown.style.width = '100%';
        dropdown.style.marginBottom = '10px';

        for (let file of csvFiles) {
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
                    const lines = content.split('\n').filter(line => line.trim());

                    if (lines.length === 0) {
                        new Notice('CSV file is empty');
                        return;
                    }

                    // Parse header
                    const headers = this.plugin.parseCSVLine(lines[0]);
                    const headerMap = {};
                    headers.forEach((header, index) => {
                        headerMap[header.toLowerCase()] = index;
                    });

                    // Validate required headers
                    if (headerMap['keyword'] === undefined || headerMap['target'] === undefined) {
                        new Notice('CSV must have "keyword" and "target" columns');
                        return;
                    }

                    let addedCount = 0;
                    let mergedCount = 0;
                    let errorCount = 0;
                    const errors = [];

                    // Parse data rows
                    for (let i = 1; i < lines.length; i++) {
                        const lineNum = i + 1;
                        try {
                            const fields = this.plugin.parseCSVLine(lines[i]);

                            // Skip empty rows
                            if (fields.length === 0 || !fields[headerMap['keyword']]) {
                                continue;
                            }

                            const keyword = fields[headerMap['keyword']] || '';
                            const target = fields[headerMap['target']] || '';

                            if (!keyword.trim() || !target.trim()) {
                                errors.push(`Line ${lineNum}: Missing keyword or target`);
                                errorCount++;
                                continue;
                            }

                            // Parse variations (pipe-separated)
                            const variationsStr = fields[headerMap['variations']] || '';
                            const variations = variationsStr
                                ? variationsStr.split('|').map(v => v.trim()).filter(v => v)
                                : [];

                            // Parse boolean fields
                            const parseBool = (value) => {
                                if (typeof value === 'boolean') return value;
                                const str = String(value).toLowerCase().trim();
                                return str === 'true' || str === 'yes' || str === '1';
                            };

                            // Build keyword object
                            const keywordObj = {
                                keyword: keyword.trim(),
                                target: target.trim(),
                                variations: variations,
                                enableTags: parseBool(fields[headerMap['enabletags']] || false),
                                linkScope: fields[headerMap['linkscope']] || 'vault-wide',
                                scopeFolder: fields[headerMap['scopefolder']] || '',
                                useRelativeLinks: parseBool(fields[headerMap['userelativelinks']] || false),
                                blockRef: fields[headerMap['blockref']] || '',
                                requireTag: fields[headerMap['requiretag']] || '',
                                onlyInNotesLinkingTo: parseBool(fields[headerMap['onlyinnoteslinkingto']] || false),
                                suggestMode: parseBool(fields[headerMap['suggestmode']] || false),
                                preventSelfLink: parseBool(fields[headerMap['preventselflink']] || false)
                            };

                            // Check if keyword already exists
                            const existingIndex = this.plugin.settings.keywords.findIndex(
                                k => k.keyword.toLowerCase() === keywordObj.keyword.toLowerCase()
                            );

                            if (existingIndex !== -1) {
                                // Merge variations into existing keyword
                                const existing = this.plugin.settings.keywords[existingIndex];
                                const existingVars = new Set(existing.variations.map(v => v.toLowerCase()));

                                let addedVars = false;
                                for (let variation of keywordObj.variations) {
                                    if (!existingVars.has(variation.toLowerCase())) {
                                        existing.variations.push(variation);
                                        addedVars = true;
                                    }
                                }

                                if (addedVars) {
                                    mergedCount++;
                                }
                            } else {
                                // Add new keyword
                                this.plugin.settings.keywords.push(keywordObj);
                                addedCount++;
                            }

                        } catch (rowError) {
                            errors.push(`Line ${lineNum}: ${rowError.message}`);
                            errorCount++;
                        }
                    }

                    // Save settings
                    await this.plugin.saveSettings();

                    // Build result message
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

                    if (errorCount > 0) {
                        message += `\n${errorCount} error(s) encountered`;
                        console.error('CSV Import Errors:', errors);
                    }

                    new Notice(message);
                    this.close();

                    // Refresh settings tab if open
                    this.app.setting.close();
                    this.app.setting.open();
                    this.app.setting.openTabById(this.plugin.manifest.id);

                } catch (error) {
                    new Notice(`Import failed: ${error.message}`);
                    console.error('CSV Import Error:', error);
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
 * Modal for reviewing and accepting link suggestions
 */
class SuggestionReviewModal extends Modal {
    constructor(app, editor, suggestions) {
        super(app);
        this.editor = editor;
        this.suggestions = suggestions; // Array of {line, matchText, targetNote, blockRef, useRelative, fullMatch}
        this.selectedSuggestions = new Set(suggestions.map((_, i) => i)); // All selected by default
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.empty();
        contentEl.addClass('akl-suggestion-review-modal');

        // Title
        contentEl.createEl('h2', {text: 'Review Link Suggestions'});

        // Description
        const desc = contentEl.createEl('p', {
            text: `Found ${this.suggestions.length} link suggestion${this.suggestions.length > 1 ? 's' : ''} in this note. Select which ones to accept:`
        });
        desc.style.marginBottom = '1em';
        desc.style.color = 'var(--text-muted)';

        // Select all / Deselect all buttons
        const buttonContainer = contentEl.createDiv({cls: 'akl-button-container'});
        buttonContainer.style.marginBottom = '1em';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '0.5em';

        const selectAllBtn = buttonContainer.createEl('button', {text: 'Select All'});
        selectAllBtn.addEventListener('click', () => {
            this.suggestions.forEach((_, i) => {
                this.selectedSuggestions.add(i);
                const checkbox = contentEl.querySelector(`input[data-index="${i}"]`);
                if (checkbox) checkbox.checked = true;
            });
        });

        const deselectAllBtn = buttonContainer.createEl('button', {text: 'Deselect All'});
        deselectAllBtn.addEventListener('click', () => {
            this.selectedSuggestions.clear();
            contentEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        });

        // Suggestions list
        const listContainer = contentEl.createDiv({cls: 'akl-suggestions-list'});
        listContainer.style.maxHeight = '400px';
        listContainer.style.overflowY = 'auto';
        listContainer.style.marginBottom = '1em';
        listContainer.style.border = '1px solid var(--background-modifier-border)';
        listContainer.style.borderRadius = '6px';
        listContainer.style.padding = '0.5em';

        this.suggestions.forEach((suggestion, index) => {
            const item = listContainer.createDiv({cls: 'akl-suggestion-item'});
            item.style.padding = '0.75em';
            item.style.marginBottom = '0.5em';
            item.style.background = 'var(--background-secondary)';
            item.style.borderRadius = '6px';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.gap = '0.75em';

            // Checkbox
            const checkbox = item.createEl('input', {type: 'checkbox'});
            checkbox.checked = true;
            checkbox.setAttribute('data-index', index.toString());
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectedSuggestions.add(index);
                } else {
                    this.selectedSuggestions.delete(index);
                }
            });

            // Content
            const content = item.createDiv({cls: 'akl-suggestion-content'});
            content.style.flex = '1';

            // Keyword and target
            const keywordLine = content.createDiv();
            keywordLine.style.marginBottom = '0.25em';
            keywordLine.createSpan({text: suggestion.matchText, cls: 'akl-keyword-highlight'});
            keywordLine.createSpan({text: ' → ', cls: 'akl-arrow'});
            keywordLine.createSpan({text: suggestion.targetNote, cls: 'akl-target-highlight'});

            // Line number and context
            const contextLine = content.createDiv();
            contextLine.style.fontSize = '0.9em';
            contextLine.style.color = 'var(--text-muted)';
            contextLine.createSpan({text: `Line ${suggestion.lineNumber + 1}`});

            // Style the highlighted keyword
            const highlights = keywordLine.querySelectorAll('.akl-keyword-highlight');
            highlights.forEach(h => {
                h.style.background = 'rgba(255, 170, 0, 0.25)';
                h.style.padding = '2px 4px';
                h.style.borderRadius = '3px';
                h.style.fontWeight = '500';
            });

            const targets = keywordLine.querySelectorAll('.akl-target-highlight');
            targets.forEach(t => {
                t.style.color = 'var(--text-accent)';
                t.style.fontWeight = '500';
            });
        });

        // Action buttons
        const actionContainer = contentEl.createDiv({cls: 'akl-action-buttons'});
        actionContainer.style.display = 'flex';
        actionContainer.style.gap = '0.5em';
        actionContainer.style.justifyContent = 'flex-end';

        const cancelBtn = actionContainer.createEl('button', {text: 'Cancel'});
        cancelBtn.addEventListener('click', () => this.close());

        const acceptBtn = actionContainer.createEl('button', {text: `Accept Selected (${this.selectedSuggestions.size})`, cls: 'mod-cta'});
        acceptBtn.addEventListener('click', () => {
            this.acceptSelected();
        });

        // Update button text when selections change
        const updateButtonText = () => {
            acceptBtn.textContent = `Accept Selected (${this.selectedSuggestions.size})`;
        };

        contentEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', updateButtonText);
        });
    }

    acceptSelected() {
        if (this.selectedSuggestions.size === 0) {
            new Notice('No suggestions selected');
            return;
        }

        // Sort by line number in reverse order (bottom to top)
        // This way we don't mess up line numbers as we modify the document
        const selectedIndices = Array.from(this.selectedSuggestions).sort((a, b) => {
            return this.suggestions[b].lineNumber - this.suggestions[a].lineNumber;
        });

        let acceptedCount = 0;

        selectedIndices.forEach(index => {
            const suggestion = this.suggestions[index];
            const line = this.editor.getLine(suggestion.lineNumber);

            // Check if suggestion still exists on this line
            if (!line.includes(suggestion.fullMatch)) return;

            // Check if current line is inside a table
            const content = this.editor.getValue();
            const lineStart = this.editor.posToOffset({ line: suggestion.lineNumber, ch: 0 });
            const plugin = this.app.plugins.plugins['auto-keyword-linker'];
            const insideTable = plugin ? plugin.isInsideTable(content, lineStart) : false;

            // Create the link
            let link;
            const targetWithBlock = suggestion.blockRef ? `${suggestion.targetNote}#${suggestion.blockRef}` : suggestion.targetNote;

            if (suggestion.useRelative) {
                // Use relative markdown link format
                // Escape pipe characters in the display text if inside a table to prevent breaking table columns
                const escapedMatchText = insideTable ? suggestion.matchText.replace(/\|/g, '\\|') : suggestion.matchText;
                const encodedTarget = encodeURIComponent(suggestion.targetNote) + '.md';
                const blockPart = suggestion.blockRef ? `#${suggestion.blockRef}` : '';
                link = `[${escapedMatchText}](${encodedTarget}${blockPart})`;
            } else {
                // Use wikilink format
                if (insideTable) {
                    // Inside tables: Escape the pipe with single backslash \| to prevent breaking table formatting
                    link = suggestion.targetNote === suggestion.matchText && !suggestion.blockRef
                        ? `[[${suggestion.matchText}]]`
                        : `[[${targetWithBlock}\\|${suggestion.matchText}]]`;
                } else {
                    // Outside table: standard wikilink format with | separator for alias
                    link = suggestion.targetNote === suggestion.matchText && !suggestion.blockRef
                        ? `[[${suggestion.matchText}]]`
                        : `[[${targetWithBlock}|${suggestion.matchText}]]`;
                }
            }

            // Replace the span with the link
            const newLine = line.replace(suggestion.fullMatch, link);
            this.editor.setLine(suggestion.lineNumber, newLine);
            acceptedCount++;
        });

        new Notice(`Accepted ${acceptedCount} link suggestion${acceptedCount > 1 ? 's' : ''}`);
        this.close();

        // Update status bar
        setTimeout(() => {
            const view = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (view && view.editor) {
                const plugin = this.app.plugins.plugins['auto-keyword-linker'];
                if (plugin && plugin.updateStatusBar) {
                    plugin.updateStatusBar();
                }
            }
        }, 100);
    }

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
        // Track which specific links are selected for processing
        // Format: Map<noteIndex, Set<changeIndex>>
        this.selectedLinks = new Map();

        // Initialize all links as selected by default
        this.results.forEach((result, noteIndex) => {
            const linkIndices = new Set(result.changes.map((_, i) => i));
            this.selectedLinks.set(noteIndex, linkIndices);
        });
    }

    /**
     * Called when the modal is opened
     * Builds the modal content
     */
    onOpen() {
        const {contentEl} = this;
        contentEl.createEl('h2', {text: 'Preview: Select Links to Create'});

        // Calculate and show total statistics
        const totalLinks = this.results.reduce((sum, r) => sum + r.linkCount, 0);
        const initialSelectedCount = this.getSelectedLinksCount();
        const statsText = `Found ${totalLinks} link(s) in ${this.results.length} note(s). ${initialSelectedCount} link(s) selected.`;
        const statsEl = contentEl.createEl('p', {text: statsText, cls: 'bulk-preview-stats'});

        // Select/Deselect all buttons
        const selectButtonsDiv = contentEl.createDiv({cls: 'bulk-preview-select-buttons'});
        selectButtonsDiv.style.marginBottom = '15px';
        selectButtonsDiv.style.display = 'flex';
        selectButtonsDiv.style.gap = '10px';

        const selectAllBtn = selectButtonsDiv.createEl('button', {text: 'Select All Links'});
        selectAllBtn.addEventListener('click', () => {
            this.results.forEach((result, noteIndex) => {
                const linkIndices = new Set(result.changes.map((_, i) => i));
                this.selectedLinks.set(noteIndex, linkIndices);
            });
            contentEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
            this.updateStats(statsEl);
        });

        const deselectAllBtn = selectButtonsDiv.createEl('button', {text: 'Deselect All Links'});
        deselectAllBtn.addEventListener('click', () => {
            this.selectedLinks.clear();
            contentEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            this.updateStats(statsEl);
        });

        // Create scrollable container for results
        const scrollDiv = contentEl.createDiv({cls: 'preview-scroll'});
        scrollDiv.style.maxHeight = '400px';
        scrollDiv.style.overflowY = 'auto';
        scrollDiv.style.marginBottom = '20px';
        scrollDiv.style.border = '1px solid var(--background-modifier-border)';
        scrollDiv.style.borderRadius = '6px';
        scrollDiv.style.padding = '10px';

        // Display results for each file with individual link checkboxes
        this.results.forEach((result, noteIndex) => {
            const noteDiv = scrollDiv.createDiv({cls: 'preview-note'});
            noteDiv.style.marginBottom = '15px';
            noteDiv.style.padding = '10px';
            noteDiv.style.background = 'var(--background-secondary)';
            noteDiv.style.borderRadius = '6px';

            // Note header with select all checkbox
            const noteHeader = noteDiv.createDiv();
            noteHeader.style.display = 'flex';
            noteHeader.style.alignItems = 'center';
            noteHeader.style.gap = '10px';
            noteHeader.style.marginBottom = '10px';

            // Master checkbox for this note (selects/deselects all links in note)
            const noteCheckbox = noteHeader.createEl('input', {type: 'checkbox'});
            noteCheckbox.checked = true;
            noteCheckbox.setAttribute('data-note-index', noteIndex.toString());
            noteCheckbox.addEventListener('change', (e) => {
                const checked = e.target.checked;
                const linkSet = this.selectedLinks.get(noteIndex) || new Set();

                if (checked) {
                    // Select all links in this note
                    result.changes.forEach((_, linkIndex) => linkSet.add(linkIndex));
                    this.selectedLinks.set(noteIndex, linkSet);
                    // Check all link checkboxes
                    contentEl.querySelectorAll(`input[data-note="${noteIndex}"]`).forEach(cb => cb.checked = true);
                } else {
                    // Deselect all links in this note
                    this.selectedLinks.delete(noteIndex);
                    // Uncheck all link checkboxes
                    contentEl.querySelectorAll(`input[data-note="${noteIndex}"]`).forEach(cb => cb.checked = false);
                }
                this.updateStats(statsEl);
            });

            // Note title and count
            const noteTitleDiv = noteHeader.createDiv();
            noteTitleDiv.style.flex = '1';
            noteTitleDiv.createEl('strong', {text: result.fileName});
            noteTitleDiv.createEl('span', {
                text: ` (${result.linkCount} link${result.linkCount !== 1 ? 's' : ''})`,
                cls: 'bulk-preview-link-count'
            });

            // Links list with individual checkboxes
            const linksList = noteDiv.createDiv();
            linksList.style.marginLeft = '30px';

            result.changes.forEach((change, linkIndex) => {
                const linkItem = linksList.createDiv();
                linkItem.style.display = 'flex';
                linkItem.style.alignItems = 'flex-start';
                linkItem.style.gap = '8px';
                linkItem.style.marginBottom = '8px';
                linkItem.style.padding = '4px';
                linkItem.style.borderRadius = '4px';
                linkItem.style.transition = 'background 0.2s';

                linkItem.addEventListener('mouseenter', () => {
                    linkItem.style.background = 'var(--background-modifier-hover)';
                });
                linkItem.addEventListener('mouseleave', () => {
                    linkItem.style.background = 'transparent';
                });

                // Individual link checkbox
                const linkCheckbox = linkItem.createEl('input', {type: 'checkbox'});
                linkCheckbox.checked = true;
                linkCheckbox.setAttribute('data-note', noteIndex.toString());
                linkCheckbox.setAttribute('data-link', linkIndex.toString());
                linkCheckbox.style.marginTop = '2px';
                linkCheckbox.addEventListener('change', (e) => {
                    const linkSet = this.selectedLinks.get(noteIndex) || new Set();

                    if (e.target.checked) {
                        linkSet.add(linkIndex);
                    } else {
                        linkSet.delete(linkIndex);
                    }

                    if (linkSet.size === 0) {
                        this.selectedLinks.delete(noteIndex);
                    } else {
                        this.selectedLinks.set(noteIndex, linkSet);
                    }

                    // Update note-level checkbox state
                    const allChecked = result.changes.every((_, i) => {
                        const set = this.selectedLinks.get(noteIndex);
                        return set && set.has(i);
                    });
                    noteCheckbox.checked = allChecked;

                    this.updateStats(statsEl);
                });

                // Link content
                const linkContent = linkItem.createDiv();
                linkContent.style.flex = '1';
                linkContent.style.fontSize = '0.9em';

                const linkText = linkContent.createDiv();
                linkText.createEl('strong', {text: change.keyword});
                linkText.appendText(' → ');
                linkText.createEl('code', {text: `[[${change.target}]]`});

                // Show line number if available
                if (change.lineNumber !== undefined) {
                    const lineInfo = linkContent.createDiv();
                    lineInfo.style.fontSize = '0.85em';
                    lineInfo.style.color = 'var(--text-muted)';
                    lineInfo.style.marginTop = '2px';
                    lineInfo.textContent = `Line ${change.lineNumber + 1}`;
                }
            });
        });

        // Create button container
        const buttonDiv = contentEl.createDiv({cls: 'modal-button-container'});
        buttonDiv.style.display = 'flex';
        buttonDiv.style.gap = '10px';
        buttonDiv.style.justifyContent = 'flex-end';
        buttonDiv.style.marginTop = '20px';

        // Add "Cancel" button
        const closeBtn = buttonDiv.createEl('button', {text: 'Cancel'});
        closeBtn.addEventListener('click', () => this.close());

        // Add "Apply Selected Links" button (primary action)
        const selectedCount = this.getSelectedLinksCount();
        const applyBtn = buttonDiv.createEl('button', {text: `Apply Selected Links (${selectedCount})`, cls: 'mod-cta'});
        applyBtn.addEventListener('click', async () => {
            await this.applySelected();
        });

        // Store button reference to update text
        this.applyBtn = applyBtn;
    }

    /**
     * Update the statistics text
     */
    updateStats(statsEl) {
        const totalLinks = this.results.reduce((sum, r) => sum + r.linkCount, 0);
        const selectedCount = this.getSelectedLinksCount();
        statsEl.textContent = `Found ${totalLinks} link(s) in ${this.results.length} note(s). ${selectedCount} link(s) selected.`;

        // Update button text
        if (this.applyBtn) {
            this.applyBtn.textContent = `Apply Selected Links (${selectedCount})`;
        }
    }

    /**
     * Get total count of selected links across all notes
     */
    getSelectedLinksCount() {
        let total = 0;
        for (const linkSet of this.selectedLinks.values()) {
            total += linkSet.size;
        }
        return total;
    }

    /**
     * Apply only the selected links to their respective notes
     */
    async applySelected() {
        if (this.selectedLinks.size === 0) {
            new Notice('No links selected');
            return;
        }

        this.close();

        const totalSelectedLinks = this.getSelectedLinksCount();
        new Notice(`Creating ${totalSelectedLinks} link(s)...`);

        let totalLinksCreated = 0;
        let notesProcessed = 0;

        // Process each note that has selected links
        for (const [noteIndex, linkIndices] of this.selectedLinks) {
            if (linkIndices.size === 0) continue;

            const result = this.results[noteIndex];
            if (!result || !result.file) continue;

            const file = result.file;

            // Get the selected keywords/targets for this note
            const selectedChanges = result.changes.filter((_, i) => linkIndices.has(i));

            // Create a temporary keyword filter set
            const selectedKeywords = new Set(selectedChanges.map(c => c.keyword.toLowerCase()));

            // Temporarily modify the plugin's keyword map to only include selected keywords
            const originalBuildKeywordMap = this.plugin.buildKeywordMap.bind(this.plugin);

            this.plugin.buildKeywordMap = () => {
                const fullMap = originalBuildKeywordMap();
                const filteredMap = {};

                for (const [key, value] of Object.entries(fullMap)) {
                    if (selectedKeywords.has(key.toLowerCase())) {
                        filteredMap[key] = value;
                    }
                }

                return filteredMap;
            };

            try {
                // Process the file with only the selected keywords
                const processResult = await this.plugin.linkKeywordsInFile(file, false);

                if (processResult && processResult.changed) {
                    totalLinksCreated += processResult.linkCount;
                    notesProcessed++;
                }
            } finally {
                // Restore the original buildKeywordMap function
                this.plugin.buildKeywordMap = originalBuildKeywordMap;
            }
        }

        // Update statistics
        this.plugin.settings.statistics.totalLinksCreated += totalLinksCreated;
        this.plugin.settings.statistics.totalNotesProcessed += notesProcessed;
        this.plugin.settings.statistics.lastRunDate = new Date().toISOString();
        await this.plugin.saveSettings();

        // Show summary
        new Notice(`✓ Processed ${notesProcessed} note(s), created ${totalLinksCreated} link(s)`);
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
        this.searchFilter = ''; // Track current search term
        this.currentTab = 'keywords'; // Track which tab is active: 'keywords', 'groups', 'general', 'import-export'
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

        // Main heading
        const headerDiv = containerEl.createDiv({cls: 'akl-header'});
        headerDiv.createEl('h2', {text: 'Auto Keyword Linker Settings'});

        // Tab navigation
        const tabNav = containerEl.createDiv({cls: 'akl-tab-nav'});

        const tabs = [
            { id: 'keywords', label: 'Keywords', icon: '🔤' },
            { id: 'groups', label: 'Groups', icon: '📁' },
            { id: 'general', label: 'General', icon: '⚙️' },
            { id: 'import-export', label: 'Import/Export', icon: '📦' }
        ];

        tabs.forEach(tab => {
            const tabBtn = tabNav.createEl('button', {
                text: `${tab.icon} ${tab.label}`,
                cls: `akl-tab-button ${this.currentTab === tab.id ? 'akl-tab-active' : ''}`
            });
            tabBtn.addEventListener('click', () => {
                this.currentTab = tab.id;
                this.display(); // Re-render with new tab
            });
        });

        // Tab content container
        const tabContent = containerEl.createDiv({cls: 'akl-tab-content'});

        // Render the appropriate tab content
        switch (this.currentTab) {
            case 'keywords':
                this.displayKeywordsTab(tabContent);
                break;
            case 'groups':
                this.displayGroupsTab(tabContent);
                break;
            case 'general':
                this.displayGeneralTab(tabContent);
                break;
            case 'import-export':
                this.displayImportExportTab(tabContent);
                break;
        }
    }

    /**
     * Display the Keywords tab
     */
    displayKeywordsTab(containerEl) {
        // Stats
        const statsDiv = containerEl.createDiv({cls: 'akl-stats-bar'});
        statsDiv.createEl('span', {
            text: `${this.plugin.settings.keywords.length} keyword${this.plugin.settings.keywords.length !== 1 ? 's' : ''} configured`
        });

        // Keywords section with improved header
        const keywordsHeader = containerEl.createDiv({cls: 'akl-section-header'});
        keywordsHeader.createEl('h3', {text: 'Keywords & Variations'});
        keywordsHeader.createEl('p', {
            text: 'Define keywords and their variations. All variations will link to the target note.',
            cls: 'akl-section-desc'
        });

        // Search box for filtering keywords
        const searchContainer = containerEl.createDiv({cls: 'akl-search-container'});
        const searchInput = searchContainer.createEl('input', {
            type: 'text',
            placeholder: 'Search keywords...',
            cls: 'akl-search-input',
            value: this.searchFilter
        });
        searchInput.addEventListener('input', (e) => {
            this.searchFilter = e.target.value;
            this.renderKeywords(keywordsDiv);
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
            // Use null for inheritable boolean settings so they inherit from group if assigned
            this.plugin.settings.keywords.push({
                id: this.plugin.generateId('kw'),
                keyword: '',
                target: '',
                variations: [],
                enableTags: null,
                linkScope: 'vault-wide',
                scopeFolder: '',
                useRelativeLinks: null,
                blockRef: '',
                requireTag: '',
                onlyInNotesLinkingTo: null,
                suggestMode: null,
                preventSelfLink: null,
                collapsed: false,
                groupId: null
            });
            // Re-render the display to show new entry
            this.display();
        });
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
     * Display the Groups tab
     */
    displayGroupsTab(containerEl) {
        // Stats
        const statsDiv = containerEl.createDiv({cls: 'akl-stats-bar'});
        const totalKeywordsInGroups = this.plugin.settings.keywordGroups.reduce((sum, group) => {
            return sum + this.plugin.settings.keywords.filter(kw => kw.groupId === group.id).length;
        }, 0);
        statsDiv.createEl('span', {
            text: `${this.plugin.settings.keywordGroups.length} group${this.plugin.settings.keywordGroups.length !== 1 ? 's' : ''} • ${totalKeywordsInGroups} keyword${totalKeywordsInGroups !== 1 ? 's' : ''} in groups`
        });

        // Groups section header
        const groupsHeader = containerEl.createDiv({cls: 'akl-section-header'});
        groupsHeader.createEl('h3', {text: 'Keyword Groups'});
        groupsHeader.createEl('p', {
            text: 'Organize keywords into groups with shared settings. Keywords inherit settings from their group.',
            cls: 'akl-section-desc'
        });

        // Container for groups list
        const groupsDiv = containerEl.createDiv({cls: 'akl-groups-container'});

        // Render all groups
        this.renderGroups(groupsDiv);

        // Add button to create new group
        const addBtnContainer = containerEl.createDiv({cls: 'akl-add-button-container'});
        const addBtn = addBtnContainer.createEl('button', {
            text: '+ Create Group',
            cls: 'mod-cta akl-add-button'
        });
        addBtn.addEventListener('click', () => {
            // Add empty group object to settings
            this.plugin.settings.keywordGroups.push({
                id: this.plugin.generateId('grp'),
                name: 'New Group',
                collapsed: false,
                settings: {
                    enableTags: false,
                    linkScope: 'vault-wide',
                    scopeFolder: '',
                    useRelativeLinks: false,
                    blockRef: '',
                    requireTag: '',
                    onlyInNotesLinkingTo: false,
                    suggestMode: false,
                    preventSelfLink: false
                }
            });
            // Re-render the display to show new entry
            this.display();
        });
    }

    /**
     * Display the General tab
     */
    displayGeneralTab(containerEl) {
        // General settings section
        const generalHeader = containerEl.createDiv({cls: 'akl-section-header'});
        generalHeader.createEl('h3', {text: 'Linking Behavior'});
        generalHeader.createEl('p', {
            text: 'Configure how keywords are linked in your notes.',
            cls: 'akl-section-desc'
        });

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

        // Prevent self-link toggle (global)
        new Setting(containerEl)
            .setName('Prevent self-links (global)')
            .setDesc('Prevent keywords from linking on their own target note (applies to all keywords unless overridden per-keyword)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.preventSelfLinkGlobal)
                .onChange(async (value) => {
                    this.plugin.settings.preventSelfLinkGlobal = value;
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

        // Note Creation section
        const noteCreationHeader = containerEl.createDiv({cls: 'akl-section-header'});
        noteCreationHeader.createEl('h3', {text: 'Note Creation'});
        noteCreationHeader.createEl('p', {
            text: 'Configure how new notes are created when target notes don\'t exist.',
            cls: 'akl-section-desc'
        });

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
        const folders = this.getAllFolders();
        const allFolders = ['', ...folders];

        new Setting(containerEl)
            .setName('New note folder')
            .setDesc('Click to search and select folder where new notes will be created')
            .addText(text => {
                // Display current folder or root
                const displayValue = this.plugin.settings.newNoteFolder || '/ (Root)';
                text.setValue(displayValue)
                    .setPlaceholder('Click to select folder...');

                // Make it read-only (user can't type directly)
                text.inputEl.readOnly = true;
                text.inputEl.style.cursor = 'pointer';

                // Open fuzzy search modal on click
                text.inputEl.addEventListener('click', () => {
                    const modal = new FolderSuggestModal(
                        this.app,
                        allFolders,
                        this.plugin.settings.newNoteFolder || '',
                        async (selectedFolder) => {
                            // Update setting
                            this.plugin.settings.newNoteFolder = selectedFolder;
                            await this.plugin.saveSettings();

                            // Update display
                            const newDisplayValue = selectedFolder || '/ (Root)';
                            text.setValue(newDisplayValue);
                        }
                    );
                    modal.open();
                });
            });

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

        // Keyword Suggestion Settings section
        const suggestionHeader = containerEl.createDiv({cls: 'akl-section-header'});
        suggestionHeader.createEl('h3', {text: 'Keyword Suggestion Settings'});
        suggestionHeader.createEl('p', {
            text: 'Configure how the keyword suggestion feature works.',
            cls: 'akl-section-desc'
        });

        // Custom stop words setting
        new Setting(containerEl)
            .setName('Custom stop words')
            .setDesc('Additional words to exclude from keyword suggestions (comma-separated). These are added to the default stop word list.')
            .addTextArea(text => {
                text.setPlaceholder('example, test, demo, sample')
                    .setValue((this.plugin.settings.customStopWords || []).join(', '))
                    .onChange(async (value) => {
                        // Parse comma-separated values and trim whitespace
                        const words = value.split(',')
                            .map(w => w.trim())
                            .filter(w => w.length > 0);
                        this.plugin.settings.customStopWords = words;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.rows = 4;
                text.inputEl.cols = 50;
            });

        // Button to reset custom stop words
        new Setting(containerEl)
            .setName('Reset custom stop words')
            .setDesc('Clear all custom stop words')
            .addButton(button => button
                .setButtonText('Reset')
                .onClick(async () => {
                    this.plugin.settings.customStopWords = [];
                    await this.plugin.saveSettings();
                    new Notice('Custom stop words cleared');
                    this.display(); // Refresh the display
                }));
    }

    /**
     * Display the Import/Export tab
     */
    displayImportExportTab(containerEl) {
        // Import/Export section header
        const header = containerEl.createDiv({cls: 'akl-section-header'});
        header.createEl('h3', {text: 'Import & Export Keywords'});
        header.createEl('p', {
            text: 'Export your keywords to CSV or import keywords from a CSV file.',
            cls: 'akl-section-desc'
        });

        // Export section
        new Setting(containerEl)
            .setName('Export keywords to CSV')
            .setDesc('Export all keywords and their settings to a CSV file')
            .addButton(button => button
                .setButtonText('Export to CSV')
                .setCta()
                .onClick(() => this.plugin.exportKeywordsToCSV()));

        // Import section
        new Setting(containerEl)
            .setName('Import keywords from CSV')
            .setDesc('Import keywords from a CSV file (opens file picker)')
            .addButton(button => button
                .setButtonText('Import from CSV')
                .onClick(() => this.plugin.importKeywordsFromCSV()));

        // Statistics section
        const statsHeader = containerEl.createDiv({cls: 'akl-section-header'});
        statsHeader.createEl('h3', {text: 'Statistics'});
        statsHeader.createEl('p', {
            text: 'View usage statistics for the plugin.',
            cls: 'akl-section-desc'
        });

        // View statistics button
        new Setting(containerEl)
            .setName('View statistics')
            .setDesc('See how many links have been created and which notes have been processed')
            .addButton(button => button
                .setButtonText('View Statistics')
                .onClick(() => this.plugin.showStatistics()));
    }

    /**
     * Render the list of keywords with their settings
     * @param {HTMLElement} container - Container element to render into
     */
    renderKeywords(container) {
        container.empty();  // Clear existing content

        // Filter keywords based on search term
        const searchTerm = this.searchFilter.toLowerCase();
        let visibleCount = 0;

        // Iterate through all keyword entries
        for (let i = 0; i < this.plugin.settings.keywords.length; i++) {
            const item = this.plugin.settings.keywords[i];

            // Filter logic: search in keyword, target, and variations
            if (searchTerm) {
                const matchesKeyword = item.keyword && item.keyword.toLowerCase().includes(searchTerm);
                const matchesTarget = item.target && item.target.toLowerCase().includes(searchTerm);
                const matchesVariations = item.variations && item.variations.some(v =>
                    v.toLowerCase().includes(searchTerm)
                );

                // Skip this keyword if it doesn't match the search
                if (!matchesKeyword && !matchesTarget && !matchesVariations) {
                    continue;
                }
            }

            visibleCount++;

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

            // Show group badge if keyword is in a group
            if (item.groupId) {
                const group = this.plugin.settings.keywordGroups.find(g => g.id === item.groupId);
                if (group) {
                    cardBadges.createSpan({text: `📁 ${group.name}`, cls: 'akl-badge akl-badge-group'});
                }
            }

            // Get effective settings for badge display
            const effectiveSettings = this.plugin.getEffectiveKeywordSettings(item);

            if (effectiveSettings.enableTags) {
                cardBadges.createSpan({text: 'Tags', cls: 'akl-badge akl-badge-tags'});
            }
            if (effectiveSettings.useRelativeLinks) {
                cardBadges.createSpan({text: 'MD Links', cls: 'akl-badge akl-badge-md-links'});
            }
            if (effectiveSettings.suggestMode) {
                cardBadges.createSpan({text: 'Suggest', cls: 'akl-badge akl-badge-suggest'});
            }

            // Get auto-discovered aliases for counting (will be reused later)
            const autoAliasesForItem = this.plugin.getAliasesForNote(item.target);

            // Count both manual variations and auto-discovered aliases
            const manualCount = (item.variations && item.variations.length) || 0;
            const autoCount = (autoAliasesForItem && autoAliasesForItem.length) || 0;
            const totalVariations = manualCount + autoCount;

            if (totalVariations > 0) {
                cardBadges.createSpan({
                    text: `${totalVariations} var`,
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

            // Target note input field with fuzzy search modal
            new Setting(cardBody)
                .setName('Target note')
                .setDesc('Click to search and select the note to create links to')
                .addText(text => {
                    // Get all markdown files for the fuzzy search
                    const files = this.app.vault.getMarkdownFiles();
                    const noteNames = new Set(); // Use Set to avoid duplicates

                    for (let file of files) {
                        // Add basename (note name without extension)
                        noteNames.add(file.basename);

                        // If note is in a subfolder, also add the full path without extension
                        if (file.path.includes('/')) {
                            const pathWithoutExt = file.path.endsWith('.md') ? file.path.slice(0, -3) : file.path;
                            noteNames.add(pathWithoutExt);
                        }
                    }

                    // Sort alphabetically
                    const allNotes = Array.from(noteNames).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

                    // Display current target
                    const displayValue = item.target || 'Click to select...';
                    text.setValue(displayValue)
                        .setPlaceholder('Click to select note...');

                    // Make it read-only (user can't type directly)
                    text.inputEl.readOnly = true;
                    text.inputEl.style.cursor = 'pointer';

                    // Open fuzzy search modal on click
                    text.inputEl.addEventListener('click', () => {
                        const modal = new NoteSuggestModal(
                            this.app,
                            allNotes,
                            item.target || '',
                            async (selectedNote) => {
                                // Update setting
                                this.plugin.settings.keywords[i].target = selectedNote;
                                await this.plugin.saveSettings();

                                // Update display
                                text.setValue(selectedNote);

                                // Update card header title without full re-render
                                this.updateCardHeader(cardTitle, this.plugin.settings.keywords[i].keyword, selectedNote);
                            }
                        );
                        modal.open();
                    });
                });

            // Block reference input field
            new Setting(cardBody)
                .setName('Block reference')
                .setDesc('Optional: Link to a specific block (e.g., ^block-id for abbreviation definitions)')
                .addText(text => {
                    text.setValue(item.blockRef || '')
                        .setPlaceholder('^block-id')
                        .onChange(async (value) => {
                            // Sanitize: remove any wikilinks that might have been autocompleted
                            // Extract just the block reference ID from strings like "^[[Note|text]]-def"
                            let sanitized = value;

                            // Remove wikilinks: [[Note|text]] or [[Note]]
                            sanitized = sanitized.replace(/\[\[.*?\]\]/g, '');

                            // Ensure it starts with ^ if user provided content
                            if (sanitized && !sanitized.startsWith('^')) {
                                sanitized = '^' + sanitized;
                            }

                            // Remove any spaces
                            sanitized = sanitized.replace(/\s/g, '');

                            this.plugin.settings.keywords[i].blockRef = sanitized;
                            await this.plugin.saveSettings();

                            // Update the input field to show sanitized value
                            if (sanitized !== value) {
                                text.setValue(sanitized);
                            }
                        });

                    // Disable Obsidian's autocomplete on this field
                    text.inputEl.setAttribute('autocomplete', 'off');
                    text.inputEl.setAttribute('data-no-suggest', 'true');
                });

            // Require tag input field
            new Setting(cardBody)
                .setName('Require tag')
                .setDesc('Optional: Only link to target note if it has this tag (e.g., #reviewed or reviewed)')
                .addText(text => {
                    text.setValue(item.requireTag || '')
                        .setPlaceholder('#tag or tag')
                        .onChange(async (value) => {
                            // Normalize: ensure consistent format (remove # if present, we'll add it back for checking)
                            let normalized = value.trim();

                            // Remove leading # if present for storage (we'll handle both formats when checking)
                            if (normalized.startsWith('#')) {
                                normalized = normalized.substring(1);
                            }

                            this.plugin.settings.keywords[i].requireTag = normalized;
                            await this.plugin.saveSettings();
                        });

                    text.inputEl.setAttribute('autocomplete', 'off');
                });

            // Only link in notes already linking to target toggle
            new Setting(cardBody)
                .setName('Only link in notes already linking to target')
                .setDesc('Only create keyword links in notes that already have at least one link to the target note')
                .addToggle(toggle => {
                    const effectiveSettings = this.plugin.getEffectiveKeywordSettings(item);
                    toggle.setValue(effectiveSettings.onlyInNotesLinkingTo || false)
                        .onChange(async (value) => {
                            this.plugin.settings.keywords[i].onlyInNotesLinkingTo = value;
                            await this.plugin.saveSettings();
                        });
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

            // Reuse the auto-discovered aliases from earlier (already fetched for badge count)
            // const autoAliases = this.plugin.getAliasesForNote(item.target); // REMOVED - reusing autoAliasesForItem

            // Chips display area
            const chipsContainer = variationsContainer.createDiv({cls: 'akl-chips-container'});

            // Check if we have any variations or aliases to show
            const hasManualVariations = item.variations && item.variations.length > 0;
            const hasAutoAliases = autoAliasesForItem && autoAliasesForItem.length > 0;

            if (!hasManualVariations && !hasAutoAliases) {
                chipsContainer.createSpan({
                    text: 'No variations added yet',
                    cls: 'akl-no-variations'
                });
            } else {
                // Render manual variations
                this.renderVariationChips(chipsContainer, item.variations || [], i);

                // Render auto-discovered aliases (with different style)
                if (hasAutoAliases) {
                    this.renderAliasChips(chipsContainer, autoAliasesForItem);
                }
            }

            // Input for adding new variations
            const addVariationContainer = variationsContainer.createDiv({cls: 'akl-add-variation'});
            const variationInput = addVariationContainer.createEl('input', {
                type: 'text',
                placeholder: 'Type and press Enter to add...',
                cls: 'akl-variation-input'
            });

            variationInput.addEventListener('keydown', async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const newVariation = variationInput.value.trim();

                    if (!newVariation) {
                        return; // Empty input, do nothing
                    }

                    if (!item.variations) {
                        item.variations = [];
                    }

                    // Check for duplicates (case-insensitive)
                    const isDuplicate = item.variations.some(v => v.toLowerCase() === newVariation.toLowerCase());

                    if (isDuplicate) {
                        new Notice('Variation already exists');
                        variationInput.value = '';
                        return;
                    }

                    // Clear input immediately (before async operations)
                    variationInput.value = '';

                    // Add variation and save
                    item.variations.push(newVariation);
                    await this.plugin.saveSettings();

                    // Clear chips container before re-rendering
                    chipsContainer.empty();

                    // Re-render all chips (manual variations + auto aliases)
                    const hasManualVariations = item.variations && item.variations.length > 0;
                    const hasAutoAliases = autoAliasesForItem && autoAliasesForItem.length > 0;

                    if (!hasManualVariations && !hasAutoAliases) {
                        chipsContainer.createSpan({
                            text: 'No variations added yet',
                            cls: 'akl-no-variations'
                        });
                    } else {
                        // Render manual variations
                        this.renderVariationChips(chipsContainer, item.variations || [], i);

                        // Render auto-discovered aliases (with different style)
                        if (hasAutoAliases) {
                            this.renderAliasChips(chipsContainer, autoAliasesForItem);
                        }
                    }

                    // Restore focus to input
                    variationInput.focus();
                }
            });

            // Enable tags toggle
            new Setting(cardBody)
                .setName('Enable tags')
                .setDesc('Automatically add tags to source and target notes')
                .addToggle(toggle => {
                    const effectiveSettings = this.plugin.getEffectiveKeywordSettings(item);
                    toggle.setValue(effectiveSettings.enableTags || false)
                        .onChange(async (value) => {
                            this.plugin.settings.keywords[i].enableTags = value;
                            await this.plugin.saveSettings();
                            this.display();
                        });
                });

            // Use relative markdown links toggle
            new Setting(cardBody)
                .setName('Use relative markdown links')
                .setDesc('Create markdown links [text](note.md) instead of wikilinks [[note]]')
                .addToggle(toggle => {
                    const effectiveSettings = this.plugin.getEffectiveKeywordSettings(item);
                    toggle.setValue(effectiveSettings.useRelativeLinks || false)
                        .onChange(async (value) => {
                            this.plugin.settings.keywords[i].useRelativeLinks = value;
                            await this.plugin.saveSettings();
                        });
                });

            // Suggest mode toggle
            new Setting(cardBody)
                .setName('Suggest instead of auto-link')
                .setDesc('Highlight keywords as suggestions instead of automatically creating links. Right-click to accept.')
                .addToggle(toggle => {
                    // Show effective value (from group if null)
                    const effectiveSettings = this.plugin.getEffectiveKeywordSettings(item);
                    toggle.setValue(effectiveSettings.suggestMode || false)
                        .onChange(async (value) => {
                            this.plugin.settings.keywords[i].suggestMode = value;
                            await this.plugin.saveSettings();
                            this.display(); // Re-render to update badge
                        });
                });

            // Group assignment dropdown
            new Setting(cardBody)
                .setName('Keyword Group')
                .setDesc('Assign to a group to inherit group settings. Individual settings can override group defaults.')
                .addDropdown(dropdown => {
                    // Add "None" option
                    dropdown.addOption('', '(No group)');

                    // Add all groups as options
                    this.plugin.settings.keywordGroups.forEach(group => {
                        dropdown.addOption(group.id, group.name);
                    });

                    dropdown.setValue(item.groupId || '')
                        .onChange(async (value) => {
                            this.plugin.settings.keywords[i].groupId = value || null;
                            await this.plugin.saveSettings();
                            this.display(); // Re-render to update badge
                        });
                });

            // Prevent self-link toggle (per-keyword)
            new Setting(cardBody)
                .setName('Prevent self-link')
                .setDesc('Prevent this keyword from linking on its own target note (overrides global setting)')
                .addToggle(toggle => {
                    const effectiveSettings = this.plugin.getEffectiveKeywordSettings(item);
                    toggle.setValue(effectiveSettings.preventSelfLink || false)
                        .onChange(async (value) => {
                            this.plugin.settings.keywords[i].preventSelfLink = value;
                            await this.plugin.saveSettings();
                        });
                });

            // Link Scope dropdown
            new Setting(cardBody)
                .setName('Link scope')
                .setDesc('Control where this keyword will be linked')
                .addDropdown(dropdown => dropdown
                    .addOption('vault-wide', 'Vault-wide (everywhere)')
                    .addOption('same-folder', 'Same folder only')
                    .addOption('source-folder', 'Source in specific folder')
                    .addOption('target-folder', 'Target in specific folder')
                    .setValue(item.linkScope || 'vault-wide')
                    .onChange(async (value) => {
                        this.plugin.settings.keywords[i].linkScope = value;
                        await this.plugin.saveSettings();
                        this.display(); // Re-render to show/hide folder input
                    }));

            // Folder selector (only shown for source-folder or target-folder scopes)
            if (item.linkScope === 'source-folder' || item.linkScope === 'target-folder') {
                // Get all unique folders in the vault
                const folders = this.getAllFolders();

                // Add empty string for root option
                const allFolders = ['', ...folders];

                new Setting(cardBody)
                    .setName('Folder')
                    .setDesc('Click to search and select a folder')
                    .addText(text => {
                        // Display current folder or root
                        const displayValue = item.scopeFolder || '/ (Root)';
                        text.setValue(displayValue)
                            .setPlaceholder('Click to select folder...');

                        // Make it read-only (user can't type directly)
                        text.inputEl.readOnly = true;
                        text.inputEl.style.cursor = 'pointer';

                        // Open fuzzy search modal on click
                        text.inputEl.addEventListener('click', () => {
                            const modal = new FolderSuggestModal(
                                this.app,
                                allFolders,
                                item.scopeFolder || '',
                                async (selectedFolder) => {
                                    // Update setting
                                    this.plugin.settings.keywords[i].scopeFolder = selectedFolder;
                                    await this.plugin.saveSettings();

                                    // Update display
                                    const newDisplayValue = selectedFolder || '/ (Root)';
                                    text.setValue(newDisplayValue);
                                }
                            );
                            modal.open();
                        });
                    });
            }

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

        // Show message if no keywords match the search
        if (visibleCount === 0 && searchTerm) {
            const noResults = container.createDiv({cls: 'akl-no-results'});
            noResults.createEl('p', {text: 'No keywords found'});
            noResults.createEl('p', {
                text: `No keywords match "${this.searchFilter}"`,
                cls: 'akl-no-results-hint'
            });
        }
    }

    /**
     * Render the list of groups with their settings
     * @param {HTMLElement} container - Container element to render into
     */
    renderGroups(container) {
        container.empty();  // Clear existing content

        // If no groups exist yet, show empty state
        if (this.plugin.settings.keywordGroups.length === 0) {
            const emptyState = container.createDiv({cls: 'akl-empty-state'});
            emptyState.createEl('p', {text: 'No groups yet'});
            emptyState.createEl('p', {
                text: 'Create a group to organize your keywords with shared settings',
                cls: 'akl-empty-hint'
            });
            return;
        }

        // Iterate through all group entries
        for (let i = 0; i < this.plugin.settings.keywordGroups.length; i++) {
            const group = this.plugin.settings.keywordGroups[i];

            // Initialize collapsed state if not set
            if (group.collapsed === undefined) {
                group.collapsed = false;
            }

            // Get keywords in this group
            const keywordsInGroup = this.plugin.settings.keywords.filter(kw => kw.groupId === group.id);

            // Create card container for this group entry
            const cardDiv = container.createDiv({cls: 'akl-keyword-card akl-group-card'});

            // Card header with collapse toggle
            const cardHeader = cardDiv.createDiv({cls: 'akl-card-header'});

            // Collapse toggle button
            const collapseBtn = cardHeader.createDiv({cls: 'akl-collapse-btn'});
            collapseBtn.innerHTML = group.collapsed ? '▶' : '▼';
            collapseBtn.setAttribute('aria-label', group.collapsed ? 'Expand' : 'Collapse');
            collapseBtn.addEventListener('click', async () => {
                group.collapsed = !group.collapsed;
                await this.plugin.saveSettings();
                this.display();
            });

            // Card title area
            const cardTitle = cardHeader.createDiv({cls: 'akl-card-title'});
            cardTitle.createSpan({text: group.name, cls: 'akl-keyword-name'});
            cardTitle.createSpan({text: ` (${keywordsInGroup.length} keywords)`, cls: 'akl-target-name'});

            // Delete button
            const deleteBtn = cardHeader.createEl('button', {
                text: '🗑️ Delete',
                cls: 'akl-delete-btn'
            });
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                // Remove group ID from all keywords in this group
                this.plugin.settings.keywords.forEach(kw => {
                    if (kw.groupId === group.id) {
                        kw.groupId = null;
                    }
                });
                // Remove the group
                this.plugin.settings.keywordGroups.splice(i, 1);
                await this.plugin.saveSettings();
                this.display();
            });

            // Card body (collapsible)
            const cardBody = cardDiv.createDiv({cls: 'akl-card-body'});
            if (group.collapsed) {
                cardBody.style.display = 'none';
            }

            // Group name input field
            new Setting(cardBody)
                .setName('Group name')
                .setDesc('Name for this group of keywords')
                .addText(text => {
                    text.setValue(group.name)
                        .setPlaceholder('Enter group name...')
                        .onChange(async (value) => {
                            this.plugin.settings.keywordGroups[i].name = value;
                            await this.plugin.saveSettings();
                            // Update card header title
                            cardTitle.empty();
                            cardTitle.createSpan({text: value, cls: 'akl-keyword-name'});
                            cardTitle.createSpan({text: ` (${keywordsInGroup.length} keywords)`, cls: 'akl-target-name'});
                        });
                    text.inputEl.addClass('akl-input');
                });

            // Keywords in group section
            const keywordsSection = cardBody.createDiv({cls: 'akl-group-keywords-section'});
            keywordsSection.createEl('h4', {text: 'Keywords in this group', cls: 'akl-subsection-header'});

            if (keywordsInGroup.length === 0) {
                keywordsSection.createEl('p', {
                    text: 'No keywords in this group yet. Add keywords below or assign them from the Keywords tab.',
                    cls: 'akl-hint-text'
                });
            } else {
                const keywordsList = keywordsSection.createDiv({cls: 'akl-keywords-list'});
                keywordsInGroup.forEach(kw => {
                    const kwChip = keywordsList.createDiv({cls: 'akl-keyword-chip'});
                    kwChip.createSpan({text: kw.keyword || 'Untitled'});
                    const removeBtn = kwChip.createSpan({text: '×', cls: 'akl-chip-remove'});
                    removeBtn.addEventListener('click', async () => {
                        kw.groupId = null;
                        await this.plugin.saveSettings();
                        this.display();
                    });
                });
            }

            // Add keywords button
            const addKeywordsBtn = keywordsSection.createEl('button', {
                text: '+ Add Keywords to Group',
                cls: 'akl-button-secondary'
            });
            addKeywordsBtn.addEventListener('click', () => {
                // Open fuzzy search modal to select keywords
                // Fetch current keywords in group dynamically to avoid stale data
                const currentKeywordsInGroup = this.plugin.settings.keywords.filter(kw => kw.groupId === group.id);
                new KeywordGroupAssignModal(this.app, this.plugin, group.id, currentKeywordsInGroup).open();
            });

            // Group settings section
            const settingsSection = cardBody.createDiv({cls: 'akl-group-settings-section'});
            settingsSection.createEl('h4', {text: 'Group Settings', cls: 'akl-subsection-header'});
            settingsSection.createEl('p', {
                text: 'These settings apply to all keywords in this group (unless overridden per-keyword).',
                cls: 'akl-hint-text'
            });

            // Link scope dropdown
            new Setting(settingsSection)
                .setName('Link scope')
                .setDesc('Where this group\'s keywords should create links')
                .addDropdown(dropdown => dropdown
                    .addOption('vault-wide', 'Vault-wide (link in all notes)')
                    .addOption('source-folder', 'Source folder only')
                    .addOption('target-folder', 'Target folder only')
                    .setValue(group.settings.linkScope || 'vault-wide')
                    .onChange(async (value) => {
                        group.settings.linkScope = value;
                        await this.plugin.saveSettings();
                    }));

            // Enable tags toggle
            new Setting(settingsSection)
                .setName('Enable tags')
                .setDesc('Add #tag to target notes when linking')
                .addToggle(toggle => toggle
                    .setValue(group.settings.enableTags || false)
                    .onChange(async (value) => {
                        group.settings.enableTags = value;
                        await this.plugin.saveSettings();
                    }));

            // Suggest mode toggle
            new Setting(settingsSection)
                .setName('Suggest mode')
                .setDesc('Suggest links instead of creating them automatically')
                .addToggle(toggle => toggle
                    .setValue(group.settings.suggestMode || false)
                    .onChange(async (value) => {
                        group.settings.suggestMode = value;
                        await this.plugin.saveSettings();
                    }));

            // Use relative links toggle
            new Setting(settingsSection)
                .setName('Use Markdown links')
                .setDesc('Use [text](link.md) format instead of [[wikilinks]]')
                .addToggle(toggle => toggle
                    .setValue(group.settings.useRelativeLinks || false)
                    .onChange(async (value) => {
                        group.settings.useRelativeLinks = value;
                        await this.plugin.saveSettings();
                    }));

            // Prevent self-link toggle
            new Setting(settingsSection)
                .setName('Prevent self-links')
                .setDesc('Don\'t link keywords on their own target note')
                .addToggle(toggle => toggle
                    .setValue(group.settings.preventSelfLink || false)
                    .onChange(async (value) => {
                        group.settings.preventSelfLink = value;
                        await this.plugin.saveSettings();
                    }));
        }
    }

    /**
     * Render variation chips with remove buttons
     * @param {HTMLElement} container - Container for chips
     * @param {Array} variations - Array of variation strings
     * @param {number} keywordIndex - Index of the keyword in settings
     */
    renderVariationChips(container, variations, keywordIndex) {
        // Don't empty container - we'll add both manual and auto chips

        if (variations.length === 0) {
            // Only show "no variations" if there are also no aliases coming
            // This check will be done by the caller
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
     * Render auto-discovered alias chips (from note frontmatter)
     * These are shown with a different style and cannot be removed (auto-discovered)
     * @param {HTMLElement} container - Container element
     * @param {Array<string>} aliases - Array of auto-discovered aliases
     */
    renderAliasChips(container, aliases) {
        if (!aliases || aliases.length === 0) {
            return;
        }

        aliases.forEach(alias => {
            const chip = container.createDiv({cls: 'akl-chip akl-chip-auto'});
            chip.createSpan({text: alias, cls: 'akl-chip-text'});

            // Add a small indicator that this is auto-discovered
            const autoIndicator = chip.createSpan({text: '🔗', cls: 'akl-chip-auto-indicator'});
            autoIndicator.setAttribute('aria-label', 'Auto-discovered from note alias');
            autoIndicator.setAttribute('title', 'Auto-discovered from note frontmatter');
        });
    }

    /**
     * Get all unique folders in the vault
     * @returns {Array<string>} Sorted array of folder paths
     */
    getAllFolders() {
        const folders = new Set();

        // Get all folders from the vault
        const allFolders = this.app.vault.getAllLoadedFiles()
            .filter(f => f.children) // Only folders have children
            .map(f => f.path);

        allFolders.forEach(folder => {
            if (folder && folder !== '/') {
                folders.add(folder);
            }
        });

        // Sort alphabetically
        return Array.from(folders).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
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

            /* Tab Navigation */
            .akl-tab-nav {
                display: flex;
                gap: 0.5em;
                margin-bottom: 1.5em;
                border-bottom: 2px solid var(--background-modifier-border);
                padding-bottom: 0;
            }

            .akl-tab-button {
                padding: 0.75em 1.25em;
                background: transparent;
                border: none;
                border-bottom: 2px solid transparent;
                color: var(--text-muted);
                cursor: pointer;
                font-size: 0.95em;
                font-weight: 500;
                transition: all 0.2s ease;
                margin-bottom: -2px;
            }

            .akl-tab-button:hover {
                color: var(--text-normal);
                background: var(--background-modifier-hover);
            }

            .akl-tab-active {
                color: var(--interactive-accent) !important;
                border-bottom-color: var(--interactive-accent) !important;
            }

            /* Responsive: Wrap tabs on portrait phones */
            @media (max-width: 600px) and (orientation: portrait) {
                .akl-tab-nav {
                    flex-wrap: wrap;
                }

                .akl-tab-button {
                    padding: 0.6em 1em;
                    font-size: 0.9em;
                    flex: 0 1 auto;
                }
            }

            .akl-tab-content {
                animation: fadeIn 0.2s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .akl-stats-bar {
                color: var(--text-muted);
                font-size: 0.9em;
                padding: 0.75em 1em;
                background: var(--background-secondary);
                border-radius: 8px;
                margin-bottom: 1.5em;
            }

            /* Section Headers */
            .akl-section-header {
                margin-top: 2em;
                margin-bottom: 1em;
            }

            .akl-subsection-header {
                margin-top: 1.5em;
                margin-bottom: 0.75em;
                font-size: 1em;
                font-weight: 600;
            }

            /* Empty State */
            .akl-empty-state {
                text-align: center;
                padding: 3em 2em;
                color: var(--text-muted);
            }

            .akl-empty-state p:first-child {
                font-size: 1.1em;
                font-weight: 500;
                margin-bottom: 0.5em;
                color: var(--text-normal);
            }

            .akl-empty-hint {
                font-size: 0.9em;
            }

            .akl-hint-text {
                color: var(--text-muted);
                font-size: 0.9em;
                margin: 0.5em 0;
            }

            /* Group-specific styles */
            .akl-group-card {
                border-left: 3px solid var(--interactive-accent);
            }

            .akl-groups-container {
                display: grid;
                gap: 1em;
                margin-bottom: 1em;
            }

            .akl-group-keywords-section,
            .akl-group-settings-section {
                margin-top: 1.5em;
                padding-top: 1.5em;
                border-top: 1px solid var(--background-modifier-border);
            }

            .akl-keywords-list {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5em;
                margin: 1em 0;
            }

            .akl-keyword-chip {
                display: inline-flex;
                align-items: center;
                gap: 0.5em;
                padding: 0.4em 0.8em;
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 12px;
                font-size: 0.9em;
                transition: all 0.2s ease;
            }

            .akl-keyword-chip:hover {
                background: var(--background-modifier-hover);
            }

            .akl-chip-remove {
                cursor: pointer;
                color: var(--text-muted);
                font-size: 1.2em;
                line-height: 1;
                transition: color 0.2s ease;
            }

            .akl-chip-remove:hover {
                color: var(--text-error);
            }

            .akl-button-secondary {
                padding: 0.6em 1.2em;
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                color: var(--text-normal);
                cursor: pointer;
                font-size: 0.9em;
                transition: all 0.2s ease;
            }

            .akl-button-secondary:hover {
                background: var(--background-modifier-hover);
                border-color: var(--interactive-accent);
            }

            .akl-delete-btn {
                padding: 0.5em 1em;
                background: transparent;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                color: var(--text-muted);
                cursor: pointer;
                font-size: 0.85em;
                transition: all 0.2s ease;
            }

            .akl-delete-btn:hover {
                background: var(--background-modifier-error);
                border-color: var(--text-error);
                color: var(--text-on-accent);
            }

            .akl-section-header h3 {
                margin-bottom: 0.25em;
            }

            .akl-section-desc {
                color: var(--text-muted);
                margin-top: 0;
            }

            /* Search Container */
            .akl-search-container {
                margin-bottom: 1em;
            }

            .akl-search-input {
                width: 100%;
                padding: 0.6em 1em;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                background: var(--background-primary);
                color: var(--text-normal);
                font-size: 0.95em;
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
            }

            .akl-search-input:focus {
                outline: none;
                border-color: var(--interactive-accent);
                box-shadow: 0 0 0 2px var(--interactive-accent-hover);
            }

            .akl-search-input::placeholder {
                color: var(--text-muted);
            }

            /* No Results Message */
            .akl-no-results {
                text-align: center;
                padding: 3em 2em;
                color: var(--text-muted);
            }

            .akl-no-results p:first-child {
                font-size: 1.1em;
                font-weight: 500;
                margin-bottom: 0.5em;
                color: var(--text-normal);
            }

            .akl-no-results-hint {
                font-size: 0.9em;
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

            .akl-badge-md-links {
                background: var(--interactive-accent);
                color: white;
            }

            .akl-badge-suggest {
                background: #ffaa00;
                color: white;
            }

            .akl-badge-group {
                background: var(--interactive-accent);
                color: white;
            }

            .akl-badge-variations {
                background: var(--background-modifier-border);
                color: var(--text-muted);
            }

            /* Suggested Link Styles */
            .akl-suggested-link {
                background-color: rgba(255, 170, 0, 0.15);
                border-bottom: 2px dotted #ffaa00;
                cursor: pointer;
                position: relative;
                transition: background-color 0.2s ease;
            }

            .akl-suggested-link:hover {
                background-color: rgba(255, 170, 0, 0.25);
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

            /* Auto-discovered alias chips - different style */
            .akl-chip-auto {
                background: var(--interactive-accent-hover);
                border: 1px solid var(--interactive-accent);
                opacity: 0.85;
            }

            .akl-chip-auto:hover {
                opacity: 1;
                background: var(--interactive-accent-hover);
            }

            .akl-chip-auto-indicator {
                font-size: 0.9em;
                opacity: 0.7;
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

            .akl-controls-container {
                display: flex;
                gap: 1em;
                margin-bottom: 1em;
                flex-wrap: wrap;
            }

            .akl-sort-container {
                display: flex;
                align-items: center;
                gap: 0.5em;
            }

            .akl-sort-label {
                color: var(--text-muted);
                font-size: 0.9em;
                white-space: nowrap;
            }

            .akl-sort-select {
                padding: 0.5em 0.8em;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background: var(--background-primary);
                color: var(--text-normal);
                font-size: 0.9em;
                cursor: pointer;
            }

            .akl-sort-select:focus {
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
/**
 * Keyword Group Assign Modal - Fuzzy search to assign keywords to a group
 */
class KeywordGroupAssignModal extends FuzzySuggestModal {
    constructor(app, plugin, groupId, currentKeywords) {
        super(app);
        this.plugin = plugin;
        this.groupId = groupId;
        this.currentKeywordIds = new Set(currentKeywords.map(kw => kw.id));
    }

    getItems() {
        // Get all keywords that are not already in this group
        return this.plugin.settings.keywords.filter(kw => !this.currentKeywordIds.has(kw.id));
    }

    getItemText(keyword) {
        const groupInfo = keyword.groupId ? ' [In another group]' : '';
        return `${keyword.keyword || 'Untitled'} → ${keyword.target || '(no target)'}${groupInfo}`;
    }

    onChooseItem(keyword) {
        // Assign keyword to this group
        keyword.groupId = this.groupId;
        this.plugin.saveSettings();
        // Refresh the settings display
        const settingTab = this.app.setting.activeTab;
        if (settingTab instanceof AutoKeywordLinkerSettingTab) {
            settingTab.display();
        }
    }
}

/**
 * Folder Suggest Modal - Searchable folder picker with fuzzy matching
 */
class FolderSuggestModal extends FuzzySuggestModal {
    constructor(app, folders, currentValue, onChoose) {
        super(app);
        this.folders = folders;
        this.currentValue = currentValue;
        this.onChooseCallback = onChoose;
    }

    getItems() {
        return this.folders;
    }

    getItemText(folder) {
        return folder || '/ (Root)';
    }

    onChooseItem(folder, evt) {
        this.onChooseCallback(folder);
    }
}

/**
 * Note Suggest Modal - Searchable note picker with fuzzy matching
 */
class NoteSuggestModal extends FuzzySuggestModal {
    constructor(app, notes, currentValue, onChoose) {
        super(app);
        this.notes = notes;
        this.currentValue = currentValue;
        this.onChooseCallback = onChoose;
    }

    getItems() {
        return this.notes;
    }

    getItemText(note) {
        return note;
    }

    onChooseItem(note, evt) {
        this.onChooseCallback(note);
    }
}
