/**
 * Tag management utilities for adding tags to files
 * Extracted from main-source.js (Session 3)
 */

const { MarkdownView } = require('obsidian');

/**
 * Sanitize keyword into a valid tag name
 * Converts spaces to hyphens and removes invalid characters
 * @param {string} keyword - The keyword to convert
 * @returns {string} Sanitized tag name
 */
function sanitizeTagName(keyword) {
    return keyword
        .replace(/\s+/g, '-')  // Replace spaces with hyphens
        .replace(/[^\w\-]/g, '') // Remove invalid characters
        .toLowerCase();
}

/**
 * Add tags to the end of content
 * @param {string} content - The file content
 * @param {Array} tags - Array of tag names (without #)
 * @returns {string} Content with tags added
 */
function addTagsToContent(content, tags) {
    // Check which tags already exist at the end of the document
    const existingTagsMatch = content.match(/\n\n((?:#[\w\-]+\s*)+)$/);
    const existingTags = existingTagsMatch ?
        existingTagsMatch[1].match(/#[\w\-]+/g).map(t => t.substring(1)) :
        [];

    // Filter out tags that already exist
    const newTags = tags.filter(tag => !existingTags.includes(tag));

    if (newTags.length === 0) {
        return content; // No new tags to add
    }

    // Format tags with #
    const tagString = newTags.map(tag => `#${tag}`).join(' ');

    // Add tags to the end
    if (existingTags.length > 0) {
        // Append to existing tags
        content = content.replace(/\n\n((?:#[\w\-]+\s*)+)$/, `\n\n$1 ${tagString}`);
    } else {
        // Add new tag section
        content = content.trimEnd() + `\n\n${tagString}`;
    }

    return content;
}

/**
 * Add a tag to a target note
 * @param {Object} app - Obsidian app instance
 * @param {string} noteName - Name of the target note
 * @param {string} tagName - Tag to add (without #)
 */
async function addTagToTargetNote(app, noteName, tagName) {
    // Find the target note
    const files = app.vault.getMarkdownFiles();
    const targetFile = files.find(f => f.basename === noteName);

    if (!targetFile) {
        return; // Note doesn't exist
    }

    // Use vault.process to atomically check and add the tag
    await app.vault.process(targetFile, (content) => {
        // Check if tag already exists anywhere in the file
        const tagRegex = new RegExp(`#${tagName}\\b`);
        if (tagRegex.test(content)) {
            return content; // Tag already exists, return unchanged
        }

        // Add the tag to the end
        return addTagsToContent(content, [tagName]);
    });
}

/**
 * Add tags to a file (either open in editor or closed)
 * @param {Object} app - Obsidian app instance
 * @param {TFile} file - The file to add tags to
 * @param {Array} tagsToAdd - Array of tag names to add to the current file
 * @param {Map} targetNotesForTags - Map of target note names to tag names
 */
async function addTagsToFile(app, file, tagsToAdd, targetNotesForTags) {
    // Add tags to the current file
    if (tagsToAdd && tagsToAdd.length > 0) {
        // Check if this file is currently open in an editor
        const activeView = app.workspace.getActiveViewOfType(MarkdownView);
        const isActiveFile = activeView && activeView.file.path === file.path;
        const editor = isActiveFile ? activeView.editor : null;

        if (editor) {
            // Use editor to avoid "modified externally" warning
            // Read current editor content (which may have changed since we queued tags)
            const currentContent = editor.getValue();

            // Check if tags already exist in the current content
            const tagsAlreadyExist = tagsToAdd.every(tag => {
                const tagRegex = new RegExp(`#${tag}\\b`);
                return tagRegex.test(currentContent);
            });

            if (tagsAlreadyExist) {
                // Tags already present, nothing to do
                return;
            }

            // Determine what to append
            const existingTagsMatch = currentContent.match(/\n\n((?:#[\w\-]+\s*)+)$/);
            const existingTags = existingTagsMatch ?
                existingTagsMatch[1].match(/#[\w\-]+/g).map(t => t.substring(1)) :
                [];

            // Filter out tags that already exist
            const newTags = tagsToAdd.filter(tag => !existingTags.includes(tag));

            if (newTags.length === 0) {
                return; // No new tags to add
            }

            // Format tags with #
            const tagString = newTags.map(tag => `#${tag}`).join(' ');

            // Use replaceRange to append tags at the end (safer than setValue)
            const lastLine = editor.lastLine();
            const lastLineLength = editor.getLine(lastLine).length;

            if (existingTags.length > 0) {
                // Find the existing tag line by searching from the end
                for (let i = lastLine; i >= Math.max(0, lastLine - 10); i--) {
                    const lineContent = editor.getLine(i);
                    if (lineContent.trim().match(/^#[\w\-]+(\s+#[\w\-]+)*$/)) {
                        // Found existing tag line, append to it
                        editor.replaceRange(` ${tagString}`, { line: i, ch: lineContent.length });
                        break;
                    }
                }
            } else {
                // Add new tag section at the end
                editor.replaceRange(`\n\n${tagString}`, { line: lastLine, ch: lastLineLength });
            }
        } else {
            // File not open, use vault.process
            await app.vault.process(file, (content) => {
                return addTagsToContent(content, tagsToAdd);
            });
        }
    }

    // Add tags to target notes
    if (targetNotesForTags && targetNotesForTags.size > 0) {
        for (const [targetNoteName, tagName] of targetNotesForTags) {
            await addTagToTargetNote(app, targetNoteName, tagName);
        }
    }
}

module.exports = {
    sanitizeTagName,
    addTagsToContent,
    addTagToTargetNote,
    addTagsToFile
};
