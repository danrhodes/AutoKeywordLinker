/**
 * Constants for Auto Keyword Linker plugin
 * Extracted from main.js during refactoring Session 1
 */

/**
 * Default stop words to exclude from keyword suggestions
 * These are common words that typically don't make good keywords
 */
const DEFAULT_STOP_WORDS = [
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it',
    'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they',
    'have', 'had', 'what', 'when', 'where', 'who', 'which', 'why', 'how', 'all', 'each', 'every',
    'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'my', 'me', 'we',
    'us', 'our', 'your', 'their', 'his', 'her', 'i', 'you', 'do', 'does', 'did', 'am', 'been',
    'being', 'get', 'got', 'if', 'or', 'may', 'could', 'would', 'should', 'might', 'must', 'one',
    'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'there', 'then', 'these',
    'those', 'also', 'any', 'about', 'after', 'again', 'before', 'because', 'between', 'during',
    'through', 'under', 'over', 'above', 'below', 'up', 'down', 'out', 'off', 'into', 'since',
    'until', 'while', 'once', 'here', 'there', 'see', 'saw', 'seen', 'go', 'goes', 'going', 'gone',
    'went', 'want', 'wanted', 'make', 'made', 'use', 'used', 'using', 'day', 'days', 'way', 'ways',
    'thing', 'things', 'yes', 'no', 'okay', 'ok'
];

/**
 * Default settings that will be used when the plugin is first installed
 */
const DEFAULT_SETTINGS = {
    // Array of keyword group objects for organizing keywords
    keywordGroups: [],

    // Array of keyword objects, each containing the keyword, target note, and variations
    keywords: [
        { id: 'kw-1', keyword: 'Keyword1', target: 'Keyword1', variations: [], enableTags: false, linkScope: 'vault-wide', scopeFolder: '', useRelativeLinks: false, blockRef: '', requireTag: '', onlyInNotesLinkingTo: false, suggestMode: false, preventSelfLink: false, groupId: null },
        { id: 'kw-2', keyword: 'Keyword2', target: 'Keyword2', variations: [], enableTags: false, linkScope: 'vault-wide', scopeFolder: '', useRelativeLinks: false, blockRef: '', requireTag: '', onlyInNotesLinkingTo: false, suggestMode: false, preventSelfLink: false, groupId: null }
    ],
    autoLinkOnSave: false,          // Whether to automatically link keywords when saving a note
    caseSensitive: false,            // Whether keyword matching should be case-sensitive
    firstOccurrenceOnly: true,       // Whether to link only the first occurrence of each keyword
    autoCreateNotes: false,           // Whether to automatically create notes that don't exist
    newNoteFolder: '',               // Folder where new notes will be created (empty = root)
    keywordSortOrder: 'manual',      // How the Keywords tab list is sorted (display only, doesn't reorder settings)
    keywordAccordion: true,          // Keywords tab: opening one keyword closes the others
    quickAddCreateNote: true,        // Whether Quick Add Keyword creates the target note if it doesn't exist
    newNoteTemplate:'# {{keyword}}\n\nCreated: {{date}}\n\n',  // Template for new notes
    customStopWords: [],             // Additional stop words to exclude from keyword suggestions (appended to defaults)
    preventSelfLinkGlobal: true,     // Global setting: prevent linking keywords on their target notes (recommended in Help tab)
    skipHeadings: true,              // Skip keyword linking on Markdown heading lines (## Heading)
    skipCodeBlocks: false,           // Skip keyword linking and suggestions inside fenced code blocks (``` or ~~~)
    contextDisambiguation: true,     // When keywords share text but point at different notes, pick the target from context
    ambiguousFallback: 'first',      // When context doesn't clearly pick one: 'first' (first keyword's target) or 'skip' (don't link)
    relatedMinNotes: 3,              // Related sections: notes two targets must share before they're listed
    relatedMaxEntries: 8,            // Related sections: most entries per note
    relatedHeading: '## Related',    // Related sections: heading inside the block (empty for none)
    relatedDismissed: [],            // Related sections: [pathA, pathB] pairs hidden from the report and blocks
    relatedPins: [],                 // Related sections: [pathA, pathB] pairs always listed (from the report's Link button)
    statistics: {                    // Statistics tracking
        totalLinksCreated: 0,
        totalNotesProcessed: 0,
        lastRunDate: null
    }
};

module.exports = {
    DEFAULT_STOP_WORDS,
    DEFAULT_SETTINGS
};
