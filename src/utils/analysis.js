/**
 * Analysis utilities for keyword suggestion and text extraction
 * Extracted from main-source.js (Session 3)
 */

const { DEFAULT_STOP_WORDS } = require('./constants');

/**
 * Get combined stop words (default + custom)
 * @param {Object} settings - Plugin settings
 * @returns {Set} Set of stop words to exclude
 */
function getStopWords(settings) {
    const stopWords = new Set(DEFAULT_STOP_WORDS);
    // Add custom stop words from settings
    if (settings.customStopWords && Array.isArray(settings.customStopWords)) {
        for (let word of settings.customStopWords) {
            if (word && typeof word === 'string') {
                stopWords.add(word.toLowerCase().trim());
            }
        }
    }
    return stopWords;
}

/**
 * Extract meaningful words from text
 * @param {string} text - Text to extract words from
 * @param {boolean} isTitle - Whether this is a title (affects processing)
 * @param {Object} settings - Plugin settings
 * @returns {Array} Array of normalized words
 */
function extractWordsFromText(text, isTitle, settings) {
    const words = [];
    const stopWords = getStopWords(settings);

    // Split by common delimiters
    let parts = text.split(/[\s\-_\/\\,;:]+/);

    for (let part of parts) {
        // Handle camelCase and PascalCase
        const subParts = part.split(/(?=[A-Z])/).filter(p => p.length > 0);

        for (let subPart of subParts) {
            // Clean and normalize
            let word = subPart.trim()
                .replace(/[^\w\s]/g, '') // Remove special chars
                .trim();

            if (word.length === 0) continue;

            // Normalize to Title Case
            word = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

            // Filter out stop words and short words
            if (word.length >= 3 && !stopWords.has(word.toLowerCase())) {
                words.push(word);
            }
        }
    }

    return words;
}

/**
 * Extract meaningful phrases (2-4 words) from text
 * @param {string} text - Text to extract phrases from
 * @param {Object} settings - Plugin settings
 * @returns {Array} Array of normalized phrases
 */
function extractPhrasesFromText(text, settings) {
    const phrases = [];
    const stopWords = getStopWords(settings);

    // Split into sentences/lines
    const lines = text.split(/[.\n]/);

    for (let line of lines) {
        // Extract capitalized words (likely proper nouns/important terms)
        const words = line.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3}\b/g);

        if (words) {
            for (let phrase of words) {
                phrase = phrase.trim();

                // Check if phrase contains stop words only
                const phraseWords = phrase.split(/\s+/);
                const hasNonStopWord = phraseWords.some(w => !stopWords.has(w.toLowerCase()));

                if (hasNonStopWord && phrase.length >= 5) {
                    phrases.push(phrase);
                }
            }
        }
    }

    return phrases;
}

/**
 * Analyze notes in the vault and extract keyword suggestions
 * @param {Object} app - Obsidian app instance
 * @param {Object} settings - Plugin settings
 * @param {Function} getAliasesForNote - Function to get aliases for a note
 * @returns {Array} Array of suggestion objects with word, count, and notes
 */
