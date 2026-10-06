/**
 * Keyword co-occurrence utilities for Auto Keyword Linker plugin
 * Finds keyword targets that keep appearing together in notes (same paragraph or same note),
 * and keeps an auto-updated "Related" block of links in opted-in target notes.
 */

const { findTargetFile } = require('./noteManagement');
const { getEffectiveKeywordSettings } = require('./linking');

const RELATED_START = '<!-- akl-related:start -->';
const RELATED_END = '<!-- akl-related:end -->';

// Scoring weights
const WEIGHT_SAME_PARAGRAPH = 1;   // both linked in the same paragraph or list item
const WEIGHT_SAME_NOTE = 0.3;      // both linked in the note, but not near each other

/**
 * Find the related block in note content
 * @param {string} content - Note content
 * @returns {Object|null} { start, end } offsets of the whole block (markers included), or null
 */
function findRelatedBlock(content) {
    const start = content.indexOf(RELATED_START);
    if (start === -1) return null;
    const endMarker = content.indexOf(RELATED_END, start);
    if (endMarker === -1) return null;
    return { start, end: endMarker + RELATED_END.length };
}

/**
 * Key for an unordered pair of note paths
 * @param {string} a - First path
 * @param {string} b - Second path
 * @returns {string} Pair key
 */
function pairKey(a, b) {
    return a < b ? `${a}\n${b}` : `${b}\n${a}`;
}

/**
 * Check whether a pair is in a stored list of pairs (dismissed or pinned)
 * @param {Array<Array<string>>} list - Stored [pathA, pathB] pairs
 * @param {string} a - First path
 * @param {string} b - Second path
 * @returns {boolean} True if present
 */
function pairInList(list, a, b) {
    const key = pairKey(a, b);
    return (list || []).some(p => Array.isArray(p) && pairKey(p[0], p[1]) === key);
}

/**
 * Get every keyword target note that exists in the vault
 * @param {Object} app - Obsidian app instance
 * @param {Object} settings - Plugin settings
 * @returns {Map} path → { file, optedIn } (optedIn: a keyword targeting it has "Related section" on)
 */
function getTargetNotes(app, settings) {
    const targets = new Map();
    for (const kw of settings.keywords) {
        if (!kw.keyword || !kw.target || !kw.target.trim()) continue;
        const file = findTargetFile(app, kw.target);
        if (!file) continue;
        const optedIn = !!getEffectiveKeywordSettings(settings, kw).relatedSection;
        const existing = targets.get(file.path);
        targets.set(file.path, { file, optedIn: optedIn || (existing ? existing.optedIn : false) });
    }
    return targets;
}

/**
 * Work out which "unit" (top-level list item, or else section/paragraph) a position is in
 * @param {Object} cache - Obsidian metadata cache entry
 * @param {Map} itemsByLine - line → list item, from cache.listItems
 * @param {number} offset - Position in the note
 * @returns {string} Unit ID
 */
function getUnitAt(cache, itemsByLine, offset) {
    // List items: a nested bullet belongs with its top-level item
    let item = (cache.listItems || []).find(li => offset >= li.position.start.offset && offset <= li.position.end.offset);
    if (item) {
        while (item.parent >= 0 && itemsByLine.has(item.parent)) {
            item = itemsByLine.get(item.parent);
        }
        return `li:${item.position.start.line}`;
    }
    const section = (cache.sections || []).find(s => offset >= s.position.start.offset && offset <= s.position.end.offset);
    return section ? `sec:${section.position.start.offset}` : 'note';
}

/**
 * Scan the vault for keyword targets linked together
 * Uses the metadata cache for links and paragraphs; reads only target notes (to find their related blocks).
 * Links inside related blocks are ignored, so the blocks never feed their own results.
 * @param {Object} app - Obsidian app instance
 * @param {Object} settings - Plugin settings
 * @returns {Promise<Object>} { targets, pairs, bodyLinks, relatedLinks }
 *   pairs: Array of { a, b, score, notes, sameParagraph, strength, linked, inRelated, files }
 */
