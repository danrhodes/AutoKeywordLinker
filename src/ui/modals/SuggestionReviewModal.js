/**
 * Suggestion Review Modal
 * Allows reviewing and accepting link suggestions selectively
 * Extracted from main-source.js (Session 5)
 */

const { Modal, Notice, MarkdownView } = require('obsidian');

class SuggestionReviewModal extends Modal {
    constructor(app, editor, suggestions) {
        super(app);
        this.editor = editor;
        this.suggestions = suggestions; // Array of {line, matchText, targetNote, blockRef, useRelative, fullMatch}
        this.selectedSuggestions = new Set(suggestions.map((_, i) => i)); // All selected by default
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.empty();
        contentEl.addClass('akl-suggestion-review-modal');

        // Title
        contentEl.createEl('h2', {text: 'Review Link Suggestions'});

        // Description
        const desc = contentEl.createEl('p', {
            text: `Found ${this.suggestions.length} link suggestion${this.suggestions.length > 1 ? 's' : ''} in this note. Select which ones to accept:`
        });
        desc.style.marginBottom = '1em';
        desc.style.color = 'var(--text-muted)';

        // Select all / Deselect all buttons
        const buttonContainer = contentEl.createDiv({cls: 'akl-button-container'});
        buttonContainer.style.marginBottom = '1em';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '0.5em';

        const selectAllBtn = buttonContainer.createEl('button', {text: 'Select All'});
        selectAllBtn.addEventListener('click', () => {
            this.suggestions.forEach((_, i) => {
                this.selectedSuggestions.add(i);
                const checkbox = contentEl.querySelector(`input[data-index="${i}"]`);
                if (checkbox) checkbox.checked = true;
            });
        });

        const deselectAllBtn = buttonContainer.createEl('button', {text: 'Deselect All'});
        deselectAllBtn.addEventListener('click', () => {
            this.selectedSuggestions.clear();
            contentEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        });

        // Suggestions list
        const listContainer = contentEl.createDiv({cls: 'akl-suggestions-list'});
        listContainer.style.maxHeight = '400px';
        listContainer.style.overflowY = 'auto';
        listContainer.style.marginBottom = '1em';
        listContainer.style.border = '1px solid var(--background-modifier-border)';
        listContainer.style.borderRadius = '6px';
        listContainer.style.padding = '0.5em';

        this.suggestions.forEach((suggestion, index) => {
            const item = listContainer.createDiv({cls: 'akl-suggestion-item'});
            item.style.padding = '0.75em';
            item.style.marginBottom = '0.5em';
            item.style.background = 'var(--background-secondary)';
            item.style.borderRadius = '6px';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.gap = '0.75em';

            // Checkbox
            const checkbox = item.createEl('input', {type: 'checkbox'});
            checkbox.checked = true;
            checkbox.setAttribute('data-index', index.toString());
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectedSuggestions.add(index);
                } else {
                    this.selectedSuggestions.delete(index);
                }
            });

            // Content
            const content = item.createDiv({cls: 'akl-suggestion-content'});
            content.style.flex = '1';

            // Keyword and target
            const keywordLine = content.createDiv();
            keywordLine.style.marginBottom = '0.25em';
            keywordLine.createSpan({text: suggestion.matchText, cls: 'akl-keyword-highlight'});
            keywordLine.createSpan({text: ' → ', cls: 'akl-arrow'});
            keywordLine.createSpan({text: suggestion.targetNote, cls: 'akl-target-highlight'});

            // Line number and context
            const contextLine = content.createDiv();
            contextLine.style.fontSize = '0.9em';
            contextLine.style.color = 'var(--text-muted)';
            contextLine.createSpan({text: `Line ${suggestion.lineNumber + 1}`});

            // Style the highlighted keyword
            const highlights = keywordLine.querySelectorAll('.akl-keyword-highlight');
            highlights.forEach(h => {
                h.style.background = 'rgba(255, 170, 0, 0.25)';
                h.style.padding = '2px 4px';
                h.style.borderRadius = '3px';
                h.style.fontWeight = '500';
            });

