/**
 * Linking command implementations
 * Extracted from main-source.js (Session 4)
 */

const { Notice } = require('obsidian');
const { findTargetFile } = require('../utils/noteManagement');

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
    let results;
    try {
        results = await linkKeywordsInFile(activeFile, preview);
    } catch (err) {
        console.error('Auto Keyword Linker: Error linking keywords in current note:', err);
        new Notice(`Error linking keywords: ${err.message}`);
        return;
    }

    // If preview mode and we have results, show preview modal
    if (preview && results) {
        new PreviewModal(app, results, activeFile.basename).open();
    }
    // If preview mode but no results, inform user
    else if (preview) {
        new Notice('No keywords found to link in this note');
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

    // Show immediate feedback - this can take a while on large or cloud-synced vaults
    const action = preview ? 'Checking' : 'Linking keywords in';
    const progressNotice = new Notice(`${action} ${files.length} note(s)...`, 0);

    // Process each file - note we're NOT using skipTags, so tags will be added immediately
    let processedCount = 0;
    for (let file of files) {
        processedCount++;
        if (processedCount % 25 === 0) {
            progressNotice.setMessage(`${action} ${files.length} note(s)... (${processedCount}/${files.length})`);
        }

        // CRITICAL FIX: Skip non-markdown files (attachments, etc.)
        if (file.extension !== 'md') {
            continue;
        }

        let results;
        try {
            results = await linkKeywordsInFile(file, preview);
        } catch (err) {
            console.error(`Auto Keyword Linker: Error processing ${file.path}:`, err);
            continue;
        }

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

    progressNotice.hide();

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
    // No matches - explain what to check rather than reporting "0 in 0"
    else if (filesModified === 0) {
        new Notice(getNoMatchesMessage(app, settings), 10000);
    }
    // If not preview mode, show summary of changes
    else {
        new Notice(`Linked ${totalLinks} keyword(s) in ${filesModified} note(s)!`);
    }
}

/**
 * Build a helpful message for when no keywords were found to link
 * @param {Object} app - Obsidian app instance
 * @param {Object} settings - Plugin settings
 * @returns {string} Message to show the user
 */
function getNoMatchesMessage(app, settings) {
    let message = 'No keywords found to link in any notes. Check that your keywords appear as plain text in your notes and have a target note set.';

    if (!settings.autoCreateNotes) {
        const missingTargets = settings.keywords.filter(kw =>
            kw.keyword && kw.keyword.trim() && kw.target && kw.target.trim() && !findTargetFile(app, kw.target)
        ).length;
        if (missingTargets > 0) {
            message += ` ${missingTargets} keyword target note(s) don't exist yet - turn on "Auto-create notes" to create them automatically.`;
        }
    }

    return message;
}

module.exports = {
    linkKeywordsInCurrentNote,
    linkKeywordsInAllNotes
};
