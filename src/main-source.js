// Import required Obsidian API components
const { Plugin } = require('obsidian');

// Import refactored modules (Session 1)
const { loadSettings, saveSettings, setupSettingsWatcher } = require('./settings');

// Import refactored modules (Session 2)
const { getEffectiveKeywordSettings, buildKeywordMap, checkLinkScope } = require('./utils/linking');
const { getAliasesForNote, noteHasTag, noteHasLinkToTarget, ensureNoteExists, findTargetFile } = require('./utils/noteManagement');

// Import refactored modules (Session 3)
const { getStopWords, extractWordsFromText, extractPhrasesFromText, analyzeNotesForKeywords, analyzeCurrentNoteForKeywords } = require('./utils/analysis');
const { getFrontmatterBounds, isInsideAlias, isPartOfUrl, isInsideLinkOrCode, isInsideBlockReference, isInsideTable, isInsideMath } = require('./utils/detection');
const { sanitizeTagName, addTagsToContent, addTagsToFile, addTagToTargetNote } = require('./utils/tagManagement');

// Import refactored modules (Session 4)
const { linkKeywordsInCurrentNote: linkCurrentNote, linkKeywordsInAllNotes: linkAllNotes } = require('./commands/linking');
const { suggestKeywords: suggestKeywordsCmd, suggestKeywordsFromCurrentNote: suggestCurrentNoteCmd, reviewSuggestions: reviewSuggestionsCmd, acceptSuggestionAtCursor: acceptCursorCmd, acceptAllSuggestions: acceptAllCmd } = require('./commands/suggestions');
const { exportKeywords: exportKeywordsCmd, importKeywords: importKeywordsCmd, downloadCSVTemplate: downloadCSVCmd, exportKeywordsToCSV: exportCSVCmd, importKeywordsFromCSV: importCSVCmd } = require('./commands/importExport');
const { showStatistics: showStatsCmd } = require('./commands/statistics');

// Import UI components (Session 5)
const StatisticsModal = require('./ui/modals/StatisticsModal');
const SuggestedKeywordBuilderModal = require('./ui/modals/SuggestedKeywordBuilderModal');
const ImportModal = require('./ui/modals/ImportModal');
const ImportCSVModal = require('./ui/modals/ImportCSVModal');
const PreviewModal = require('./ui/modals/PreviewModal');
const SuggestionReviewModal = require('./ui/modals/SuggestionReviewModal');
const BulkPreviewModal = require('./ui/modals/BulkPreviewModal');

// Import UI components (Session 6)
const AutoKeywordLinkerSettingTab = require('./ui/settings/AutoKeywordLinkerSettingTab');
const KeywordGroupAssignModal = require('./ui/modals/KeywordGroupAssignModal');
const FolderSuggestModal = require('./ui/modals/FolderSuggestModal');
const NoteSuggestModal = require('./ui/modals/NoteSuggestModal');

// Import UI handlers (Session 7)
const SuggestionHandler = require('./ui/SuggestionHandler');
const { addCustomStyles } = require('./ui/styles');
const { setupAutoLinkOnSave } = require('./features/AutoLinker');
const KeywordLinker = require('./core/KeywordLinker');

// Import core registration modules (Session 8)
const { registerCommands } = require('./core/commandRegistry');
const { registerEvents } = require('./core/eventRegistry');

