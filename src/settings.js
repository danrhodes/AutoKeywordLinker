/**
 * Settings management for Auto Keyword Linker plugin
 * Extracted from main.js during refactoring Session 1
 */

const { DEFAULT_SETTINGS } = require('./utils/constants');
const { generateId } = require('./utils/helpers');

/**
 * Load plugin settings from disk
 * Handles migrations for new settings fields
 * @param {Plugin} plugin - The plugin instance
 * @returns {Promise<Object>} Plugin settings
 */
async function loadSettings(plugin) {
    // Merge saved settings with defaults (in case new settings were added)
    const settings = Object.assign({}, DEFAULT_SETTINGS, await plugin.loadData());

    // Ensure statistics object exists
    if (!settings.statistics) {
        settings.statistics = DEFAULT_SETTINGS.statistics;
    }

    // Ensure customStopWords exists and is an array
    if (!settings.customStopWords || !Array.isArray(settings.customStopWords)) {
        settings.customStopWords = DEFAULT_SETTINGS.customStopWords;
    }

    // Ensure keywordGroups array exists (migration for existing users)
    if (!settings.keywordGroups) {
        settings.keywordGroups = [];
    }

    // Ensure enableTags, linkScope, id, and groupId fields exist for all keywords
    if (settings.keywords) {
        for (let keyword of settings.keywords) {
            // Add ID if missing (migration for existing keywords)
            if (!keyword.id) {
                keyword.id = generateId('kw');
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

    return settings;
}

/**
 * Save plugin settings to disk
 * Uses debouncing to prevent reload loops during sync
 * @param {Plugin} plugin - The plugin instance
 * @param {Object} settings - Settings object to save
 * @returns {Promise<void>}
 */
async function saveSettings(plugin, settings) {
    plugin.isSaving = true;
    await plugin.saveData(settings);
    // Reset flag after a short delay to ensure the modify event has been processed
    setTimeout(() => {
        plugin.isSaving = false;
    }, 100);
}

/**
 * Set up settings watcher to detect external changes (e.g., from sync)
 * Uses Obsidian's onExternalSettingsChange API if available (Obsidian 1.6.0+)
 * @param {Plugin} plugin - The plugin instance
 */
function setupSettingsWatcher(plugin) {
    // Track if we're currently saving to prevent reload loops
    plugin.isSaving = false;

    // Check if onExternalSettingsChange API is available (Obsidian 1.6.0+)
    if (typeof plugin.onExternalSettingsChange === 'function') {
        // Use Obsidian's API to detect external settings changes
        plugin.onExternalSettingsChange(async () => {
            if (plugin.isSaving) {
                // Skip reload if we're currently saving
                return;
            }

            try {
                console.log('Auto Keyword Linker: Settings changed externally, reloading...');

                // Load the current data from disk
                const diskData = await plugin.loadData();

                // Update our settings
                plugin.settings = Object.assign({}, DEFAULT_SETTINGS, diskData);

                // Ensure statistics object exists
                if (!plugin.settings.statistics) {
                    plugin.settings.statistics = DEFAULT_SETTINGS.statistics;
                }

                // Ensure customStopWords exists and is an array
                if (!plugin.settings.customStopWords || !Array.isArray(plugin.settings.customStopWords)) {
                    plugin.settings.customStopWords = DEFAULT_SETTINGS.customStopWords;
                }

                // Ensure enableTags, linkScope, useRelativeLinks, and blockRef fields exist for all keywords
                if (plugin.settings.keywords) {
                    for (let keyword of plugin.settings.keywords) {
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

                // Settings synced silently in background
                // UI will update next time settings are opened
            } catch (error) {
                // Ignore errors - file might be temporarily unavailable during sync
                console.log('Auto Keyword Linker: Error checking for settings changes:', error);
            }
        });
    } else {
        // Fallback: API not available in this Obsidian version
        // Settings sync will not work automatically - user must reload plugin manually
        console.log('Auto Keyword Linker: onExternalSettingsChange API not available (requires Obsidian 1.6.0+)');
    }
}

module.exports = {
    loadSettings,
    saveSettings,
    setupSettingsWatcher
};
