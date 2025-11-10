/**
 * Suggestion command implementations
 * Extracted from main-source.js (Session 4)
 */

const { Notice } = require('obsidian');

/**
 * Open the Suggested Keyword Builder modal for all notes
 * @param {Object} app - Obsidian app instance
 * @param {Object} pluginInstance - Plugin instance
 * @param {Class} SuggestedKeywordBuilderModal - SuggestedKeywordBuilderModal class
 */
async function suggestKeywords(app, pluginInstance, SuggestedKeywordBuilderModal) {
    new SuggestedKeywordBuilderModal(app, pluginInstance).open();
}

/**
 * Open the Suggested Keyword Builder modal for current note only
 * @param {Object} app - Obsidian app instance
 * @param {Object} pluginInstance - Plugin instance
 * @param {Class} SuggestedKeywordBuilderModal - SuggestedKeywordBuilderModal class
 */
async function suggestKeywordsFromCurrentNote(app, pluginInstance, SuggestedKeywordBuilderModal) {
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) {
        new Notice('No active note found. Please open a note first.');
        return;
    }
    new SuggestedKeywordBuilderModal(app, pluginInstance, activeFile).open();
}

/**
 * Review all link suggestions in a modal
 * @param {Object} app - Obsidian app instance
 * @param {Object} editor - CodeMirror editor instance
 * @param {Class} SuggestionReviewModal - SuggestionReviewModal class
 */
function reviewSuggestions(app, editor, SuggestionReviewModal) {
    const content = editor.getValue();
    const suggestions = [];

    // Parse all lines to find suggestions
    const lines = content.split('\n');
    const spanPattern = /<span class="akl-suggested-link" data-target="([^"]*)" data-block="([^"]*)" data-use-relative="([^"]*)"[^>]*>([^<]+)<\/span>/g;

    lines.forEach((line, lineNumber) => {
        let match;
        spanPattern.lastIndex = 0; // Reset regex state
        while ((match = spanPattern.exec(line)) !== null) {
            suggestions.push({
                lineNumber: lineNumber,
                targetNote: match[1],
                blockRef: match[2],
                useRelative: match[3] === 'true',
                matchText: match[4],
                fullMatch: match[0]
            });
        }
    });

    if (suggestions.length === 0) {
        new Notice('No link suggestions found in current note');
        return;
    }

    // Open the review modal
    new SuggestionReviewModal(app, editor, suggestions).open();
}

/**
 * Accept all link suggestions on the current line
 * @param {Object} editor - CodeMirror editor instance
 * @param {Function} isInsideTable - Function to check if position is inside table
 * @param {Function} updateStatusBar - Function to update status bar
 */
function acceptSuggestionAtCursor(editor, isInsideTable, updateStatusBar) {
    const cursor = editor.getCursor();
    let line = editor.getLine(cursor.line);

    // Find ALL suggestion spans on this line
    const spanPattern = /<span class="akl-suggested-link" data-target="([^"]*)" data-block="([^"]*)" data-use-relative="([^"]*)"[^>]*>([^<]+)<\/span>/g;
    const matches = [...line.matchAll(spanPattern)];

    if (matches.length === 0) {
        new Notice('No link suggestions found on this line');
        return;
    }

    // Check if current line is inside a table
    const content = editor.getValue();
    const lineStart = editor.posToOffset({ line: cursor.line, ch: 0 });
    const insideTable = isInsideTable(content, lineStart);

    // Process all matches - replace each span with its corresponding link
    let acceptedCount = 0;
    matches.forEach(match => {
        const fullMatch = match[0];
        const targetNote = match[1];
        const blockRef = match[2];
        const useRelative = match[3] === 'true';
        const matchText = match[4];

        // Create the actual link
        let link;
        const targetWithBlock = blockRef ? `${targetNote}#${blockRef}` : targetNote;

        if (useRelative) {
            // Use relative markdown link format
            // Escape pipe characters in the display text if inside a table to prevent breaking table columns
            const escapedMatchText = insideTable ? matchText.replace(/\|/g, '\\|') : matchText;
            const encodedTarget = encodeURIComponent(targetNote) + '.md';
            const blockPart = blockRef ? `#${blockRef}` : '';
            link = `[${escapedMatchText}](${encodedTarget}${blockPart})`;
        } else {
            // Use wikilink format
            if (insideTable) {
                // Inside tables: Escape the pipe with single backslash \| to prevent breaking table formatting
                link = targetNote === matchText && !blockRef ? `[[${matchText}]]` : `[[${targetWithBlock}\\|${matchText}]]`;
            } else {
                // Outside table: standard wikilink format with | separator for alias
                link = targetNote === matchText && !blockRef ? `[[${matchText}]]` : `[[${targetWithBlock}|${matchText}]]`;
            }
        }

        // Replace this span with the link
        line = line.replace(fullMatch, link);
        acceptedCount++;
    });

    // Update the line with all replacements
    editor.setLine(cursor.line, line);

    new Notice(`Accepted ${acceptedCount} link suggestion${acceptedCount > 1 ? 's' : ''} on this line`);

    // Update status bar
    setTimeout(() => updateStatusBar(), 100);
}

/**
 * Accept all link suggestions in the current note
 * @param {Object} editor - CodeMirror editor instance
 * @param {Function} isInsideTable - Function to check if position is inside table
 * @param {Function} updateStatusBar - Function to update status bar
 */
function acceptAllSuggestions(editor, isInsideTable, updateStatusBar) {
    const content = editor.getValue();
    let newContent = content;
    let count = 0;

    // Find all suggestion spans
    const spanPattern = /<span class="akl-suggested-link" data-target="([^"]*)" data-block="([^"]*)" data-use-relative="([^"]*)"[^>]*>([^<]+)<\/span>/g;

    newContent = content.replace(spanPattern, (match, targetNote, blockRef, useRelative, matchText, offset) => {
        count++;

        // Check if this match is inside a table
        const insideTable = isInsideTable(content, offset);

        // Create the actual link
        let link;
        const targetWithBlock = blockRef ? `${targetNote}#${blockRef}` : targetNote;

        if (useRelative === 'true') {
            // Use relative markdown link format
            // Escape pipe characters in the display text if inside a table to prevent breaking table columns
            const escapedMatchText = insideTable ? matchText.replace(/\|/g, '\\|') : matchText;
            const encodedTarget = encodeURIComponent(targetNote) + '.md';
            const blockPart = blockRef ? `#${blockRef}` : '';
            link = `[${escapedMatchText}](${encodedTarget}${blockPart})`;
        } else {
            // Use wikilink format
            if (insideTable) {
                // Inside tables: Escape the pipe with single backslash \| to prevent breaking table formatting
                link = targetNote === matchText && !blockRef ? `[[${matchText}]]` : `[[${targetWithBlock}\\|${matchText}]]`;
            } else {
                // Outside table: standard wikilink format with | separator for alias
                link = targetNote === matchText && !blockRef ? `[[${matchText}]]` : `[[${targetWithBlock}|${matchText}]]`;
            }
        }

        return link;
    });

    if (count > 0) {
        editor.setValue(newContent);
        new Notice(`Accepted ${count} link suggestion${count > 1 ? 's' : ''}`);
        // Update status bar
        setTimeout(() => updateStatusBar(), 100);
    } else {
        new Notice('No link suggestions found in current note');
    }
}

module.exports = {
    suggestKeywords,
    suggestKeywordsFromCurrentNote,
    reviewSuggestions,
    acceptSuggestionAtCursor,
    acceptAllSuggestions
};