// Main plugin class - this is the entry point for the plugin
module.exports = class AutoKeywordLinker extends Plugin {

    /**
     * Called when settings change externally (e.g., from sync)
     * This is a lifecycle method provided by the Plugin base class
     */
    async onExternalSettingsChange() {
        if (this._handleExternalSettingsChange) {
            await this._handleExternalSettingsChange();
        }
    }

    /**
     * Called when the plugin is loaded
     * Sets up commands, settings, and event listeners
     */
    async onload() {
        // Load saved settings from disk (or use defaults if none exist)
        this.settings = await loadSettings(this);

        // Set up file watcher to detect settings changes from sync
        setupSettingsWatcher(this);

        // Initialize core linking engine (Session 7)
        this.keywordLinker = new KeywordLinker(this.app, this.settings);

        // Register all commands (Session 8: extracted to commandRegistry.js)
        registerCommands(this);

        // Add the settings tab to Obsidian's settings panel
        this.addSettingTab(new AutoKeywordLinkerSettingTab(this.app, this));

        // Add custom CSS styles for modals and UI on plugin load (Session 7)
        addCustomStyles();

        // Register all event listeners (Session 8: extracted to eventRegistry.js)
        registerEvents(this);

        // If auto-link on save is enabled, set up the event listener (Session 7)
        if (this.settings.autoLinkOnSave) {
            setupAutoLinkOnSave(this);
        }
    }

    /**
     * Process suggested links in rendered markdown
     * Delegated to SuggestionHandler module
     */
    processSuggestedLinks(element) {
        return SuggestionHandler.processSuggestedLinks(this, element);
    }

    /**
     * Update status bar with suggestion count
     * Delegated to SuggestionHandler module
     */
    updateStatusBar() {
        return SuggestionHandler.updateStatusBar(this);
    }

    /**
     * Set up context menu for suggested links
     * Delegated to SuggestionHandler module
     */
    setupSuggestionContextMenu() {
        return SuggestionHandler.setupSuggestionContextMenu(this);
    }

    /**
     * Set up click handler for Live Preview mode
     * Delegated to SuggestionHandler module
     */
    setupLivePreviewClickHandler() {
        return SuggestionHandler.setupLivePreviewClickHandler(this);
    }

    /**
     * Show suggestion menu for a specific line
     * Delegated to SuggestionHandler module
     */
    showSuggestionMenuAtLine(editor, lineNumber, lineText, evt) {
        return SuggestionHandler.showSuggestionMenuAtLine(this, editor, lineNumber, lineText, evt);
    }

    /**
     * Accept a suggestion in a specific line
     * Delegated to SuggestionHandler module
     */
    acceptSuggestionInLine(editor, lineNumber, lineText, matchText, targetNote, blockRef, useRelative) {
        return SuggestionHandler.acceptSuggestionInLine(this, editor, lineNumber, lineText, matchText, targetNote, blockRef, useRelative);
    }

    /**
     * Review all link suggestions in a modal
     */
    reviewSuggestions(editor) {
        return reviewSuggestionsCmd(this.app, editor, SuggestionReviewModal);
    }

    /**
     * Accept all link suggestions on the current line
     */
    acceptSuggestionAtCursor(editor) {
        return acceptCursorCmd(editor, this.isInsideTable.bind(this), this.updateStatusBar.bind(this));
    }

    /**
     * Accept all link suggestions in the current note
     */
    acceptAllSuggestions(editor) {
        return acceptAllCmd(editor, this.isInsideTable.bind(this), this.updateStatusBar.bind(this));
    }

    /**
     * Show statistics modal
     */
    showStatistics() {
        return showStatsCmd(this.app, this.settings, StatisticsModal);
    }

    /**
     * Set up file watcher to detect settings changes from sync
     * This allows the plugin to automatically reload settings when synced from other devices
     */
    // setupSettingsWatcher - now handled by imported function in onload()

    /**
     * Export keywords to JSON file
     */
    async exportKeywords() {
        return await exportKeywordsCmd(this.app, this.settings);
    }

    /**
     * Import keywords from JSON file
     */
    async importKeywords() {
        return await importKeywordsCmd(this.app, this, ImportModal);
    }

    /**
     * Download CSV template for bulk keyword import
     */
    async downloadCSVTemplate() {
        return await downloadCSVCmd(this.app);
    }

    /**
     * Export keywords to CSV file
     */
    async exportKeywordsToCSV() {
        return await exportCSVCmd(this.app, this.settings);
    }

    /**
     * Import keywords from CSV file
     */
    async importKeywordsFromCSV() {
        return await importCSVCmd(this.app, this, ImportCSVModal);
    }

    /**
     * Escape CSV field if it contains special characters
     */
    // escapeCSV - now imported from helpers
    // parseCSVLine - now imported from helpers

    /**
     * Open the Suggested Keyword Builder modal
     */
    async suggestKeywords() {
        return await suggestKeywordsCmd(this.app, this, SuggestedKeywordBuilderModal);
    }

    /**
     * Open the Suggested Keyword Builder modal for current note only
     */
    async suggestKeywordsFromCurrentNote() {
        return await suggestCurrentNoteCmd(this.app, this, SuggestedKeywordBuilderModal);
    }

    /**
     * Get combined stop words (default + custom)
     * @returns {Set} Set of stop words to exclude
     */
    getStopWords() {
        return getStopWords(this.settings);
    }

    /**
     * Extract meaningful words from text
     * @param {string} text - Text to extract words from
     * @param {boolean} isTitle - Whether this is a title (affects processing)
     * @returns {Array} Array of normalized words
     */
    extractWordsFromText(text, isTitle = false) {
        return extractWordsFromText(text, isTitle, this.settings);
    }

    /**
     * Extract meaningful phrases (2-4 words) from text
     * @param {string} text - Text to extract phrases from
     * @returns {Array} Array of normalized phrases
     */
    extractPhrasesFromText(text) {
        return extractPhrasesFromText(text, this.settings);
    }

    /**
     * Analyze notes in the vault and extract keyword suggestions
     * @returns {Array} Array of suggestion objects with word, count, and notes
     */
    async analyzeNotesForKeywords() {
        return await analyzeNotesForKeywords(this.app, this.settings, this.getAliasesForNote.bind(this));
    }

    /**
     * Analyze a single note and extract keyword suggestions
     * @param {TFile} file - The file to analyze
     * @returns {Array} Array of suggestion objects with word, count, and notes
     */
    async analyzeCurrentNoteForKeywords(file) {
        return await analyzeCurrentNoteForKeywords(this.app, this.settings, file, this.getAliasesForNote.bind(this));
    }

    /**
     * Setup auto-link on save event listener
     * Delegated to AutoLinker module (Session 7)
     */
    setupAutoLinkOnSave() {
        return setupAutoLinkOnSave(this);
    }

    /**
     * Link keywords in the currently active note
     * @param {boolean} preview - If true, show preview modal instead of applying changes
     */
    async linkKeywordsInCurrentNote(preview = false) {
        return await linkCurrentNote(this.app, this.settings, this.linkKeywordsInFile.bind(this), this.saveSettings.bind(this), this.updateStatusBar.bind(this), PreviewModal, preview);
    }

    /**
     * Link keywords in all notes in the vault
     * @param {boolean} preview - If true, show preview modal instead of applying changes
     */
    async linkKeywordsInAllNotes(preview = false) {
        return await linkAllNotes(this.app, this.settings, this.linkKeywordsInFile.bind(this), this.saveSettings.bind(this), this, BulkPreviewModal, preview);
    }

    /**
     * Process a single file and link keywords
     * Delegated to KeywordLinker core engine (Session 7)
     * @param {TFile} file - The file to process
     * @param {boolean} preview - If true, don't modify file, just return what would change
     * @param {boolean} skipTags - If true, don't add tags immediately, return them for later processing
     * @returns {Object|null} Results object with change information, or null if no changes
     */
    async linkKeywordsInFile(file, preview = false, skipTags = false) {
        // Update KeywordLinker settings reference in case they changed
        this.keywordLinker.settings = this.settings;
        return await this.keywordLinker.linkKeywordsInFile(file, preview, skipTags);
    }

    /**
     * Add tags to a file and its target notes (called after debounce)
     * @param {TFile} file - The file to add tags to
     * @param {Array} tagsToAdd - Array of tag names to add to the current file
     * @param {Map} targetNotesForTags - Map of target note names to tag names
     */
    async addTagsToFile(file, tagsToAdd, targetNotesForTags) {
        return await addTagsToFile(this.app, file, tagsToAdd, targetNotesForTags);
    }

    /**
     * Sanitize keyword into a valid tag name
     * Converts spaces to hyphens and removes invalid characters
     * @param {string} keyword - The keyword to convert
     * @returns {string} Sanitized tag name
     */
    sanitizeTagName(keyword) {
        return sanitizeTagName(keyword);
    }

    /**
     * Add tags to the end of content
     * @param {string} content - The file content
     * @param {Array} tags - Array of tag names (without #)
     * @returns {string} Content with tags added
     */
    addTagsToContent(content, tags) {
        return addTagsToContent(content, tags);
    }

    /**
     * Add a tag to a target note
     * @param {string} noteName - Name of the target note
     * @param {string} tagName - Tag to add (without #)
     */
    async addTagToTargetNote(noteName, tagName) {
        return await addTagToTargetNote(this.app, noteName, tagName);
    }

    /**
     * Get the start and end positions of YAML frontmatter
     * @param {string} content - The full content
     * @returns {Object|null} Object with start and end positions, or null if no frontmatter
     */
    getFrontmatterBounds(content) {
        return getFrontmatterBounds(content);
    }

    /**
     * Check if a position is inside the alias portion of an Obsidian link
     * Format: [[target|alias]] - we want to skip text in the alias part
     * @param {string} content - The full content
     * @param {number} index - Position to check
     * @returns {boolean} True if inside alias portion of a link
     */
    isInsideAlias(content, index) {
        return isInsideAlias(content, index);
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
        return isPartOfUrl(content, index, length);
    }

    /**
     * Check if a position in the content is inside a link or code block
     * @param {string} content - The full content
     * @param {number} index - Position to check
     * @returns {boolean} True if inside link or code
     */
    isInsideLinkOrCode(content, index) {
        return isInsideLinkOrCode(content, index);
    }

    /**
     * Check if a position is inside a block reference (^block-id)
     * Block references are in the format: ^some-block-id at the end of a line
     * @param {string} content - The full content
     * @param {number} index - Position to check
     * @returns {boolean} True if inside a block reference
     */
    isInsideBlockReference(content, index) {
        return isInsideBlockReference(content, index);
    }

    /**
     * Check if a position is inside a Markdown table
     * Tables are defined by lines containing pipes (|) with a header separator line
     * @param {string} content - The full content
     * @param {number} index - Position to check
     * @returns {boolean} True if inside a table
     */
    isInsideTable(content, index) {
        return isInsideTable(content, index);
    }

    /**
     * Check if a position is inside a LaTeX math formula
     * @param {string} content - The full content
     * @param {number} index - Position to check
     * @returns {boolean} True if inside math formula
     */
    isInsideMath(content, index) {
        return isInsideMath(content, index);
    }

    /**
     * Get effective settings for a keyword by merging group settings with keyword-specific settings
     * Keyword-specific settings override group settings
     * @param {Object} keyword - The keyword object
     * @returns {Object} Merged settings
     */
    getEffectiveKeywordSettings(keyword) {
        return getEffectiveKeywordSettings(this.settings, keyword);
    }

    /**
     * Build a map of all keywords (including variations) to their target notes and settings
     * @returns {Object} Map where keys are keywords/variations and values are objects with target and enableTags
     */
    buildKeywordMap() {
        return buildKeywordMap(this.app, this.settings);
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
        return checkLinkScope(this.app, sourceFile, targetNoteName, linkScope, scopeFolder, findTargetFile);
    }

    /**
     * Find a target file by name
     * @param {string} noteName - Name of the note (with or without .md extension)
     * @returns {TFile|null} The file object or null if not found
     */
    findTargetFile(noteName) {
        return findTargetFile(this.app, noteName);
    }

    /**
     * Get aliases from a note's YAML frontmatter
     * @param {string} noteName - Name of the note (with or without .md extension)
     * @returns {Array<string>} Array of aliases, or empty array if none found
     */
    getAliasesForNote(noteName) {
        return getAliasesForNote(this.app, noteName);
    }

    /**
     * Check if a note has a required tag (in frontmatter or inline)
     * @param {string} noteName - Name of the note (with or without .md extension)
     * @param {string} requiredTag - The tag to check for (without # prefix)
     * @returns {boolean} True if note has the tag, false otherwise
     */
    noteHasTag(noteName, requiredTag) {
        return noteHasTag(this.app, noteName, requiredTag);
    }

    /**
     * Check if a note has an existing link to a target note
     * @param {TFile} sourceFile - The source file to check
     * @param {string} targetNoteName - The target note name to look for links to
     * @returns {boolean} True if the source note has at least one link to the target note
     */
    noteHasLinkToTarget(sourceFile, targetNoteName) {
        return noteHasLinkToTarget(this.app, sourceFile, targetNoteName);
    }

    /**
     * Ensure a note exists, creating it if necessary
     * @param {string} noteName - Name of the note to ensure exists
     */
    async ensureNoteExists(noteName) {
        return await ensureNoteExists(this.app, this.settings, noteName);
    }

    /**
     * Get surrounding context for a match (for preview display)
     * @param {string} content - The full content
     * @param {number} index - Position of the match
     * @param {number} contextLength - Number of characters to show on each side
     * @returns {string} Context string with ellipses
     */
    // getContext - now imported from helpers
    // escapeRegex - now imported from helpers
    // generateId - now imported from helpers

    // loadSettings - now handled by imported function in onload()

    /**
     * Save plugin settings to disk
     */
    async saveSettings() {
        await saveSettings(this, this.settings);
    }

    /**
     * Add custom CSS styles for the improved UI
     * This is called on plugin load to ensure styles are available for all modals
     */
    addCustomStyles() {
        return addCustomStyles();
    }
}