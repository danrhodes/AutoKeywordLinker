/**
 * Import/Export command implementations
 * Extracted from main-source.js (Session 4)
 */

const { Notice } = require('obsidian');
const { escapeCSV } = require('../utils/helpers');

/**
 * Export keywords to JSON file
 * @param {Object} app - Obsidian app instance
 * @param {Object} settings - Plugin settings
 */
async function exportKeywords(app, settings) {
    try {
        const dataStr = JSON.stringify(settings.keywords, null, 2);
        const date = new Date().toISOString().split('T')[0];
        const filename = `auto-keyword-linker-export-${date}.json`;

        // Create file in vault root
        await app.vault.create(filename, dataStr);
        new Notice(`Keywords exported to ${filename}`);
    } catch (error) {
        new Notice(`Export failed: ${error.message}`);
    }
}

/**
 * Import keywords from JSON file
 * @param {Object} app - Obsidian app instance
 * @param {Object} pluginInstance - Plugin instance
 * @param {Class} ImportModal - ImportModal class
 */
async function importKeywords(app, pluginInstance, ImportModal) {
    new ImportModal(app, pluginInstance).open();
}

/**
 * Download CSV template for bulk keyword import
 * @param {Object} app - Obsidian app instance
 */
async function downloadCSVTemplate(app) {
    try {
        const headers = 'keyword,target,variations,enableTags,linkScope,scopeFolder,useRelativeLinks,blockRef,requireTag,onlyInNotesLinkingTo,suggestMode,preventSelfLink';
        const example1 = 'Python,Languages/Python,"python|py|Python3",false,vault-wide,,false,,,false,false';
        const example2 = 'JavaScript,Languages/JavaScript,"js|javascript",false,vault-wide,,false,,,false,false';
        const example3 = 'API,Documentation/API,"api|REST API",false,same-folder,,false,,reviewed,true,false';

        const csvContent = `${headers}\n${example1}\n${example2}\n${example3}\n`;

        const filename = 'auto-keyword-linker-template.csv';
        await app.vault.create(filename, csvContent);
        new Notice(`CSV template downloaded: ${filename}`);
    } catch (error) {
        new Notice(`Template download failed: ${error.message}`);
    }
}

/**
 * Export keywords to CSV file
 * @param {Object} app - Obsidian app instance
 * @param {Object} settings - Plugin settings
 */
async function exportKeywordsToCSV(app, settings) {
    try {
        const headers = 'keyword,target,variations,enableTags,linkScope,scopeFolder,useRelativeLinks,blockRef,requireTag,onlyInNotesLinkingTo,suggestMode,preventSelfLink';
        const rows = [headers];

        for (let item of settings.keywords) {
            // Convert variations array to pipe-separated string
            const variations = (item.variations && item.variations.length > 0)
                ? `"${item.variations.join('|')}"`
                : '';

            // Build CSV row
            const row = [
                escapeCSV(item.keyword),
                escapeCSV(item.target),
                variations,
                item.enableTags || false,
                item.linkScope || 'vault-wide',
                escapeCSV(item.scopeFolder || ''),
                item.useRelativeLinks || false,
                escapeCSV(item.blockRef || ''),
                escapeCSV(item.requireTag || ''),
                item.onlyInNotesLinkingTo || false,
                item.suggestMode || false,
                item.preventSelfLink || false
            ].join(',');

            rows.push(row);
        }

        const csvContent = rows.join('\n');
        const date = new Date().toISOString().split('T')[0];
        const filename = `auto-keyword-linker-export-${date}.csv`;

        await app.vault.create(filename, csvContent);
        new Notice(`Keywords exported to ${filename}`);
    } catch (error) {
        new Notice(`CSV export failed: ${error.message}`);
    }
}

/**
 * Import keywords from CSV file
 * @param {Object} app - Obsidian app instance
 * @param {Object} pluginInstance - Plugin instance
 * @param {Class} ImportCSVModal - ImportCSVModal class
 */
async function importKeywordsFromCSV(app, pluginInstance, ImportCSVModal) {
    new ImportCSVModal(app, pluginInstance).open();
}

module.exports = {
    exportKeywords,
    importKeywords,
    downloadCSVTemplate,
    exportKeywordsToCSV,
    importKeywordsFromCSV
};
