// Import required Obsidian API components
const { Plugin, PluginSettingTab, Setting, Notice, Modal } = require('obsidian');

// Default settings that will be used when the plugin is first installed
const DEFAULT_SETTINGS = {
    // Array of keyword objects, each containing the keyword, target note, and variations
    keywords: [
        { keyword: 'Keyword1', target: 'Keyword1', variations: [] },
        { keyword: 'Keyword2', target: 'Keyword2', variations: [] }
    ],
    autoLinkOnSave: false,          // Whether to automatically link keywords when saving a note
    caseSensitive: false,            // Whether keyword matching should be case-sensitive
    firstOccurrenceOnly: true,       // Whether to link only the first occurrence of each keyword
    autoCreateNotes: true,           // Whether to automatically create notes that don't exist
    newNoteFolder: '',               // Folder where new notes will be created (empty = root)
    newNoteTemplate: '# {{keyword}}\n\nCreated: {{date}}\n\n'  // Template for new notes
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

        // Add the settings tab to Obsidian's settings panel
        this.addSettingTab(new AutoKeywordLinkerSettingTab(this.app, this));

        // If auto-link on save is enabled, set up the event listener
        if (this.settings.autoLinkOnSave) {
            this.setupAutoLinkOnSave();
        }
    }

    /**
     * Setup auto-link on save event listener
     */
    setupAutoLinkOnSave() {
        this.registerEvent(
            // Listen for file modification events
            this.app.vault.on('modify', (file) => {
                // CRITICAL: Only process markdown files, skip all attachments
                if (file.extension === 'md') {
                    // Link keywords without preview mode
                    this.linkKeywordsInFile(file, false);
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
     * @returns {Object|null} Results object with change information, or null if no changes
     */
    async linkKeywordsInFile(file, preview = false) {
        // SAFETY CHECK: Ensure we only process markdown files
        if (file.extension !== 'md') {
            return null;
        }
        
        // Read the file content
        let content = await this.app.vault.read(file);
        const originalContent = content;  // Store original for comparison
        
        // Initialize tracking variables
        let linkCount = 0;
        let changes = [];
        
        // Build a map of all keywords to their target notes
        const keywordMap = this.buildKeywordMap();
        
        // Sort keywords by length (longest first)
        const sortedKeywords = Object.keys(keywordMap).sort((a, b) => b.length - a.length);
        
        // Track found keywords for firstOccurrenceOnly mode
        const foundKeywords = new Set();
        
        // Process each keyword
        for (let keyword of sortedKeywords) {
            const target = keywordMap[keyword];
            
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
            
            // Find all potential matches
            while ((match = pattern.exec(content)) !== null) {
                const matchIndex = match.index;
                const matchText = match[0];
                
                // Check if this match is inside a link or code block
                if (this.isInsideLinkOrCode(content, matchIndex)) {
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
                
                // Store this replacement
                replacements.push({
                    index: matchIndex,
                    length: matchText.length,
                    original: matchText,
                    replacement: target === matchText ? `[[${matchText}]]` : `[[${target}|${matchText}]]`
                });
                
                // Store change for preview
                changes.push({
                    keyword: matchText,
                    target: target,
                    context: this.getContext(content, matchIndex)
                });
                
                if (this.settings.firstOccurrenceOnly) {
                    break;  // Only find first occurrence
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
        }
        
        // Check if content changed
        const changed = content !== originalContent;
        
        // Save if not preview mode
        if (!preview && changed) {
            await this.app.vault.modify(file, content);
        }
        
        return changed ? {
            changed: true,
            linkCount: linkCount,
            changes: changes,
            preview: preview ? content : null
        } : null;
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
     * Build a map of all keywords (including variations) to their target notes
     * @returns {Object} Map where keys are keywords/variations and values are target note names
     */
    buildKeywordMap() {
        const map = {};
        
        // Iterate through all keyword entries in settings
        for (let item of this.settings.keywords) {
            // Skip items with empty keyword or target
            if (!item.keyword || !item.keyword.trim() || !item.target || !item.target.trim()) {
                continue;
            }
            
            // Add the main keyword
            map[item.keyword] = item.target;
            
            // Add all variations, all pointing to the same target
            if (item.variations && item.variations.length > 0) {
                for (let variation of item.variations) {
                    if (variation.trim()) {
                        map[variation] = item.target;
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
    }

    /**
     * Save plugin settings to disk
     */
    async saveSettings() {
        await this.saveData(this.settings);
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
                variations: []
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