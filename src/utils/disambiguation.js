/**
 * Context disambiguation utilities for Auto Keyword Linker plugin
 * When several keywords share the same text (e.g. "Mercury" → planet and "Mercury" → element),
 * score each candidate target against the paragraph and note the match sits in, and pick the best.
 */

const { getAllTags } = require('obsidian');
const { DEFAULT_STOP_WORDS } = require('./constants');
const { findTargetFile } = require('./noteManagement');

const STOP_WORDS = new Set(DEFAULT_STOP_WORDS);

// How many of a target note's most frequent body words feed its profile
// (keeps long notes from matching everything)
const MAX_BODY_TERMS = 150;

// Signal weights
const WEIGHT_HINT_PARAGRAPH = 3;     // a context hint appears in the same paragraph
const WEIGHT_HINT_NOTE = 1;          // a context hint appears elsewhere in the note
const WEIGHT_TERM_PARAGRAPH = 1;     // a word from the target's profile appears in the paragraph
const WEIGHT_TERM_NOTE = 0.25;       // ...or elsewhere in the note
const WEIGHT_LINKS_TARGET = 4;     // the note already links to this target
const WEIGHT_LINKS_NEIGHBOUR = 1.5;  // the note links to a note connected to this target
const MAX_NEIGHBOUR_SCORE = 4.5;
const WEIGHT_SHARED_TAG = 1.5;       // the note shares a tag with the target
const WEIGHT_SAME_FOLDER = 1;        // the note sits in the same folder as the target

// A pick is confident only if the winner clearly beats the runner-up
const MIN_SCORE = 1;
const MIN_MARGIN = 1;
const MIN_RATIO = 1.5;

/**
 * Reduce simple plurals to their singular so "thermometers" matches "thermometer"
 * @param {string} word - Lowercase word
 * @returns {string} Singular form (best effort - only needs to be consistent)
 */
function singular(word) {
    if (word.length <= 3) return word;
    if (word.endsWith('ies') && word.length > 4) return word.slice(0, -3) + 'y';
    if (/(ches|shes|sses|xes|zes)$/.test(word)) return word.slice(0, -2);
    if (word.endsWith('s') && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
    return word;
}

/**
 * Split text into lowercase words worth comparing (3+ characters, not stop words),
 * with plurals reduced to the singular
 * @param {string} text - Text to tokenize
 * @returns {Array<string>} Words
 */
function tokenize(text) {
    const words = (text || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
    return words
        .filter(w => w.length >= 3 && !STOP_WORDS.has(w) && !/^\d+$/.test(w))
        .map(singular);
}

/**
 * Reduce Markdown to its readable text: links become their display text, HTML tags are dropped.
 * Linking a word doesn't change the result, so a decision made before other keywords
 * are linked still holds after.
 * @param {string} text - Markdown text
 * @returns {string} Plain text
 */
function stripMarkup(text) {
    return text
        // [[target|display]] or [[target\|display]] (in tables) → display, [[target]] → target
        .replace(/\[\[([^\]|]*?)(?:\\?\|([^\]]*))?\]\]/g, (m, target, display) => display !== undefined ? display : target)
        // [text](url) and ![alt](url) → text (urls may contain one level of parentheses)
        .replace(/!?\[([^\]]*)\]\((?:[^()]|\([^()]*\))*\)/g, '$1')
        // <span ...>text</span> → text
        .replace(/<[^>]+>/g, '');
}

/**
 * Get the paragraph (text between blank lines) containing a position
 * @param {string} content - Note content
 * @param {number} index - Position in the content
 * @returns {string} The paragraph text
 */
function getParagraphAt(content, index) {
    const before = content.lastIndexOf('\n\n', index);
    const after = content.indexOf('\n\n', index);
    return content.substring(before === -1 ? 0 : before + 2, after === -1 ? content.length : after);
}

/**
 * Check whether a phrase appears in text as whole words (case-insensitive)
 * @param {string} lowerText - Lowercase text to search
 * @param {string} phrase - Phrase to look for
 * @returns {boolean} True if found
 */
