/**
 * Per-note ignore list utilities
 * Lets a note opt out of specific keywords (or all linking) via frontmatter:
 *
 *   akl-ignore: [Goblin King, dragon]   (target notes or keyword text)
 *   akl-ignore: all                       (no keyword linking in this note)
 *
 * Parsed straight from the content (not the metadata cache) so auto-link on save
 * sees the latest edit immediately.
 */

const { getFrontmatterBounds } = require('./detection');

const IGNORE_KEY = 'akl-ignore';

/**
 * Strip surrounding quotes from a YAML scalar
 * @param {string} value - Raw value
 * @returns {string} Unquoted, trimmed value
 */
function unquote(value) {
    const trimmed = value.trim();
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1).trim();
    }
    return trimmed;
}

/**
 * Find the akl-ignore key in the frontmatter
 * @param {string} content - Note content
 * @returns {Object|null} { lines, keyLine, endLine, values } or null if no frontmatter
 *   keyLine is -1 when the key is absent; endLine is the closing --- line index
 */
function findIgnoreKey(content) {
    const bounds = getFrontmatterBounds(content);
    if (!bounds) return null;

    const lines = content.split('\n');
    let endLine = -1;
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '---' || lines[i].trim() === '...') {
            endLine = i;
            break;
        }
    }
    if (endLine === -1) return null;

    const keyPattern = new RegExp(`^${IGNORE_KEY}\\s*:(.*)$`);
    for (let i = 1; i < endLine; i++) {
        const match = lines[i].match(keyPattern);
        if (!match) continue;

        const inline = match[1].trim();
        const values = [];
        let lastLine = i;

        if (inline.startsWith('[')) {
            // Inline list: [a, "b, with comma", c] - split on commas outside quotes
            const items = inline.replace(/^\[|\]$/g, '').match(/"(?:[^"\\]|\\.)*"|'[^']*'|[^,]+/g) || [];
            items.map(v => unquote(v).replace(/\\"/g, '"')).filter(Boolean).forEach(v => values.push(v));
        } else if (inline) {
            // Single scalar: all / Goblin
            values.push(unquote(inline));
        } else {
            // Block list:
            //   - a
            //   - b
            for (let j = i + 1; j < endLine; j++) {
                const item = lines[j].match(/^\s*-\s*(.*)$/);
                if (!item) break;
                const value = unquote(item[1]);
                if (value) values.push(value);
                lastLine = j;
            }
        }

        return { lines, keyLine: i, lastLine, endLine, values };
    }

    return { lines, keyLine: -1, lastLine: -1, endLine, values: [] };
}

/**
 * Read the ignore list from a note
 * @param {string} content - Note content
 * @returns {{all: boolean, entries: Set<string>}} Lowercased entries
 */
function getIgnoreList(content) {
    const found = findIgnoreKey(content);
    const values = found ? found.values : [];
    const entries = new Set();
    for (const value of values) {
        // Store both the full entry and its note name, so "Folder/Note" and "Note" both match
        const lower = value.replace(/\.md$/i, '').toLowerCase();
        entries.add(lower);
        entries.add(lower.split('/').pop());
    }
    return { all: entries.has('all'), entries };
}

/**
 * Check if a target or keyword is ignored in a note
 * @param {{all: boolean, entries: Set<string>}} ignoreList - From getIgnoreList
 * @param {string} text - Target note (name or path) or keyword text
 * @returns {boolean} True if ignored
 */
function isIgnored(ignoreList, text) {
    if (!text) return false;
    if (ignoreList.all) return true;
    const lower = text.replace(/\.md$/i, '').toLowerCase();
    return ignoreList.entries.has(lower) || ignoreList.entries.has(lower.split('/').pop());
}

/**
 * Add an entry to a note's ignore list, creating frontmatter or the key if needed
 * Rewrites the key as an inline list; other frontmatter is left untouched
 * @param {string} content - Note content
 * @param {string} entry - Target note or keyword to ignore
 * @returns {string} Updated content (unchanged if already present)
 */
function addIgnoreEntry(content, entry) {
    const quote = (v) => /[,\[\]:#"']/.test(v) || v !== v.trim() ? `"${v.replace(/"/g, '\\"')}"` : v;
    const found = findIgnoreKey(content);

    // No frontmatter yet - create it
    if (!found) {
        return `---\n${IGNORE_KEY}: [${quote(entry)}]\n---\n${content}`;
    }

    const { lines, keyLine, lastLine, endLine, values } = found;
    if (values.some(v => v.toLowerCase() === entry.toLowerCase())) {
        return content;
    }

    const newLine = `${IGNORE_KEY}: [${[...values, entry].map(quote).join(', ')}]`;
    if (keyLine === -1) {
        lines.splice(endLine, 0, newLine);
    } else {
        lines.splice(keyLine, lastLine - keyLine + 1, newLine);
    }
    return lines.join('\n');
}

module.exports = {
    IGNORE_KEY,
    getIgnoreList,
    isIgnored,
    addIgnoreEntry
};
