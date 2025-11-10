// Import required Obsidian API components
const { Notice, Menu, MarkdownView } = require('obsidian');

// Import helper functions
const { escapeRegex } = require('../utils/helpers');

/**
 * Process suggested links in rendered markdown (Reading mode)
 * Adds click and context menu handlers to suggested link spans
 * @param {Object} plugin - The plugin instance
 * @param {HTMLElement} element - The DOM element to process
 */
function processSuggestedLinks(plugin, element) {
    const suggestedLinks = element.querySelectorAll('.akl-suggested-link');

    suggestedLinks.forEach(span => {
        // Add click handler - just make it clickable to show it's interactive
        span.addEventListener('click', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();

            // Inform user they need to switch to edit mode
            new Notice('Switch to edit mode to accept suggestions, or use the review modal');
        });

        // Handle right-click to show review option
        span.addEventListener('contextmenu', (evt) => {
            evt.preventDefault();
            evt.stopPropagation();

            const menu = new Menu();

            // Option to review all suggestions (will need to switch to edit mode)
            menu.addItem((item) => {
                item
                    .setTitle('📋 Review link suggestions (opens in edit mode)')
                    .setIcon('list-checks')
                    .onClick(async () => {
                        // Switch to edit mode first
                        const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
                        if (view) {
                            await view.setState({mode: 'source'}, {});

                            // Give it a moment to switch modes, then open review
                            setTimeout(() => {
                                const editor = plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
                                if (editor) {
                                    plugin.reviewSuggestions(editor);
                                }
                            }, 100);
                        }
                    });
            });

            menu.showAtMouseEvent(evt);
        });
    });
}

/**
 * Update status bar with suggestion count
 * Shows the number of link suggestions in the current note
 * @param {Object} plugin - The plugin instance
 */
function updateStatusBar(plugin) {
    if (!plugin.statusBarItem) return;

    const editor = plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
    if (!editor) {
        plugin.statusBarItem.setText('');
        plugin.statusBarItem.style.display = 'none';
        return;
    }

    const content = editor.getValue();
    const spanPattern = /<span class="akl-suggested-link"[^>]*>([^<]+)<\/span>/g;
    const matches = content.match(spanPattern);
    const count = matches ? matches.length : 0;

    if (count > 0) {
        plugin.statusBarItem.setText(`💡 ${count} link suggestion${count > 1 ? 's' : ''}`);
        plugin.statusBarItem.style.cursor = 'pointer';
        plugin.statusBarItem.style.display = 'inline-block';
        plugin.statusBarItem.addClass('mod-clickable');
        plugin.statusBarItem.setAttribute('aria-label', 'Click to review suggestions');

        // Add click handler to open review modal
        plugin.statusBarItem.onclick = () => {
            const currentEditor = plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
            if (currentEditor) {
                plugin.reviewSuggestions(currentEditor);
            }
        };
    } else {
        plugin.statusBarItem.setText('');
        plugin.statusBarItem.style.display = 'none';
        plugin.statusBarItem.onclick = null;
    }
}

/**
 * Set up context menu for suggested links
 * Registers a document-level right-click handler for suggested link elements
 * @param {Object} plugin - The plugin instance
 */
function setupSuggestionContextMenu(plugin) {
    plugin.registerDomEvent(document, 'contextmenu', (evt) => {
        const target = evt.target;

        // Check if right-click was on a suggested link
        if (target && target.classList && target.classList.contains('akl-suggested-link')) {
            evt.preventDefault();

            // Create a context menu
            const menu = new Menu();

            menu.addItem((item) => {
                item
                    .setTitle('Accept link suggestion')
                    .setIcon('check')
                    .onClick(() => {
                        plugin.acceptSuggestionElement(target);
                    });
            });

            menu.showAtMouseEvent(evt);
        }
    });
}

/**
 * Set up click handler for Live Preview mode
 * Registers document-level click and context menu handlers for suggested links in Live Preview
 * @param {Object} plugin - The plugin instance
 */
