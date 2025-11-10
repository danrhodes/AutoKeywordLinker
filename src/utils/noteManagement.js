/**
 * Note management utilities for Auto Keyword Linker plugin
 * Extracted from main.js during refactoring Session 2
 */

/**
 * Get aliases from a note's YAML frontmatter
 * @param {Object} app - Obsidian app instance
 * @param {string} noteName - Name of the note (with or without .md extension)
 * @returns {Array<string>} Array of aliases, or empty array if none found
 */
function getAliasesForNote(app, noteName) {
    try {
        // Find the file - try with and without .md extension
        const files = app.vault.getMarkdownFiles();
        let targetFile = null;

        // Remove .md extension if present for comparison
        const noteBasename = noteName.endsWith('.md') ? noteName.slice(0, -3) : noteName;

        for (let file of files) {
            // Check if basename matches (case-insensitive for better matching)
            if (file.basename.toLowerCase() === noteBasename.toLowerCase()) {
                targetFile = file;
                break;
            }
            // Also check full path without extension (for notes in folders)
            const pathWithoutExt = file.path.endsWith('.md') ? file.path.slice(0, -3) : file.path;
            if (pathWithoutExt.toLowerCase() === noteBasename.toLowerCase()) {
                targetFile = file;
                break;
            }
        }

        // If file not found, return empty array
        if (!targetFile) {
            return [];
        }

        // Use Obsidian's metadataCache to get frontmatter (much faster than reading file)
        const cache = app.metadataCache.getFileCache(targetFile);
        if (!cache || !cache.frontmatter) {
            return [];
        }

        // Extract aliases - could be 'aliases' or 'alias', could be array or string
        const frontmatter = cache.frontmatter;
        let aliases = [];

        // Check for 'aliases' field (most common)
        if (frontmatter.aliases) {
            if (Array.isArray(frontmatter.aliases)) {
                aliases = aliases.concat(frontmatter.aliases);
            } else if (typeof frontmatter.aliases === 'string') {
                aliases.push(frontmatter.aliases);
            }
        }

        // Also check for 'alias' field (singular)
        if (frontmatter.alias) {
            if (Array.isArray(frontmatter.alias)) {
                aliases = aliases.concat(frontmatter.alias);
            } else if (typeof frontmatter.alias === 'string') {
                aliases.push(frontmatter.alias);
            }
        }

        // Filter out empty strings and return
        return aliases.filter(a => a && typeof a === 'string' && a.trim());
    } catch (error) {
        console.error('Error getting aliases for note:', noteName, error);
        return [];
    }
}

/**
 * Check if a note has a required tag (in frontmatter or inline)
 * @param {Object} app - Obsidian app instance
 * @param {string} noteName - Name of the note (with or without .md extension)
 * @param {string} requiredTag - The tag to check for (without # prefix)
 * @returns {boolean} True if note has the tag, false otherwise
 */
