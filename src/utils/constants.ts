/**
 * Constants for Auto Keyword Linker plugin
 * Extracted from main.js during refactoring Session 1
 */

import type { AutoKeywordLinkerSettings } from '../types';

/**
 * Default stop words to exclude from keyword suggestions
 * These are common words that typically don't make good keywords
 */
export const DEFAULT_STOP_WORDS = [
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
export const DEFAULT_SETTINGS: AutoKeywordLinkerSettings = {
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
    newNoteTemplate: '# {{keyword}}\n\nCreated: {{date}}\n\n',  // Template for new notes
    customStopWords: [],             // Additional stop words to exclude from keyword suggestions (appended to defaults)
    preventSelfLinkGlobal: false,    // Global setting: prevent linking keywords on their target notes
    statistics: {                    // Statistics tracking
        totalLinksCreated: 0,
        totalNotesProcessed: 0,
        lastRunDate: null
    }
};
