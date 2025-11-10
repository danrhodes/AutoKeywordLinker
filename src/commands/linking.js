/**
 * Linking command implementations
 * Extracted from main-source.js (Session 4)
 */

const { Notice } = require('obsidian');

/**
 * Link keywords in the current note
 * @param {Object} app - Obsidian app instance
 * @param {Object} settings - Plugin settings
 * @param {Function} linkKeywordsInFile - Function to link keywords in a file
 * @param {Function} saveSettings - Function to save settings
 * @param {Function} updateStatusBar - Function to update status bar
 * @param {Class} PreviewModal - PreviewModal class
 * @param {boolean} preview - If true, show preview modal instead of applying changes
 */
async function linkKeywordsInCurrentNote(app, settings, linkKeywordsInFile, saveSettings, updateStatusBar, PreviewModal, preview = false) {
    // Get the currently open file
    const activeFile = app.workspace.getActiveFile();

    // If no file is open, show error and return
    if (!activeFile) {
        new Notice('No active file');
        return;
    }

    // Process the file and get results
    const results = await linkKeywordsInFile(activeFile, preview);

    // If preview mode and we have results, show preview modal
    if (preview && results) {
        new PreviewModal(app, results, activeFile.basename).open();
    }
    // If not preview mode and changes were made, show success message
    else if (!preview && results && results.changed) {
        new Notice(`Linked ${results.linkCount} keyword(s) in current note!`);

        // Update statistics
        settings.statistics.totalLinksCreated += results.linkCount;
        settings.statistics.totalNotesProcessed += 1;
        settings.statistics.lastRunDate = new Date().toISOString();
        await saveSettings();

        // Update status bar to reflect new suggestions
        setTimeout(() => updateStatusBar(), 100);
    }
    // If not preview mode and no changes were made, inform user
    else if (!preview) {
        new Notice('No keywords found to link');
    }
}

/**
 * Link keywords in all notes in the vault
 * @param {Object} app - Obsidian app instance
 * @param {Object} settings - Plugin settings
 * @param {Function} linkKeywordsInFile - Function to link keywords in a file
 * @param {Function} saveSettings - Function to save settings
 * @param {Object} pluginInstance - Plugin instance (for BulkPreviewModal)
 * @param {Class} BulkPreviewModal - BulkPreviewModal class
 * @param {boolean} preview - If true, show preview modal instead of applying changes
 */
async function linkKeywordsInAllNotes(app, settings, linkKeywordsInFile, saveSettings, pluginInstance, BulkPreviewModal, preview = false) {
    // Get all markdown files in the vault
    const files = app.vault.getMarkdownFiles();

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

        const results = await linkKeywordsInFile(file, preview);

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
        settings.statistics.totalLinksCreated += totalLinks;
        settings.statistics.totalNotesProcessed += filesModified;
        settings.statistics.lastRunDate = new Date().toISOString();
        await saveSettings();
    }

    // If preview mode and we have results, show bulk preview modal
    if (preview && previewResults.length > 0) {
        new BulkPreviewModal(app, previewResults, pluginInstance).open();
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

module.exports = {
    linkKeywordsInCurrentNote,
    linkKeywordsInAllNotes
};