async function analyzeCooccurrence(app, settings) {
    const targets = getTargetNotes(app, settings);
    const pairs = new Map();          // pair key → pair
    const docFreq = new Map();        // target path → number of notes linking it
    const bodyLinks = new Map();      // target path → Set of target paths it links (outside its related block)
    const relatedLinks = new Map();   // target path → Set of target paths in its related block

    for (const file of app.vault.getMarkdownFiles()) {
        const cache = app.metadataCache.getFileCache(file);
        if (!cache || !cache.links || cache.links.length === 0) continue;

        // Target notes may hold a related block - find it so its links can be left out
        let block = null;
        if (targets.has(file.path)) {
            try {
                block = findRelatedBlock(await app.vault.cachedRead(file));
            } catch (error) {
                // Unreadable right now - treat as having no block
            }
        }

        const itemsByLine = new Map((cache.listItems || []).map(li => [li.position.start.line, li]));
        const found = new Map(); // target path → Set of unit IDs
        for (const link of cache.links) {
            const dest = app.metadataCache.getFirstLinkpathDest(link.link.split('#')[0], file.path);
            if (!dest || dest.path === file.path || !targets.has(dest.path)) continue;

            const offset = link.position.start.offset;
            if (block && offset >= block.start && offset < block.end) {
                if (!relatedLinks.has(file.path)) relatedLinks.set(file.path, new Set());
                relatedLinks.get(file.path).add(dest.path);
                continue;
            }

            if (!found.has(dest.path)) found.set(dest.path, new Set());
            found.get(dest.path).add(getUnitAt(cache, itemsByLine, offset));
        }

        if (targets.has(file.path)) {
            bodyLinks.set(file.path, new Set(found.keys()));
        }
        for (const path of found.keys()) {
            docFreq.set(path, (docFreq.get(path) || 0) + 1);
        }

        const linked = Array.from(found.keys());
        if (linked.length < 2) continue;

        // Hub notes (dailies, indexes) that link many targets count for less
        const hubFactor = 1 / Math.max(1, Math.log2(linked.length));

        for (let i = 0; i < linked.length; i++) {
            for (let j = i + 1; j < linked.length; j++) {
                const a = linked[i];
                const b = linked[j];
                const unitsA = found.get(a);
                const sameParagraph = Array.from(found.get(b)).some(u => unitsA.has(u));

                const key = pairKey(a, b);
                if (!pairs.has(key)) {
                    const [first, second] = a < b ? [a, b] : [b, a];
                    pairs.set(key, { a: first, b: second, score: 0, notes: 0, sameParagraph: 0, files: [] });
                }
                const pair = pairs.get(key);
                pair.score += (sameParagraph ? WEIGHT_SAME_PARAGRAPH : WEIGHT_SAME_NOTE) * hubFactor;
                pair.notes += 1;
                if (sameParagraph) pair.sameParagraph += 1;
                pair.files.push(file.path);
            }
        }
    }

    // Strength: how much of the rarer target's appearances are shared with the other,
    // so two popular notes overlapping by chance don't outrank a tight pairing
    const result = Array.from(pairs.values()).map(pair => {
        const smaller = Math.min(docFreq.get(pair.a) || 1, docFreq.get(pair.b) || 1);
        const has = (map, from, to) => map.has(from) && map.get(from).has(to);
        return {
            ...pair,
            strength: pair.score / smaller,
            linked: has(bodyLinks, pair.a, pair.b) || has(bodyLinks, pair.b, pair.a),
            inRelated: has(relatedLinks, pair.a, pair.b) || has(relatedLinks, pair.b, pair.a)
        };
    });
    result.sort((x, y) => y.strength - x.strength || y.score - x.score);

    return { targets, pairs: result, bodyLinks, relatedLinks };
}

/**
 * Decide which notes each target's related block should list
 * Opted-in targets get their strongest partners (at least relatedMinNotes notes together,
 * not dismissed, not already linked from the note's own text); pinned pairs are always included.
 * @param {Object} settings - Plugin settings
 * @param {Object} analysis - From analyzeCooccurrence()
 * @returns {Map} target path → Array of target paths to list (sorted for stable output)
 */
function planRelatedLists(settings, analysis) {
    const minNotes = settings.relatedMinNotes || 3;
    const maxEntries = settings.relatedMaxEntries || 8;
    const plan = new Map();

    // Opted-in targets: strongest qualifying partners
    for (const [path, info] of analysis.targets) {
        if (!info.optedIn) continue;
        const ownLinks = analysis.bodyLinks.get(path) || new Set();
        const partners = analysis.pairs
            .filter(p => (p.a === path || p.b === path) && p.notes >= minNotes)
            .map(p => (p.a === path ? p.b : p.a))
            .filter(other => !ownLinks.has(other) && !pairInList(settings.relatedDismissed, path, other))
            .slice(0, maxEntries);
        plan.set(path, partners);
    }

    // Pinned pairs (from the report's Link button) are listed on both notes, opted in or not
    for (const pin of settings.relatedPins || []) {
        if (!Array.isArray(pin)) continue;
        const [a, b] = pin;
        if (!analysis.targets.has(a) || !analysis.targets.has(b)) continue;
        for (const [from, to] of [[a, b], [b, a]]) {
            if (!plan.has(from)) plan.set(from, []);
            if (!plan.get(from).includes(to)) plan.get(from).push(to);
        }
    }

    // Alphabetical, so a note is only rewritten when its list actually changes
    for (const [path, list] of plan) {
        plan.set(path, list.slice().sort((x, y) => x.localeCompare(y)));
    }
    return plan;
}