function containsPhrase(lowerText, phrase) {
    const p = phrase.trim().toLowerCase();
    if (!p) return false;
    const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Allow a plural ending, so the hint "thermometer" also finds "thermometers"
    return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?:s|es)?(?![\\p{L}\\p{N}])`, 'u').test(lowerText);
}

/**
 * Get a note's tags (frontmatter and inline), lowercase without '#'
 * @param {Object} cache - Obsidian metadata cache entry
 * @returns {Set<string>} Tags
 */
function getTagSet(cache) {
    const tags = cache ? (getAllTags(cache) || []) : [];
    return new Set(tags.map(t => t.replace(/^#/, '').toLowerCase()));
}

/**
 * Get the basenames (lowercase) of every note a file links to, and every note linking to it
 * @param {Object} app - Obsidian app instance
 * @param {string} path - File path
 * @returns {Set<string>} Neighbour basenames
 */
function getNeighbours(app, path) {
    const neighbours = new Set();
    const resolved = app.metadataCache.resolvedLinks || {};
    const addPath = (p) => neighbours.add(p.split('/').pop().replace(/\.md$/, '').toLowerCase());

    Object.keys(resolved[path] || {}).forEach(addPath);
    for (const [source, links] of Object.entries(resolved)) {
        if (links && links[path]) addPath(source);
    }
    return neighbours;
}

/**
 * Pull the profile words out of a target note's body text
 * @param {string} text - Note body
 * @returns {Set<string>} The most frequent words
 */
function getBodyTerms(text) {
    const counts = new Map();
    for (const word of tokenize(stripMarkup(text))) {
        counts.set(word, (counts.get(word) || 0) + 1);
    }
    const top = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_BODY_TERMS)
        .map(([word]) => word);
    return new Set(top);
}

/**
 * Build a description of a target note from its metadata (name, folder, aliases, tags,
 * headings, links, frontmatter), plus its body words if they've been read into bodyCache
 * @param {Object} app - Obsidian app instance
 * @param {Object} entry - Keyword map entry (target, contextHints)
 * @param {Map} bodyCache - path → { mtime, terms } from warmBodyCache()
 * @returns {Object} Profile
 */
function buildTargetProfile(app, entry, bodyCache) {
    const terms = new Set();
    const addText = (text) => tokenize(text).forEach(t => terms.add(t));

    const file = findTargetFile(app, entry.target);
    // The target name always counts, even if the note doesn't exist yet
    addText(entry.target.replace(/\//g, ' '));

    let tags = new Set();
    let neighbours = new Set();
    let folder = null;

    if (file) {
        folder = file.parent ? file.parent.path : '';
        addText(file.path.replace(/\.md$/, '').replace(/\//g, ' '));

        const cache = app.metadataCache.getFileCache(file);
        if (cache) {
            tags = getTagSet(cache);
            tags.forEach(tag => addText(tag.replace(/[/_-]/g, ' ')));
            (cache.headings || []).forEach(h => addText(h.heading));
            (cache.links || []).forEach(l => addText(`${l.link} ${l.displayText || ''}`));

            if (cache.frontmatter) {
                for (const [key, value] of Object.entries(cache.frontmatter)) {
                    if (key === 'position') continue;
                    const values = Array.isArray(value) ? value : [value];
                    values.filter(v => typeof v === 'string').forEach(addText);
                }
            }
        }

        neighbours = getNeighbours(app, file.path);

        const cached = bodyCache && bodyCache.get(file.path);
        if (cached && cached.mtime === file.stat.mtime) {
            cached.terms.forEach(t => terms.add(t));
        }
    }

    const hints = (entry.contextHints || []).map(h => h.trim()).filter(Boolean);

    return { entry, terms, tags, neighbours, folder, hints };
}

/**
 * Read the body text of target notes into a cache, so their profiles include body words.
 * Profiles work from metadata alone if this hasn't run; it only adds detail.
 * @param {Object} app - Obsidian app instance
 * @param {Object} keywordMap - Map from buildKeywordMap()
 * @param {Map} bodyCache - path → { mtime, terms }, updated in place
 */
async function warmBodyCache(app, keywordMap, bodyCache) {
    const targets = new Set();
    for (const entry of Object.values(keywordMap)) {
        if (!entry.alternatives || entry.alternatives.length === 0) continue;
        targets.add(entry.target);
        entry.alternatives.forEach(alt => targets.add(alt.target));
    }

    for (const target of targets) {
        const file = findTargetFile(app, target);
        if (!file) continue;
        const cached = bodyCache.get(file.path);
        if (cached && cached.mtime === file.stat.mtime) continue;
        try {
            const text = await app.vault.cachedRead(file);
            bodyCache.set(file.path, { mtime: file.stat.mtime, terms: getBodyTerms(text) });
        } catch (error) {
            // Unreadable right now - the metadata-only profile still works
        }
    }
}

/**
 * Build what we know about the note being linked (computed once per note)
 * @param {Object} app - Obsidian app instance
 * @param {TFile} file - The note being processed
 * @param {string} content - Its content
 * @returns {Object} Note context
 */
function buildNoteContext(app, file, content) {
    const plain = stripMarkup(content);
    const cache = app.metadataCache.getFileCache(file);

    // Each link's note name and the text it shows, so links that merely show the keyword
    // being decided (likely made by an earlier pick) can be left out
    const links = ((cache && cache.links) || []).map(l => {
        const dest = app.metadataCache.getFirstLinkpathDest(l.link.split('#')[0], file.path);
        const name = dest ? dest.basename : l.link.split('#')[0].split('/').pop();
        return { name: name.toLowerCase(), display: (l.displayText || l.link).toLowerCase() };
    });

    return {
        lowerText: plain.toLowerCase(),
        terms: new Set(tokenize(plain)),
        tags: getTagSet(cache),
        links,
        folder: file.parent ? file.parent.path : ''
    };
}

/**
 * Score candidate targets for one keyword match and pick the best
 * @param {Array<Object>} profiles - One profile per eligible candidate (from buildTargetProfile)
 * @param {Object} noteContext - From buildNoteContext()
 * @param {string} paragraph - The paragraph containing the match
 * @param {string} keyword - The matched keyword text (its own words are ignored)
 * @returns {Object} { entry, confident, scores: [{ target, score, reasons }] } - entry is null if nothing scored
 */
function pickTarget(profiles, noteContext, paragraph, keyword) {
    const plainParagraph = stripMarkup(paragraph);
    const lowerParagraph = plainParagraph.toLowerCase();
    const keywordWords = new Set(tokenize(keyword));
    const paragraphTerms = new Set(tokenize(plainParagraph).filter(t => !keywordWords.has(t)));
    const n = profiles.length;

    // Notes this one links to, ignoring links that just show the keyword itself:
    // [[Mercury (planet)|Mercury]] is the question being decided, not evidence for an answer
    const lowerKeyword = keyword.toLowerCase();
    const linked = new Set(noteContext.links.filter(l => l.display !== lowerKeyword).map(l => l.name));

    // A word or neighbour only helps tell candidates apart if not all of them share it
    const termWeight = (term, field) => {
        const k = profiles.filter(p => p[field].has(term)).length;
        return k === 0 || k === n ? 0 : 1 / k;
    };

    const scores = profiles.map(profile => {
        let score = 0;
        const reasons = [];
        const add = (amount, reason) => {
            if (amount <= 0) return;
            score += amount;
            reasons.push(reason);
        };

        // User-supplied context hints
        for (const hint of profile.hints) {
            if (containsPhrase(lowerParagraph, hint)) add(WEIGHT_HINT_PARAGRAPH, `hint "${hint}"`);
            else if (containsPhrase(noteContext.lowerText, hint)) add(WEIGHT_HINT_NOTE, `hint "${hint}" in note`);
        }

        // Words the paragraph (or note) shares with the target note
        const matchedWords = [];
        const seen = new Set();
        const scoreTerm = (term, inParagraph) => {
            if (keywordWords.has(term) || seen.has(term)) return;
            if (!profile.terms.has(term)) return;
            seen.add(term);
            const amount = termWeight(term, 'terms') * (inParagraph ? WEIGHT_TERM_PARAGRAPH : WEIGHT_TERM_NOTE);
            if (amount > 0) {
                score += amount;
                if (inParagraph) matchedWords.push(term);
            }
        };
        paragraphTerms.forEach(t => scoreTerm(t, true));
        noteContext.terms.forEach(t => scoreTerm(t, false));
        if (matchedWords.length > 0) reasons.push(`words: ${matchedWords.slice(0, 5).join(', ')}`);

        // Links the note already has
        const targetBase = profile.entry.target.split('/').pop().toLowerCase();
        if (linked.has(targetBase)) add(WEIGHT_LINKS_TARGET, 'note already links here');

        let neighbourScore = 0;
        const neighbourNames = [];
        profile.neighbours.forEach(name => {
            if (!linked.has(name)) return;
            const w = termWeight(name, 'neighbours');
            if (w > 0) {
                neighbourScore += WEIGHT_LINKS_NEIGHBOUR * w;
                neighbourNames.push(name);
            }
        });
        add(Math.min(neighbourScore, MAX_NEIGHBOUR_SCORE), `linked notes: ${neighbourNames.slice(0, 3).join(', ')}`);

        // Shared tags
        profile.tags.forEach(tag => {
            if (noteContext.tags.has(tag)) add(WEIGHT_SHARED_TAG * termWeight(tag, 'tags'), `tag #${tag}`);
        });

        // Same folder
        if (profile.folder !== null && profile.folder === noteContext.folder) {
            add(WEIGHT_SAME_FOLDER, 'same folder');
        }

        return { entry: profile.entry, target: profile.entry.target, score, reasons };
    });

    const ranked = scores.slice().sort((a, b) => b.score - a.score);
    const best = ranked[0];
    const runnerUp = ranked[1] || { score: 0 };
    const confident = best.score >= MIN_SCORE &&
        best.score - runnerUp.score >= MIN_MARGIN &&
        best.score >= runnerUp.score * MIN_RATIO;

    return {
        entry: best.score > 0 ? best.entry : null,
        confident,
        scores: ranked.map(({ target, score, reasons }) => ({ target, score, reasons }))
    };
}

module.exports = {
    tokenize,
    stripMarkup,
    getParagraphAt,
    buildTargetProfile,
    buildNoteContext,
    warmBodyCache,
    pickTarget
};
