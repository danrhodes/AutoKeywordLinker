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
        preventSelfLink: false,
        skipCodeBlocks: null,
        caseSensitive: null
    };

    // If keyword is in a group, use group settings (no keyword-level overrides allowed)
    if (keyword.groupId) {
        const group = settings.keywordGroups.find(g => g.id === keyword.groupId);
        if (group && group.settings) {
            Object.assign(effectiveSettings, group.settings);
        }
        // Keywords in groups inherit all settings from the group - no overrides
        return effectiveSettings;
    }

    // Only apply keyword-specific settings if NOT in a group
    // These settings only apply to standalone keywords
    if (keyword.enableTags !== null && keyword.enableTags !== undefined) effectiveSettings.enableTags = keyword.enableTags;
    if (keyword.linkScope !== null && keyword.linkScope !== undefined) effectiveSettings.linkScope = keyword.linkScope;
    if (keyword.scopeFolder !== null && keyword.scopeFolder !== undefined) effectiveSettings.scopeFolder = keyword.scopeFolder;
    if (keyword.useRelativeLinks !== null && keyword.useRelativeLinks !== undefined) effectiveSettings.useRelativeLinks = keyword.useRelativeLinks;
    if (keyword.blockRef !== null && keyword.blockRef !== undefined) effectiveSettings.blockRef = keyword.blockRef;
    if (keyword.requireTag !== null && keyword.requireTag !== undefined) effectiveSettings.requireTag = keyword.requireTag;
    if (keyword.onlyInNotesLinkingTo !== null && keyword.onlyInNotesLinkingTo !== undefined) effectiveSettings.onlyInNotesLinkingTo = keyword.onlyInNotesLinkingTo;
    if (keyword.suggestMode !== null && keyword.suggestMode !== undefined) effectiveSettings.suggestMode = keyword.suggestMode;
    if (keyword.preventSelfLink !== null && keyword.preventSelfLink !== undefined) effectiveSettings.preventSelfLink = keyword.preventSelfLink;
    if (keyword.skipCodeBlocks !== null && keyword.skipCodeBlocks !== undefined) effectiveSettings.skipCodeBlocks = keyword.skipCodeBlocks;
    if (keyword.caseSensitive !== null && keyword.caseSensitive !== undefined) effectiveSettings.caseSensitive = keyword.caseSensitive;

    return effectiveSettings;
}

/**
 * Resolve whether a keyword matches case-sensitively
 * Keyword/group override wins; null or undefined means inherit the global setting
 * @param {Object} settings - Plugin settings
 * @param {Object} keyword - Keyword object
 * @returns {boolean} True if matching is case-sensitive for this keyword
 */
function isKeywordCaseSensitive(settings, keyword) {
    const override = getEffectiveKeywordSettings(settings, keyword).caseSensitive;
    return override !== null && override !== undefined ? override : !!settings.caseSensitive;
}

/**
 * Check whether two keyword texts would match the same words
 * They conflict if identical, or if they differ only in case and either one ignores case
 * @param {string} a - First keyword text
 * @param {boolean} aCaseSensitive - Whether the first matches case-sensitively
 * @param {string} b - Second keyword text
 * @param {boolean} bCaseSensitive - Whether the second matches case-sensitively
 * @returns {boolean} True if they conflict
 */
function keywordTextsConflict(a, aCaseSensitive, b, bCaseSensitive) {
    const textA = (a || '').trim();
    const textB = (b || '').trim();
    if (!textA || !textB) return false;
    if (textA === textB) return true;
    return (!aCaseSensitive || !bCaseSensitive) && textA.toLowerCase() === textB.toLowerCase();
}

/**
 * Check whether two target note names refer to the same note (ignores case and a trailing .md)
 * @param {string} a - First target
 * @param {string} b - Second target
 * @returns {boolean} True if they match
 */
function sameTarget(a, b) {
    const normalize = (t) => (t || '').trim().replace(/\.md$/i, '').toLowerCase();
    return normalize(a) === normalize(b);
}

/**
 * Find another keyword that a new keyword would duplicate: same text (ignoring case), and - when
 * "Pick target from context" is on, so shared text is allowed - the same target too
 * @param {Object} settings - Plugin settings
 * @param {string} text - Keyword text
 * @param {string} target - Keyword target
 * @returns {Object|undefined} The existing keyword, if any
 */