/**
 * Build the related block text
 * @param {string} heading - Heading line (e.g. "## Related"), or empty for none
 * @param {Array<string>} links - Link texts, already formatted as [[...]]
 * @returns {string} Block text, markers included
 */
function buildRelatedBlock(heading, links) {
    const lines = [RELATED_START];
    if (heading && heading.trim()) lines.push(heading.trim());
    links.forEach(link => lines.push(`- ${link}`));
    lines.push(RELATED_END);
    return lines.join('\n');
}

/**
 * Put a related block into note content, replacing any existing one.
 * Only the text between (and including) the markers is changed; a new block goes at the end,
 * before the plugin's trailing tag line if there is one. An empty list removes the block.
 * @param {string} content - Note content
 * @param {string|null} blockText - From buildRelatedBlock(), or null to remove the block
 * @returns {string} Updated content
 */
function setRelatedBlock(content, blockText) {
    const existing = findRelatedBlock(content);

    if (existing) {
        if (blockText) {
            return content.slice(0, existing.start) + blockText + content.slice(existing.end);
        }
        // Remove the block and the blank line(s) it leaves behind
        const before = content.slice(0, existing.start).replace(/\n+$/, '');
        const after = content.slice(existing.end).replace(/^\n+/, '');
        if (!before) return after;
        return after ? `${before}\n\n${after}` : `${before}\n`;
    }

    if (!blockText) return content;

    // Keep the plugin's trailing tag line last
    const tagLine = content.match(/\n\n((?:#[\w\-]+\s*)+)$/);
    if (tagLine) {
        const body = content.slice(0, tagLine.index).replace(/\s+$/, '');
        return `${body ? `${body}\n\n` : ''}${blockText}\n\n${tagLine[1]}`;
    }
    const body = content.replace(/\s+$/, '');
    return body ? `${body}\n\n${blockText}\n` : `${blockText}\n`;
}

/**
 * Work out every note whose related block would change
 * @param {Object} app - Obsidian app instance
 * @param {Object} settings - Plugin settings
 * @param {Object} analysis - From analyzeCooccurrence()
 * @param {Map} [plan] - From planRelatedLists(), built if not given
 * @returns {Promise<Array<Object>>} { file, oldBlock, newBlock, newContent } for each note that changes
 */
async function planRelatedUpdates(app, settings, analysis, plan = null) {
    plan = plan || planRelatedLists(settings, analysis);
    const heading = settings.relatedHeading === undefined ? '## Related' : settings.relatedHeading;
    const updates = [];

    // Every target note: those in the plan get their block written, and any others that still
    // have a block (opted out, everything dismissed) get it removed
    for (const [path, info] of analysis.targets) {
        const content = await app.vault.cachedRead(info.file);
        const existing = findRelatedBlock(content);
        const list = plan.get(path) || [];
        if (!existing && list.length === 0) continue;

        const links = list
            .map(p => analysis.targets.get(p))
            .filter(Boolean)
            .map(t => `[[${app.metadataCache.fileToLinktext(t.file, path, true)}]]`);
        const newBlock = links.length > 0 ? buildRelatedBlock(heading, links) : null;
        const oldBlock = existing ? content.slice(existing.start, existing.end) : null;
        if (oldBlock === newBlock) continue;

        updates.push({ file: info.file, oldBlock, newBlock, newContent: setRelatedBlock(content, newBlock) });
    }

    updates.sort((x, y) => x.file.path.localeCompare(y.file.path));
    return updates;
}

/**
 * Write planned related blocks to their notes
 * Each note's block is rebuilt from its current content at write time, so edits made
 * since the preview are kept.
 * @param {Object} app - Obsidian app instance
 * @param {Array<Object>} updates - From planRelatedUpdates()
 * @returns {Promise<number>} Number of notes changed
 */
async function applyRelatedUpdates(app, updates) {
    let changed = 0;
    for (const update of updates) {
        await app.vault.process(update.file, (content) => {
            const next = setRelatedBlock(content, update.newBlock);
            if (next !== content) changed++;
            return next;
        });
    }
    return changed;
}

module.exports = {
    RELATED_START,
    RELATED_END,
    findRelatedBlock,
    pairInList,
    analyzeCooccurrence,
    planRelatedLists,
    buildRelatedBlock,
    setRelatedBlock,
    planRelatedUpdates,
    applyRelatedUpdates
};