async function analyzeNotesForKeywords(app, settings, getAliasesForNote) {
    const files = app.vault.getMarkdownFiles();
    const wordFrequency = new Map(); // word -> { count, notes: Set }
    const phraseFrequency = new Map(); // phrase -> { count, notes: Set }

    // Get existing keywords (normalized to lowercase for comparison)
    const existingKeywords = new Set(
        settings.keywords.map(k => k.keyword.toLowerCase())
    );

    // Add variations to existing keywords set
    for (let item of settings.keywords) {
        if (item.variations && item.variations.length > 0) {
            for (let variation of item.variations) {
                existingKeywords.add(variation.toLowerCase());
            }
        }
    }

    // Add auto-discovered aliases from frontmatter to existing keywords set
    for (let item of settings.keywords) {
        const aliases = getAliasesForNote(item.target);
        if (aliases && aliases.length > 0) {
            for (let alias of aliases) {
                existingKeywords.add(alias.toLowerCase());
            }
        }
    }

    // Process each file
    for (let file of files) {
        // Extract from note title
        const titleWords = extractWordsFromText(file.basename, true, settings);
        const titlePhrases = extractPhrasesFromText(file.basename, settings);

        // Add title words (weighted 3x)
        for (let word of titleWords) {
            if (!existingKeywords.has(word.toLowerCase())) {
                if (!wordFrequency.has(word)) {
                    wordFrequency.set(word, { count: 0, notes: new Set() });
                }
                const data = wordFrequency.get(word);
                data.count += 3; // Weight title words higher
                data.notes.add(file.basename);
            }
        }

        // Add title phrases (weighted 3x)
        for (let phrase of titlePhrases) {
            if (!existingKeywords.has(phrase.toLowerCase())) {
                if (!phraseFrequency.has(phrase)) {
                    phraseFrequency.set(phrase, { count: 0, notes: new Set() });
                }
                const data = phraseFrequency.get(phrase);
                data.count += 3;
                data.notes.add(file.basename);
            }
        }

        // Extract from note content (first 5000 chars)
        try {
            const content = await app.vault.read(file);
            const limitedContent = content.substring(0, 5000);

            // Remove frontmatter
            let contentWithoutFrontmatter = limitedContent.replace(/^---[\s\S]*?---\n/, '');

            // Remove all wikilinks [[link]] and [[link|alias]] - they're already keywords or shouldn't be suggested
            contentWithoutFrontmatter = contentWithoutFrontmatter.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '');

            // Remove markdown links [text](url)
            contentWithoutFrontmatter = contentWithoutFrontmatter.replace(/\[([^\]]+)\]\([^)]+\)/g, '');

            const contentWords = extractWordsFromText(contentWithoutFrontmatter, false, settings);
            const contentPhrases = extractPhrasesFromText(contentWithoutFrontmatter, settings);

            // Add content words (normal weight)
            for (let word of contentWords) {
                if (!existingKeywords.has(word.toLowerCase())) {
                    if (!wordFrequency.has(word)) {
                        wordFrequency.set(word, { count: 0, notes: new Set() });
                    }
                    const data = wordFrequency.get(word);
                    data.count += 1;
                    data.notes.add(file.basename);
                }
            }

            // Add content phrases (normal weight)
            for (let phrase of contentPhrases) {
                if (!existingKeywords.has(phrase.toLowerCase())) {
                    if (!phraseFrequency.has(phrase)) {
                        phraseFrequency.set(phrase, { count: 0, notes: new Set() });
                    }
                    const data = phraseFrequency.get(phrase);
                    data.count += 1;
                    data.notes.add(file.basename);
                }
            }
        } catch (error) {
            // Skip files that can't be read
            console.log(`Error reading ${file.path}:`, error);
        }
    }

    // Combine words and phrases into suggestions
    const suggestions = [];

    // Add word suggestions
    for (let [word, data] of wordFrequency) {
        suggestions.push({
            keyword: word,
            count: data.count,
            notes: Array.from(data.notes).slice(0, 5), // Show max 5 notes
            totalNotes: data.notes.size
        });
    }

    // Add phrase suggestions
    for (let [phrase, data] of phraseFrequency) {
        suggestions.push({
            keyword: phrase,
            count: data.count,
            notes: Array.from(data.notes).slice(0, 5),
            totalNotes: data.notes.size
        });
    }

    // Sort by count (descending) then by keyword length (descending)
    suggestions.sort((a, b) => {
        if (b.count !== a.count) {
            return b.count - a.count;
        }
        return b.keyword.length - a.keyword.length;
    });

    return suggestions;
}

/**
 * Analyze a single note and extract keyword suggestions
 * @param {Object} app - Obsidian app instance
 * @param {Object} settings - Plugin settings
 * @param {TFile} file - The file to analyze
 * @param {Function} getAliasesForNote - Function to get aliases for a note
 * @returns {Array} Array of suggestion objects with word, count, and notes
 */
