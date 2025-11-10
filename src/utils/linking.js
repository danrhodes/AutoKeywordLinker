/**
 * Linking utilities for Auto Keyword Linker plugin
 * Extracted from main.js during refactoring Session 2
 */

const { getAliasesForNote } = require('./noteManagement');

/**
 * Get effective keyword settings (merges group + keyword-specific settings)
 * @param {Object} settings - Plugin settings
 * @param {Object} keyword - Keyword object
 * @returns {Object} Effective settings for the keyword
 */
function getEffectiveKeywordSettings(settings, keyword) {
    // Start with defaults
    const effectiveSettings = {
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
        const group = settings.keywordGroups.find(g => g.id === keyword.groupId);
        if (group && group.settings) {
            Object.assign(effectiveSettings, group.settings);
        }
    }

    // Override with keyword-specific settings only if explicitly set (not null/undefined)
    // null means "inherit from group", so we skip those
    if (keyword.enableTags !== null && keyword.enableTags !== undefined) effectiveSettings.enableTags = keyword.enableTags;
    if (keyword.linkScope !== null && keyword.linkScope !== undefined && keyword.linkScope !== 'vault-wide') effectiveSettings.linkScope = keyword.linkScope;
    if (keyword.scopeFolder !== null && keyword.scopeFolder !== undefined && keyword.scopeFolder !== '') effectiveSettings.scopeFolder = keyword.scopeFolder;
    if (keyword.useRelativeLinks !== null && keyword.useRelativeLinks !== undefined) effectiveSettings.useRelativeLinks = keyword.useRelativeLinks;
    if (keyword.blockRef !== null && keyword.blockRef !== undefined && keyword.blockRef !== '') effectiveSettings.blockRef = keyword.blockRef;
    if (keyword.requireTag !== null && keyword.requireTag !== undefined && keyword.requireTag !== '') effectiveSettings.requireTag = keyword.requireTag;
    if (keyword.onlyInNotesLinkingTo !== null && keyword.onlyInNotesLinkingTo !== undefined) effectiveSettings.onlyInNotesLinkingTo = keyword.onlyInNotesLinkingTo;
    if (keyword.suggestMode !== null && keyword.suggestMode !== undefined) effectiveSettings.suggestMode = keyword.suggestMode;
    if (keyword.preventSelfLink !== null && keyword.preventSelfLink !== undefined) effectiveSettings.preventSelfLink = keyword.preventSelfLink;

    return effectiveSettings;
}

/**
 * Build a map of all keywords (including variations and aliases) to their target notes and settings
 * @param {Object} app - Obsidian app instance
 * @param {Object} settings - Plugin settings
 * @returns {Object} Map where keys are keywords/variations and values are objects with target and settings
 */
function buildKeywordMap(app, settings) {
    const map = {};

    // Iterate through all keyword entries in settings
    for (let item of settings.keywords) {
        // Skip items with empty keyword or target
        if (!item.keyword || !item.keyword.trim() || !item.target || !item.target.trim()) {
            continue;
        }

        // Get effective settings (merges group settings with keyword-specific settings)
        const effectiveSettings = getEffectiveKeywordSettings(settings, item);

        // Add the main keyword with its settings
        map[item.keyword] = {
            target: item.target,
            ...effectiveSettings,
            keywordIndex: settings.keywords.indexOf(item)
        };

        // Add all manual variations, all pointing to the same target with same settings
        if (item.variations && item.variations.length > 0) {
            for (let variation of item.variations) {
                if (variation.trim()) {
                    map[variation] = {
                        target: item.target,
                        ...effectiveSettings,
                        keywordIndex: settings.keywords.indexOf(item)
                    };
                }
            }
        }

        // Auto-discover aliases from the target note's frontmatter
        const aliases = getAliasesForNote(app, item.target);
        if (aliases && aliases.length > 0) {
            for (let alias of aliases) {
                if (alias.trim()) {
                    // Add alias to keyword map (only if not already present)
                    if (!map[alias]) {
                        map[alias] = {
                            target: item.target,
                            ...effectiveSettings,
                            keywordIndex: settings.keywords.indexOf(item)
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
 * @param {Object} app - Obsidian app instance
 * @param {TFile} sourceFile - The file being processed (source)
 * @param {string} targetNoteName - The target note name
 * @param {string} linkScope - The link scope setting ('vault-wide', 'same-folder', 'source-folder', 'target-folder')
 * @param {string} scopeFolder - The folder path for source-folder or target-folder scopes
 * @param {Function} findTargetFile - Function to find target file by name
 * @returns {boolean} True if the keyword should be linked
 */
function checkLinkScope(app, sourceFile, targetNoteName, linkScope, scopeFolder, findTargetFile) {
    // Vault-wide: always link
    if (linkScope === 'vault-wide') {
        return true;
    }

    // Get source file's folder
    const sourceFolder = sourceFile.parent ? sourceFile.parent.path : '';

    // Same folder only: check if source and target are in the same folder
    if (linkScope === 'same-folder') {
        // Find the target file
        const targetFile = findTargetFile(app, targetNoteName);
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
        const targetFile = findTargetFile(app, targetNoteName);
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

module.exports = {
    getEffectiveKeywordSettings,
    buildKeywordMap,
    checkLinkScope
};
