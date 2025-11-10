/**
 * Settings management for Auto Keyword Linker plugin
 * Extracted from main.js during refactoring Session 1
 */

import type { Plugin } from 'obsidian';
import type { AutoKeywordLinkerSettings } from './types';
import { DEFAULT_SETTINGS } from './utils/constants';
import { generateId } from './utils/helpers';

/**
 * Load plugin settings from disk
 * Handles migrations for new settings fields
 */
export async function loadSettings(plugin: Plugin): Promise<AutoKeywordLinkerSettings> {
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
 */
export async function saveSettings(plugin: any, settings: AutoKeywordLinkerSettings): Promise<void> {
    plugin.isSaving = true;
    await plugin.saveData(settings);
    // Reset flag after a short delay to ensure the modify event has been processed
    setTimeout(() => {
        plugin.isSaving = false;
    }, 100);
}

/**
 * Set up settings watcher to detect external changes (e.g., from sync)
 * Uses polling since vault events don't fire for .obsidian files
 */
export function setupSettingsWatcher(plugin: any): void {
    // Track if we're currently saving to prevent reload loops
    plugin.isSaving = false;

    // Use polling to check for settings changes since vault events don't fire for .obsidian files
    // Store the last known state of the settings
    let lastSettingsHash = JSON.stringify(plugin.settings.keywords);

    // Check for changes every 15 seconds
    plugin.registerInterval(
        window.setInterval(async () => {
            if (plugin.isSaving) {
                // Skip check if we're currently saving
                return;
            }

            try {
                // Load the current data from disk
                const diskData = await plugin.loadData();

                if (diskData && diskData.keywords) {
                    const currentHash = JSON.stringify(diskData.keywords);

                    // Compare with our last known state
                    if (currentHash !== lastSettingsHash) {
                        console.log('Auto Keyword Linker: Settings changed externally, reloading...');

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