async function analyzeCurrentNoteForKeywords(app, settings, file, getAliasesForNote) {
    const wordFrequency = new Map(); // word -> { count, notes: Set }
    const phraseFrequency = new Map(); // phrase -> { count, notes: Set }

    // Get existing keywords (normalized to lowercase for comparison)
    const existingKeywords = new Set(
        settings.keywords.map(k => k.keyword.toLowerCase())
    );

    // Add variations to existing keywords set
    for (let item of settings.keywords) {
        if (item.variations && item.variations.length > 0) {
            for (let variation of item.variations) {
                existingKeywords.add(variation.toLowerCase());
            }
        }
    }

    // Add auto-discovered aliases from frontmatter to existing keywords set
    for (let item of settings.keywords) {
        const aliases = getAliasesForNote(item.target);
        if (aliases && aliases.length > 0) {
            for (let alias of aliases) {
                existingKeywords.add(alias.toLowerCase());
            }
        }
    }

    // Extract from note title
    const titleWords = extractWordsFromText(file.basename, true, settings);
    const titlePhrases = extractPhrasesFromText(file.basename, settings);

    // Add title words (weighted 3x)
    for (let word of titleWords) {
        if (!existingKeywords.has(word.toLowerCase())) {
            if (!wordFrequency.has(word)) {
                wordFrequency.set(word, { count: 0, notes: new Set() });
            }
            const data = wordFrequency.get(word);
            data.count += 3; // Weight title words higher
            data.notes.add(file.basename);
        }
    }

    // Add title phrases (weighted 3x)
    for (let phrase of titlePhrases) {
        if (!existingKeywords.has(phrase.toLowerCase())) {
            if (!phraseFrequency.has(phrase)) {
                phraseFrequency.set(phrase, { count: 0, notes: new Set() });
            }
            const data = phraseFrequency.get(phrase);
            data.count += 3;
            data.notes.add(file.basename);
        }
    }

    // Extract from note content (entire content for single note)
    try {
        const content = await app.vault.read(file);

        // Remove frontmatter
        let contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\n/, '');

        // Remove all wikilinks [[link]] and [[link|alias]] - they're already keywords or shouldn't be suggested
        contentWithoutFrontmatter = contentWithoutFrontmatter.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '');

        // Remove markdown links [text](url)
        contentWithoutFrontmatter = contentWithoutFrontmatter.replace(/\[([^\]]+)\]\([^)]+\)/g, '');

        const contentWords = extractWordsFromText(contentWithoutFrontmatter, false, settings);
        const contentPhrases = extractPhrasesFromText(contentWithoutFrontmatter, settings);

        // Add content words (normal weight)
        for (let word of contentWords) {
            if (!existingKeywords.has(word.toLowerCase())) {
                if (!wordFrequency.has(word)) {
                    wordFrequency.set(word, { count: 0, notes: new Set() });
                }
                const data = wordFrequency.get(word);
                data.count += 1;
                data.notes.add(file.basename);
            }
        }

        // Add content phrases (normal weight)
        for (let phrase of contentPhrases) {
            if (!existingKeywords.has(phrase.toLowerCase())) {
                if (!phraseFrequency.has(phrase)) {
                    phraseFrequency.set(phrase, { count: 0, notes: new Set() });
                }
                const data = phraseFrequency.get(phrase);
                data.count += 1;
                data.notes.add(file.basename);
            }
        }
    } catch (error) {
        console.log(`Error reading ${file.path}:`, error);
        throw error;
    }

    // Combine words and phrases into suggestions
    const suggestions = [];

    // Add word suggestions
    for (let [word, data] of wordFrequency) {
        suggestions.push({
            keyword: word,
            count: data.count,
            notes: Array.from(data.notes),
            totalNotes: data.notes.size
        });
    }

    // Add phrase suggestions
    for (let [phrase, data] of phraseFrequency) {
        suggestions.push({
            keyword: phrase,
            count: data.count,
            notes: Array.from(data.notes),
            totalNotes: data.notes.size
        });
    }

    // Sort by count (descending) then by keyword length (descending)
    suggestions.sort((a, b) => {
        if (b.count !== a.count) {
            return b.count - a.count;
        }
        return b.keyword.length - a.keyword.length;
    });

    return suggestions;
}

module.exports = {
    getStopWords,
    extractWordsFromText,
    extractPhrasesFromText,
    analyzeNotesForKeywords,
    analyzeCurrentNoteForKeywords
};