function setupLivePreviewClickHandler(plugin) {
    plugin.registerDomEvent(document, 'click', (evt) => {
        // Check if we're in a markdown view
        const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return;

        const editor = view.editor;
        if (!editor) return;

        // Get the clicked position in the editor
        const clickedElement = evt.target;

        // Check if the clicked element or its parent has our suggestion class
        let suggestionElement = null;
        if (clickedElement.classList && clickedElement.classList.contains('akl-suggested-link')) {
            suggestionElement = clickedElement;
        } else if (clickedElement.parentElement && clickedElement.parentElement.classList &&
                   clickedElement.parentElement.classList.contains('akl-suggested-link')) {
            suggestionElement = clickedElement.parentElement;
        }

        if (suggestionElement) {
            evt.preventDefault();
            evt.stopPropagation();

            // Get cursor position
            const cursor = editor.getCursor();
            const line = editor.getLine(cursor.line);

            // Try to find suggestion at this line
            showSuggestionMenuAtLine(plugin, editor, cursor.line, line, evt);
        }
    });

    // Also handle right-click for Live Preview
    plugin.registerDomEvent(document, 'contextmenu', (evt) => {
        const view = plugin.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return;

        const editor = view.editor;
        if (!editor) return;

        const clickedElement = evt.target;

        let suggestionElement = null;
        if (clickedElement.classList && clickedElement.classList.contains('akl-suggested-link')) {
            suggestionElement = clickedElement;
        } else if (clickedElement.parentElement && clickedElement.parentElement.classList &&
                   clickedElement.parentElement.classList.contains('akl-suggested-link')) {
            suggestionElement = clickedElement.parentElement;
        }

        if (suggestionElement) {
            evt.preventDefault();
            evt.stopPropagation();

            const cursor = editor.getCursor();
            const line = editor.getLine(cursor.line);

            showSuggestionMenuAtLine(plugin, editor, cursor.line, line, evt);
        }
    });
}

/**
 * Show suggestion menu for a specific line
 * Displays a context menu with options to accept a suggestion
 * @param {Object} plugin - The plugin instance
 * @param {Editor} editor - The editor instance
 * @param {number} lineNumber - The line number containing the suggestion
 * @param {string} lineText - The text content of the line
 * @param {MouseEvent} evt - The mouse event for positioning the menu
 */
function showSuggestionMenuAtLine(plugin, editor, lineNumber, lineText, evt) {
    // Find all suggestion spans in this line
    const spanPattern = /<span class="akl-suggested-link" data-target="([^"]*)" data-block="([^"]*)" data-use-relative="([^"]*)"[^>]*>([^<]+)<\/span>/g;
    const matches = [...lineText.matchAll(spanPattern)];

    if (matches.length === 0) return;

    // If there's only one match, show menu for it
    // If there are multiple, show menu for the first one (could be enhanced to detect which one was clicked)
    const match = matches[0];
    const targetNote = match[1];
    const blockRef = match[2];
    const useRelative = match[3] === 'true';
    const matchText = match[4];

    const menu = new Menu();

    menu.addItem((item) => {
        item
            .setTitle(`Accept link suggestion: "${matchText}"`)
            .setIcon('check')
            .onClick(() => {
                acceptSuggestionInLine(plugin, editor, lineNumber, lineText, matchText, targetNote, blockRef, useRelative);
            });
    });

    menu.showAtMouseEvent(evt);
}

/**
 * Accept a suggestion in a specific line
 * Replaces the suggestion span with an actual link
 * @param {Object} plugin - The plugin instance
 * @param {Editor} editor - The editor instance
 * @param {number} lineNumber - The line number containing the suggestion
 * @param {string} lineText - The text content of the line
 * @param {string} matchText - The text of the suggestion to replace
 * @param {string} targetNote - The target note name
 * @param {string} blockRef - Optional block reference
 * @param {boolean} useRelative - Whether to use relative markdown links
 */
function acceptSuggestionInLine(plugin, editor, lineNumber, lineText, matchText, targetNote, blockRef, useRelative) {
    // Find the exact span to replace
    const spanPattern = new RegExp(`<span class="akl-suggested-link" data-target="${escapeRegex(targetNote)}" data-block="${escapeRegex(blockRef)}" data-use-relative="${useRelative ? 'true' : 'false'}"[^>]*>${escapeRegex(matchText)}</span>`);

    if (!spanPattern.test(lineText)) return;

    // Check if current line is inside a table
    const content = editor.getValue();
    const lineStart = editor.posToOffset({ line: lineNumber, ch: 0 });
    const insideTable = plugin.isInsideTable(content, lineStart);

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

    // Replace in the line
    const newLine = lineText.replace(spanPattern, link);
    editor.setLine(lineNumber, newLine);

    new Notice('Link suggestion accepted');

    // Update status bar
    setTimeout(() => updateStatusBar(plugin), 100);
}

// Export all functions
module.exports = {
    processSuggestedLinks,
    updateStatusBar,
    setupSuggestionContextMenu,
    setupLivePreviewClickHandler,
    showSuggestionMenuAtLine,
    acceptSuggestionInLine
};
