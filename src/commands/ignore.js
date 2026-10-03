/**
 * "Don't link here" command
 * Unlinks the keyword link at the cursor and adds its target to the note's
 * akl-ignore frontmatter list, so auto-link won't recreate it.
 */

const { Notice } = require('obsidian');
const { addIgnoreEntry } = require('../utils/ignore');
const { buildKeywordMap } = require('../utils/linking');

/**
 * Find a link (wikilink, markdown link or suggestion span) on a line that contains a cursor column
 * @param {string} line - Line text
 * @param {number} ch - Cursor column
 * @returns {Object|null} { start, end, target, display } or null
 */
function findLinkAtCursor(line, ch) {
    const finders = [
        {
            pattern: /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\\?\|([^\]]+))?\]\]/g,
            read: m => ({ target: m[1].trim(), display: m[2] || m[1].trim().split('/').pop() })
        },
        {
            pattern: /\[([^\]]+)\]\(([^)\s]+)\)/g,
            read: m => {
                if (m[2].includes('://')) return null; // external URL, not a note link
                let target = m[2].replace(/#.*$/, '');
                try { target = decodeURIComponent(target); } catch (e) { /* keep raw */ }
                return { target: target.replace(/\.md$/i, ''), display: m[1] };
            }
        },
        {
            pattern: /<span class="akl-suggested-link" data-target="([^"]*)"[^>]*>([^<]+)<\/span>/g,
            read: m => ({ target: m[1].replace(/&quot;/g, '"'), display: m[2] })
        }
    ];

    for (const { pattern, read } of finders) {
        let match;
        while ((match = pattern.exec(line)) !== null) {
            const start = match.index;
            const end = start + match[0].length;
            if (ch < start || ch > end) continue;
            if (start > 0 && line[start - 1] === '!') continue; // embed, not a link
            const info = read(match);
            if (info && info.target) return { start, end, ...info };
        }
    }
    return null;
}

/**
 * Apply a content change as a minimal editor edit (keeps cursor, scroll and undo intact)
 * @param {Editor} editor - Obsidian editor
 * @param {string} before - Current content
 * @param {string} after - New content
 */
function applyMinimalEdit(editor, before, after) {
    let prefix = 0;
    while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) prefix++;
    let suffix = 0;
    while (suffix < before.length - prefix && suffix < after.length - prefix &&
           before[before.length - 1 - suffix] === after[after.length - 1 - suffix]) suffix++;

    editor.replaceRange(
        after.slice(prefix, after.length - suffix),
        editor.offsetToPos(prefix),
        editor.offsetToPos(before.length - suffix)
    );
}

/**
 * Unlink the keyword at the cursor and stop it being linked again in this note
 * @param {Plugin} plugin - Plugin instance
 * @param {Editor} editor - Active editor
 */
function ignoreKeywordAtCursor(plugin, editor) {
    const cursor = editor.getCursor();
    const lineText = editor.getLine(cursor.line);
    const link = findLinkAtCursor(lineText, cursor.ch);

    let target = null;
    let unlinkedText = null;

    if (link) {
        // Replace the link with its plain display text
        editor.replaceRange(link.display, { line: cursor.line, ch: link.start }, { line: cursor.line, ch: link.end });
        target = link.target;
        unlinkedText = link.display;
    } else {
        // No link at the cursor - look up the selected text or word as a keyword
        let text = editor.getSelection().trim();
        if (!text) {
            const range = editor.wordAt(cursor);
            if (range) text = editor.getRange(range.from, range.to).trim();
        }
        if (text) {
            const keywordMap = buildKeywordMap(plugin.app, plugin.settings);
            const key = Object.keys(keywordMap).find(k => k.toLowerCase() === text.toLowerCase());
            if (key) target = keywordMap[key].target;
        }
    }

    if (!target) {
        new Notice('Place the cursor on a keyword link, or select a keyword, to stop it linking in this note');
        return;
    }

    const before = editor.getValue();
    const after = addIgnoreEntry(before, target);
    if (after !== before) {
        applyMinimalEdit(editor, before, after);
    }

    new Notice(unlinkedText
        ? `Unlinked "${unlinkedText}" - "${target}" won't be linked in this note again`
        : `"${target}" won't be linked in this note again`);
}

module.exports = {
    findLinkAtCursor,
    ignoreKeywordAtCursor
};