            const targets = keywordLine.querySelectorAll('.akl-target-highlight');
            targets.forEach(t => {
                t.style.color = 'var(--text-accent)';
                t.style.fontWeight = '500';
            });
        });

        // Action buttons
        const actionContainer = contentEl.createDiv({cls: 'akl-action-buttons'});
        actionContainer.style.display = 'flex';
        actionContainer.style.gap = '0.5em';
        actionContainer.style.justifyContent = 'flex-end';

        const cancelBtn = actionContainer.createEl('button', {text: 'Cancel'});
        cancelBtn.addEventListener('click', () => this.close());

        const acceptBtn = actionContainer.createEl('button', {text: `Accept Selected (${this.selectedSuggestions.size})`, cls: 'mod-cta'});
        acceptBtn.addEventListener('click', () => {
            this.acceptSelected();
        });

        // Update button text when selections change
        const updateButtonText = () => {
            acceptBtn.textContent = `Accept Selected (${this.selectedSuggestions.size})`;
        };

        contentEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', updateButtonText);
        });
    }

    acceptSelected() {
        if (this.selectedSuggestions.size === 0) {
            new Notice('No suggestions selected');
            return;
        }

        // Sort by line number in reverse order (bottom to top)
        // This way we don't mess up line numbers as we modify the document
        const selectedIndices = Array.from(this.selectedSuggestions).sort((a, b) => {
            return this.suggestions[b].lineNumber - this.suggestions[a].lineNumber;
        });

        let acceptedCount = 0;

        selectedIndices.forEach(index => {
            const suggestion = this.suggestions[index];
            const line = this.editor.getLine(suggestion.lineNumber);

            // Check if suggestion still exists on this line
            if (!line.includes(suggestion.fullMatch)) return;

            // Check if current line is inside a table
            const content = this.editor.getValue();
            const lineStart = this.editor.posToOffset({ line: suggestion.lineNumber, ch: 0 });
            const plugin = this.app.plugins.plugins['auto-keyword-linker'];
            const insideTable = plugin ? plugin.isInsideTable(content, lineStart) : false;

            // Create the link
            let link;
            const targetWithBlock = suggestion.blockRef ? `${suggestion.targetNote}#${suggestion.blockRef}` : suggestion.targetNote;

            if (suggestion.useRelative) {
                // Use relative markdown link format
                // Escape pipe characters in the display text if inside a table to prevent breaking table columns
                const escapedMatchText = insideTable ? suggestion.matchText.replace(/\|/g, '\\|') : suggestion.matchText;
                const encodedTarget = encodeURIComponent(suggestion.targetNote) + '.md';
                const blockPart = suggestion.blockRef ? `#${suggestion.blockRef}` : '';
                link = `[${escapedMatchText}](${encodedTarget}${blockPart})`;
            } else {
                // Use wikilink format
                if (insideTable) {
                    // Inside tables: Escape the pipe with single backslash \| to prevent breaking table formatting
                    link = suggestion.targetNote === suggestion.matchText && !suggestion.blockRef
                        ? `[[${suggestion.matchText}]]`
                        : `[[${targetWithBlock}\\|${suggestion.matchText}]]`;
                } else {
                    // Outside table: standard wikilink format with | separator for alias
                    link = suggestion.targetNote === suggestion.matchText && !suggestion.blockRef
                        ? `[[${suggestion.matchText}]]`
                        : `[[${targetWithBlock}|${suggestion.matchText}]]`;
                }
            }

            // Replace the span with the link
            const newLine = line.replace(suggestion.fullMatch, link);
            this.editor.setLine(suggestion.lineNumber, newLine);
            acceptedCount++;
        });

        new Notice(`Accepted ${acceptedCount} link suggestion${acceptedCount > 1 ? 's' : ''}`);
        this.close();

        // Update status bar
        setTimeout(() => {
            const view = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (view && view.editor) {
                const plugin = this.app.plugins.plugins['auto-keyword-linker'];
                if (plugin && plugin.updateStatusBar) {
                    plugin.updateStatusBar();
                }
            }
        }, 100);
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}

module.exports = SuggestionReviewModal;
