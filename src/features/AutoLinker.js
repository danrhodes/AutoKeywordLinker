/**
 * Auto Linker Feature
 * Handles automatic keyword linking on file save
 * Extracted from main-source.js (Session 7)
 */

/**
 * Set up auto-link on save functionality
 * @param {Plugin} plugin - Plugin instance
 */
function setupAutoLinkOnSave(plugin) {
    // Debounce timer for tag additions only
    let tagDebounceTimer = null;
    const pendingTagOperations = new Map(); // file path -> Set of tags
    const processingFiles = new Set(); // Track which files are currently being processed

    plugin.registerEvent(
        // Listen for file modification events
        plugin.app.vault.on('modify', (file) => {
            // CRITICAL: Only process markdown files, skip all attachments
            // Skip if we're currently processing this file to avoid recursion
            if (file.extension === 'md' && !processingFiles.has(file.path)) {
                // Mark this file as being processed
                processingFiles.add(file.path);

                // Link keywords immediately (without adding tags)
                plugin.linkKeywordsInFile(file, false, true).then(result => {
                    // Unmark the file
                    processingFiles.delete(file.path);
                    // If there are tags to add, accumulate them
                    if (result && result.pendingTags) {
                        // Get or create the pending tags entry for this file
                        if (!pendingTagOperations.has(file.path)) {
                            pendingTagOperations.set(file.path, {
                                tagsToAdd: new Set(),
                                targetNotesForTags: new Map()
                            });
                        }

                        const pending = pendingTagOperations.get(file.path);

                        // Accumulate tags (using Set to avoid duplicates)
                        result.pendingTags.tagsToAdd.forEach(tag => pending.tagsToAdd.add(tag));

                        // Accumulate target note tags
                        result.pendingTags.targetNotesForTags.forEach((tagName, noteName) => {
                            pending.targetNotesForTags.set(noteName, tagName);
                        });

                        // Clear existing timer
                        if (tagDebounceTimer) {
                            clearTimeout(tagDebounceTimer);
                        }

                        // Set new timer - add tags after 1 second of inactivity
                        tagDebounceTimer = setTimeout(async () => {
                            try {
                                // Process all pending tag operations
                                for (const [filePath, tagInfo] of pendingTagOperations.entries()) {
                                    const targetFile = plugin.app.vault.getAbstractFileByPath(filePath);
                                    if (targetFile && targetFile.extension === 'md') {
                                        // Mark file as being processed to prevent recursion
                                        processingFiles.add(filePath);

                                        await plugin.addTagsToFile(
                                            targetFile,
                                            Array.from(tagInfo.tagsToAdd),
                                            tagInfo.targetNotesForTags
                                        );

                                        // Unmark after a short delay to ensure modify event is ignored
                                        setTimeout(() => {
                                            processingFiles.delete(filePath);
                                        }, 100);
                                    }
                                }
                            } finally {
                                // Always clear the pending operations and timer
                                pendingTagOperations.clear();
                                tagDebounceTimer = null;
                            }
                        }, 1000); // 1 second delay
                    }
                });
            }
        })
    );
}

module.exports = { setupAutoLinkOnSave };