function findDuplicateKeyword(settings, text, target) {
    const allowSharedText = settings.contextDisambiguation !== false;
    return settings.keywords.find(kw =>
        (kw.keyword || '').toLowerCase() === (text || '').toLowerCase() &&
        (!allowSharedText || sameTarget(kw.target, target)));
}

/**
 * Build a map of all keywords (including variations and aliases) to their target notes and settings
 * When context disambiguation is on, the same text pointing at a different target is kept as an
 * alternative on the first entry (entry.alternatives) so the linker can pick one by context
 * @param {Object} app - Obsidian app instance
 * @param {Object} settings - Plugin settings
 * @returns {Object} Map where keys are keywords/variations and values are objects with target and settings
 */
function buildKeywordMap(app, settings) {
    const map = {};
    const disambiguate = settings.contextDisambiguation !== false;
    // Track which keywords we've seen to detect duplicates. "Goblin" and "goblin" can coexist
    // only if both match case-sensitively; if either ignores case, the first one wins.
    const seenExact = new Set();             // exact keyword text
    const seenLowerAll = new Set();          // lowercase text of every keyword
    const seenLowerCaseInsensitive = new Set(); // lowercase text of case-insensitive keywords
    const firstKeyByLower = new Map();       // lowercase text → first map key with that text

    // Helper to add a keyword to the map, skipping duplicates
    const addToMap = (keywordText, target, effectiveSettings, keywordIndex, caseSensitive, contextHints) => {
        const lowerKey = keywordText.toLowerCase();
        const entry = {
            target: target,
            ...effectiveSettings,
            caseSensitive: caseSensitive, // resolved: override or global
            keywordIndex: keywordIndex,
            contextHints: contextHints || []
        };
        const isDuplicate = seenExact.has(keywordText) ||
            (caseSensitive ? seenLowerCaseInsensitive.has(lowerKey) : seenLowerAll.has(lowerKey));

        if (isDuplicate) {
            // Same text, different target: keep it as an alternative to choose between by context.
            // Otherwise skip it - first one wins (silent, duplicates are a user data issue)
            const existingKey = seenExact.has(keywordText) ? keywordText : firstKeyByLower.get(lowerKey);
            const existing = existingKey && map[existingKey];
            if (disambiguate && existing) {
                const alternatives = existing.alternatives || [];
                if (![existing, ...alternatives].some(e => sameTarget(e.target, target))) {
                    existing.alternatives = [...alternatives, entry];
                }
            }
            return false;
        }

        seenExact.add(keywordText);
        seenLowerAll.add(lowerKey);
        if (!caseSensitive) seenLowerCaseInsensitive.add(lowerKey);
        if (!firstKeyByLower.has(lowerKey)) firstKeyByLower.set(lowerKey, keywordText);

        map[keywordText] = entry;
        return true;
    };

    // Iterate through all keyword entries in settings
    for (let item of settings.keywords) {
        // Skip items with empty keyword or target
        if (!item.keyword || !item.keyword.trim() || !item.target || !item.target.trim()) {
            continue;
        }

        // Get effective settings (merges group settings with keyword-specific settings)
        const effectiveSettings = getEffectiveKeywordSettings(settings, item);
        const keywordIndex = settings.keywords.indexOf(item);
        const caseSensitive = isKeywordCaseSensitive(settings, item);
        const contextHints = Array.isArray(item.contextHints) ? item.contextHints : [];

        // Add the main keyword with its settings
        addToMap(item.keyword, item.target, effectiveSettings, keywordIndex, caseSensitive, contextHints);

        // Add all manual variations, all pointing to the same target with same settings
        if (item.variations && item.variations.length > 0) {
            for (let variation of item.variations) {
                if (variation.trim()) {
                    addToMap(variation, item.target, effectiveSettings, keywordIndex, caseSensitive, contextHints);
                }
            }
        }

        // Auto-discover aliases from the target note's frontmatter
        const aliases = getAliasesForNote(app, item.target);
        if (aliases && aliases.length > 0) {
            for (let alias of aliases) {
                if (alias.trim()) {
                    addToMap(alias, item.target, effectiveSettings, keywordIndex, caseSensitive, contextHints);
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
    isKeywordCaseSensitive,
    keywordTextsConflict,
    sameTarget,
    findDuplicateKeyword,
    buildKeywordMap,
    checkLinkScope
};
