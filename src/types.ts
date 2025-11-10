/**
 * TypeScript type definitions for Auto Keyword Linker plugin
 * Extracted from main.js during refactoring Session 1
 */

/**
 * Statistics tracking for plugin usage
 */
export interface Statistics {
    totalLinksCreated: number;
    totalNotesProcessed: number;
    lastRunDate: string | null;
}

/**
 * Individual keyword configuration
 */
export interface Keyword {
    id: string;
    keyword: string;
    target: string;
    variations: string[];
    enableTags: boolean;
    linkScope: 'vault-wide' | 'same-folder' | 'source-folder' | 'target-folder';
    scopeFolder: string;
    useRelativeLinks: boolean;
    blockRef: string;
    requireTag: string;
    onlyInNotesLinkingTo: boolean;
    suggestMode: boolean;
    preventSelfLink: boolean;
    groupId: string | null;
}

/**
 * Keyword group configuration for bulk settings
 */
export interface KeywordGroup {
    id: string;
    name: string;
    keywords: string[];  // Array of keyword IDs
    enableTags?: boolean;
    linkScope?: 'vault-wide' | 'same-folder' | 'source-folder' | 'target-folder';
    scopeFolder?: string;
    useRelativeLinks?: boolean;
    suggestMode?: boolean;
    preventSelfLink?: boolean;
}

/**
 * Plugin settings interface
 */
export interface AutoKeywordLinkerSettings {
    keywordGroups: KeywordGroup[];
    keywords: Keyword[];
    autoLinkOnSave: boolean;
    caseSensitive: boolean;
    firstOccurrenceOnly: boolean;
    autoCreateNotes: boolean;
    newNoteFolder: string;
    newNoteTemplate: string;
    customStopWords: string[];
    preventSelfLinkGlobal: boolean;
    statistics: Statistics;
}

/**
 * Keyword suggestion from analysis
 */
export interface KeywordSuggestion {
    word: string;
    count: number;
    files: string[];
}

/**
 * Preview data for a single link change
 */
export interface LinkPreview {
    keyword: string;
    target: string;
    context: string;
    lineNumber?: number;
}

/**
 * Preview data for a note containing link changes
 */
export interface NotePreview {
    notePath: string;
    links: LinkPreview[];
}