function noteHasTag(app, noteName, requiredTag) {
    try {
        // If no tag required, return true (no restriction)
        if (!requiredTag || requiredTag.trim() === '') {
            return true;
        }

        // Normalize the required tag (remove # if present)
        const normalizedTag = requiredTag.trim().replace(/^#/, '').toLowerCase();

        // Find the file - try with and without .md extension
        let targetFile = null;
        const files = app.vault.getMarkdownFiles();
        const noteBasename = noteName.replace(/\.md$/, '');

        for (let file of files) {
            // Check if basename matches (case-insensitive for better matching)
            if (file.basename.toLowerCase() === noteBasename.toLowerCase()) {
                targetFile = file;
                break;
            }
            // Also check full path without extension (for notes in folders)
            const pathWithoutExt = file.path.endsWith('.md') ? file.path.slice(0, -3) : file.path;
            if (pathWithoutExt.toLowerCase() === noteBasename.toLowerCase()) {
                targetFile = file;
                break;
            }
        }

        // If file not found, return false (can't verify tag)
        if (!targetFile) {
            return false;
        }

        // Use Obsidian's metadataCache to get tags
        const cache = app.metadataCache.getFileCache(targetFile);
        if (!cache) {
            return false;
        }

        // Check frontmatter tags
        if (cache.frontmatter) {
            const frontmatter = cache.frontmatter;
            let frontmatterTags = [];

            // Check for 'tags' field (most common)
            if (frontmatter.tags) {
                if (Array.isArray(frontmatter.tags)) {
                    frontmatterTags = frontmatter.tags;
                } else if (typeof frontmatter.tags === 'string') {
                    frontmatterTags = [frontmatter.tags];
                }
            }

            // Check for 'tag' field (singular)
            if (frontmatter.tag) {
                if (Array.isArray(frontmatter.tag)) {
                    frontmatterTags = frontmatterTags.concat(frontmatter.tag);
                } else if (typeof frontmatter.tag === 'string') {
                    frontmatterTags.push(frontmatter.tag);
                }
            }

            // Normalize and check frontmatter tags
            for (let tag of frontmatterTags) {
                if (typeof tag === 'string') {
                    const normalized = tag.replace(/^#/, '').toLowerCase();
                    if (normalized === normalizedTag) {
                        return true;
                    }
                }
            }
        }

        // Check inline tags (from metadataCache)
        if (cache.tags) {
            for (let tagInfo of cache.tags) {
                // tagInfo.tag includes the # prefix
                const normalized = tagInfo.tag.replace(/^#/, '').toLowerCase();
                if (normalized === normalizedTag) {
                    return true;
                }
            }
        }

        // Tag not found
        return false;
    } catch (error) {
        console.error('Error checking tag for note:', noteName, error);
        return false;
    }
}

/**
 * Check if a note has an existing link to a target note
 * @param {Object} app - Obsidian app instance
 * @param {TFile} sourceFile - The source file to check
 * @param {string} targetNoteName - The target note name to look for links to
 * @returns {boolean} True if the source note has at least one link to the target note
 */
function noteHasLinkToTarget(app, sourceFile, targetNoteName) {
    try {
        // If no file provided, return false
        if (!sourceFile) {
            return false;
        }

        // Use Obsidian's metadataCache to get all links from the source file
        const cache = app.metadataCache.getFileCache(sourceFile);
        if (!cache || !cache.links || cache.links.length === 0) {
            return false;
        }

        // Normalize target note name (remove .md extension if present)
        const normalizedTarget = targetNoteName.replace(/\.md$/, '').toLowerCase();

        // Check each link in the source file
        for (let link of cache.links) {
            // link.link is the raw link destination (e.g., "Languages/Python" or "Python")
            const linkDest = link.link.toLowerCase();

            // Direct match
            if (linkDest === normalizedTarget) {
                return true;
            }

            // Check if link destination ends with the target (handles paths)
            // e.g., link: "Languages/Python" matches target: "Python"
            if (linkDest.endsWith('/' + normalizedTarget)) {
                return true;
            }

            // Check if target ends with the link (handles partial paths)
            // e.g., link: "Python" matches target: "Languages/Python"
            if (normalizedTarget.endsWith('/' + linkDest)) {
                return true;
            }

            // Try to resolve the link to an actual file and compare basenames
            const linkedFile = app.metadataCache.getFirstLinkpathDest(link.link, sourceFile.path);
            if (linkedFile) {
                const linkedBasename = linkedFile.basename.toLowerCase();
                const targetBasename = normalizedTarget.split('/').pop();

                if (linkedBasename === targetBasename) {
                    return true;
                }
            }
        }

        // No matching link found
        return false;
    } catch (error) {
        console.error('Error checking links in note:', sourceFile.path, error);
        return false;
    }
}

/**
 * Ensure a note exists, creating it if necessary
 * @param {Object} app - Obsidian app instance
 * @param {Object} settings - Plugin settings
 * @param {string} noteName - Name of the note to ensure exists
 */
async function ensureNoteExists(app, settings, noteName) {
    // FIXED: Search for existing note anywhere in vault first
    const existingFiles = app.vault.getMarkdownFiles();
    const existingFile = existingFiles.find(f => f.basename === noteName);

    // If file exists anywhere, we're done
    if (existingFile) {
        return;
    }

    // File doesn't exist, so create it in the specified folder
    const folder = settings.newNoteFolder || '';
    const path = folder ? `${folder}/${noteName}.md` : `${noteName}.md`;

    // Start with the template
    let content = settings.newNoteTemplate;

    // Replace template placeholders
    content = content.replace(/{{keyword}}/g, noteName);  // Replace {{keyword}} with note name
    content = content.replace(/{{date}}/g, new Date().toISOString().split('T')[0]);  // Replace {{date}} with today's date

    // Ensure the folder exists before creating the file
    if (folder) {
        const folderExists = app.vault.getAbstractFileByPath(folder);
        if (!folderExists) {
            await app.vault.createFolder(folder);
        }
    }

    // Create the new note
    await app.vault.create(path, content);
}

/**
 * Find a target file by name
 * @param {Object} app - Obsidian app instance
 * @param {string} noteName - Name of the note (with or without .md extension)
 * @returns {TFile|null} The file object or null if not found
 */
function findTargetFile(app, noteName) {
    const files = app.vault.getMarkdownFiles();
    const noteBasename = noteName.endsWith('.md') ? noteName.slice(0, -3) : noteName;

    for (let file of files) {
        // Check if basename matches
        if (file.basename.toLowerCase() === noteBasename.toLowerCase()) {
            return file;
        }
        // Also check full path without extension (for notes in folders)
        const pathWithoutExt = file.path.endsWith('.md') ? file.path.slice(0, -3) : file.path;
        if (pathWithoutExt.toLowerCase() === noteBasename.toLowerCase()) {
            return file;
        }
    }
    return null;
}

module.exports = {
    getAliasesForNote,
    noteHasTag,
    noteHasLinkToTarget,
    ensureNoteExists,
    findTargetFile
};
