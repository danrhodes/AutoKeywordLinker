/**
 * Command Registration Module
 * Registers all plugin commands with Obsidian
 * Extracted from main-source.js (Session 8)
 */

/**
 * Register all plugin commands
 * @param {Plugin} plugin - The plugin instance
 */
function registerCommands(plugin) {
    // ============================================================
    // LINKING COMMANDS
    // ============================================================

    // Register command: Link keywords in the currently active note
    plugin.addCommand({
        id: 'link-keywords-in-current-note',
        name: 'Link keywords in current note',
        editorCheckCallback: (checking, editor, view) => {
            if (checking) return true;
            plugin.linkKeywordsInCurrentNote(false);  // false = not preview mode
        }
    });

    // Register command: Preview keyword linking in the currently active note
    plugin.addCommand({
        id: 'preview-keywords-in-current-note',
        name: 'Preview keyword linking in current note',
        editorCheckCallback: (checking, editor, view) => {
            if (checking) return true;
            plugin.linkKeywordsInCurrentNote(true);   // true = preview mode
        }
    });

    // Register command: Link keywords in all notes in the vault
    plugin.addCommand({
        id: 'link-keywords-in-all-notes',
        name: 'Link keywords in all notes',
        callback: () => plugin.linkKeywordsInAllNotes(false)     // false = not preview mode
    });

    // Register command: Preview keyword linking in all notes
    plugin.addCommand({
        id: 'preview-keywords-in-all-notes',
        name: 'Preview keyword linking in all notes',
        callback: () => plugin.linkKeywordsInAllNotes(true)      // true = preview mode
    });

    // ============================================================
    // SUGGESTION COMMANDS
    // ============================================================

    // Register command: Suggest keywords
    plugin.addCommand({
        id: 'suggest-keywords',
        name: 'Suggest keywords from notes',
        callback: () => plugin.suggestKeywords()
    });

    // Register command: Suggest keywords from current note only
    plugin.addCommand({
        id: 'suggest-keywords-current-note',
        name: 'Suggest keywords from current note only',
        editorCheckCallback: (checking, editor, view) => {
            if (checking) return true;
            plugin.suggestKeywordsFromCurrentNote();
        }
    });

    // Register command: Accept all suggestions on current line
    plugin.addCommand({
        id: 'accept-suggestion-at-cursor',
        name: 'Accept all suggestions on current line',
        editorCallback: (editor) => plugin.acceptSuggestionAtCursor(editor)
    });

    // Register command: Accept all link suggestions in current note
    plugin.addCommand({
        id: 'accept-all-suggestions',
        name: 'Accept all link suggestions in current note',
        editorCallback: (editor) => plugin.acceptAllSuggestions(editor)
    });

    // Register command: Review link suggestions (opens modal)
    plugin.addCommand({
        id: 'review-link-suggestions',
        name: 'Review link suggestions',
        editorCallback: (editor) => plugin.reviewSuggestions(editor)
    });

    // ============================================================
    // IMPORT/EXPORT COMMANDS
    // ============================================================

    // Register command: Export keywords to JSON
    plugin.addCommand({
        id: 'export-keywords',
        name: 'Export keywords to JSON',
        callback: () => plugin.exportKeywords()
    });

    // Register command: Import keywords from JSON
    plugin.addCommand({
        id: 'import-keywords',
        name: 'Import keywords from JSON',
        callback: () => plugin.importKeywords()
    });

    // Register command: Download CSV template
    plugin.addCommand({
        id: 'download-csv-template',
        name: 'Download CSV template',
        callback: () => plugin.downloadCSVTemplate()
    });

    // Register command: Export keywords to CSV
    plugin.addCommand({
        id: 'export-keywords-csv',
        name: 'Export keywords to CSV',
        callback: () => plugin.exportKeywordsToCSV()
    });

    // Register command: Import keywords from CSV
    plugin.addCommand({
        id: 'import-keywords-csv',
        name: 'Import keywords from CSV',
        callback: () => plugin.importKeywordsFromCSV()
    });

    // ============================================================
    // STATISTICS COMMANDS
    // ============================================================

    // Register command: View statistics
    plugin.addCommand({
        id: 'view-statistics',
        name: 'View statistics',
        callback: () => plugin.showStatistics()
    });
}

module.exports = { registerCommands };
