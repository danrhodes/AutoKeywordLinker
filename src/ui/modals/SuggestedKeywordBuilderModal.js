/**
 * Suggested Keyword Builder Modal
 * Analyzes notes and suggests keywords to add
 * Extracted from main-source.js (Session 5)
 */

const { Modal, Notice } = require('obsidian');

class SuggestedKeywordBuilderModal extends Modal {
    constructor(app, plugin, currentFile = null) {
        super(app);
        this.plugin = plugin;
        this.currentFile = currentFile; // If provided, analyze only this file
        this.suggestions = [];
        this.selectedSuggestions = new Map(); // keyword -> { selected: boolean, addAsVariationTo: string|null }
        this.isAnalyzing = true;
        this.searchQuery = '';
        this.sortOrder = 'frequency-desc'; // Default sort order
    }

    async onOpen() {
        const {contentEl} = this;
        contentEl.addClass('akl-suggestion-modal');

        // Title
        const titleText = this.currentFile
            ? `Suggested Keyword Builder - ${this.currentFile.basename}`
            : 'Suggested Keyword Builder';
        contentEl.createEl('h2', {text: titleText});

        // Status area
        const statusEl = contentEl.createDiv({cls: 'akl-status'});
        const analyzeText = this.currentFile
            ? 'Analyzing current note...'
            : 'Analyzing your notes...';
        statusEl.createEl('p', {text: analyzeText, cls: 'akl-analyzing'});

        // Start analysis
        try {
            // Use different analysis method based on scope
            if (this.currentFile) {
                this.suggestions = await this.plugin.analyzeCurrentNoteForKeywords(this.currentFile);
            } else {
                this.suggestions = await this.plugin.analyzeNotesForKeywords();
            }
            this.isAnalyzing = false;

            // Update status
            statusEl.empty();
            const noteCount = this.currentFile ? 1 : this.plugin.app.vault.getMarkdownFiles().length;
            const noteText = noteCount === 1 ? 'note' : 'notes';
            statusEl.createEl('p', {
                text: `Found ${this.suggestions.length} suggestions from ${noteCount} ${noteText}`,
                cls: 'akl-stats'
            });

            // Initialize selection state
            for (let suggestion of this.suggestions) {
                this.selectedSuggestions.set(suggestion.keyword, {
                    selected: false,
                    addAsVariationTo: null
                });
            }

            // Render the suggestions UI
            this.renderSuggestions(contentEl);

        } catch (error) {
            statusEl.empty();
            statusEl.createEl('p', {
                text: `Error analyzing notes: ${error.message}`,
                cls: 'akl-error'
            });
            console.error('Error analyzing notes:', error);
        }
    }

    renderSuggestions(container) {
        // Search and sort controls
        const controlsContainer = container.createDiv({cls: 'akl-controls-container'});

        // Search box
        const searchContainer = controlsContainer.createDiv({cls: 'akl-search-container'});
        const searchInput = searchContainer.createEl('input', {
            type: 'text',
            placeholder: 'Search suggestions...',
            cls: 'akl-search-input'
        });
        searchInput.value = this.searchQuery;
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.refreshSuggestionList();
        });

        // Sort order dropdown
        const sortContainer = controlsContainer.createDiv({cls: 'akl-sort-container'});
        const sortLabel = sortContainer.createEl('label', {
            text: 'Sort by: ',
            cls: 'akl-sort-label'
        });
        const sortSelect = sortContainer.createEl('select', {cls: 'akl-sort-select'});

        const sortOptions = [
            { value: 'frequency-desc', label: 'Most Common First' },
            { value: 'frequency-asc', label: 'Least Common First' },
            { value: 'alpha-asc', label: 'A to Z' },
            { value: 'alpha-desc', label: 'Z to A' },
            { value: 'length-asc', label: 'Shortest First' },
            { value: 'length-desc', label: 'Longest First' }
        ];

        for (let option of sortOptions) {
            const optionEl = sortSelect.createEl('option', {
                value: option.value,
                text: option.label
            });
            if (option.value === this.sortOrder) {
                optionEl.selected = true;
            }
        }

        sortSelect.addEventListener('change', (e) => {
            this.sortOrder = e.target.value;
            this.refreshSuggestionList();
        });

        // Selection buttons
        const buttonRow = container.createDiv({cls: 'akl-button-row'});
        const selectAllBtn = buttonRow.createEl('button', {text: 'Select All', cls: 'akl-mini-button'});
        selectAllBtn.addEventListener('click', () => {
            for (let [keyword, state] of this.selectedSuggestions) {
                if (this.matchesSearch(keyword)) {
                    state.selected = true;
                }
            }
            this.refreshSuggestionList();
        });

        const deselectAllBtn = buttonRow.createEl('button', {text: 'Deselect All', cls: 'akl-mini-button'});
        deselectAllBtn.addEventListener('click', () => {
            for (let [keyword, state] of this.selectedSuggestions) {
                if (this.matchesSearch(keyword)) {
                    state.selected = false;
                }
            }
            this.refreshSuggestionList();
        });

        // Suggestions list container
        this.suggestionsListEl = container.createDiv({cls: 'akl-suggestions-list'});
        this.refreshSuggestionList();

        // Action buttons
        const actionRow = container.createDiv({cls: 'akl-action-row'});

        const addBtn = actionRow.createEl('button', {text: 'Add Selected Keywords', cls: 'mod-cta'});
        addBtn.addEventListener('click', () => this.addSelectedKeywords());

        const cancelBtn = actionRow.createEl('button', {text: 'Cancel'});
        cancelBtn.addEventListener('click', () => this.close());
    }

    matchesSearch(keyword) {
        if (!this.searchQuery) return true;
        return keyword.toLowerCase().includes(this.searchQuery.toLowerCase());
    }

    sortSuggestions(suggestions) {
        const sorted = [...suggestions]; // Create a copy to avoid mutating original

        switch (this.sortOrder) {
            case 'frequency-desc':
                // Most common first (most notes)
                sorted.sort((a, b) => b.totalNotes - a.totalNotes);
                break;

            case 'frequency-asc':
                // Least common first (fewest notes)
                sorted.sort((a, b) => a.totalNotes - b.totalNotes);
                break;

            case 'alpha-asc':
                // A to Z
                sorted.sort((a, b) => a.keyword.localeCompare(b.keyword));
                break;

            case 'alpha-desc':
                // Z to A
                sorted.sort((a, b) => b.keyword.localeCompare(a.keyword));
                break;

            case 'length-asc':
                // Shortest first
                sorted.sort((a, b) => a.keyword.length - b.keyword.length);
                break;

            case 'length-desc':
                // Longest first
                sorted.sort((a, b) => b.keyword.length - a.keyword.length);
                break;

            default:
                // Default to frequency descending
                sorted.sort((a, b) => b.totalNotes - a.totalNotes);
        }

        return sorted;
    }

    refreshSuggestionList() {
        if (!this.suggestionsListEl) return;

        this.suggestionsListEl.empty();

        // Filter suggestions based on search
        let filteredSuggestions = this.suggestions.filter(s => this.matchesSearch(s.keyword));

        if (filteredSuggestions.length === 0) {
            this.suggestionsListEl.createEl('p', {
                text: 'No suggestions match your search.',
                cls: 'akl-no-results'
            });
            return;
        }

        // Sort suggestions based on selected sort order
        filteredSuggestions = this.sortSuggestions(filteredSuggestions);

        // Render each suggestion
        for (let suggestion of filteredSuggestions) {
            const state = this.selectedSuggestions.get(suggestion.keyword);

            const itemDiv = this.suggestionsListEl.createDiv({cls: 'akl-suggestion-item'});

            // Checkbox and label
            const headerDiv = itemDiv.createDiv({cls: 'akl-suggestion-header'});

            const checkbox = headerDiv.createEl('input', {type: 'checkbox', cls: 'akl-checkbox'});
            checkbox.checked = state.selected;
            checkbox.addEventListener('change', (e) => {
                state.selected = e.target.checked;
            });

            const labelDiv = headerDiv.createDiv({cls: 'akl-suggestion-label'});
            labelDiv.createSpan({text: suggestion.keyword, cls: 'akl-keyword-text'});
            labelDiv.createSpan({text: ` (${suggestion.totalNotes} notes)`, cls: 'akl-count-text'});

            // Notes preview
            if (suggestion.notes.length > 0) {
                const notesDiv = itemDiv.createDiv({cls: 'akl-notes-preview'});
                notesDiv.createEl('span', {text: 'In: ', cls: 'akl-notes-label'});
                notesDiv.createEl('span', {
                    text: suggestion.notes.join(', ') + (suggestion.totalNotes > 5 ? '...' : ''),
                    cls: 'akl-notes-list'
                });
            }

            // Variation selector
            const variationDiv = itemDiv.createDiv({cls: 'akl-variation-selector'});
            variationDiv.createEl('span', {text: 'Or add as variation to: ', cls: 'akl-variation-label'});

            const select = variationDiv.createEl('select', {cls: 'akl-variation-dropdown'});
            const noneOption = select.createEl('option', {value: '', text: '(None - add as new keyword)'});

            // Add existing keywords as options
            for (let existingKeyword of this.plugin.settings.keywords) {
                if (existingKeyword.keyword.toLowerCase() !== suggestion.keyword.toLowerCase()) {
                    select.createEl('option', {
                        value: existingKeyword.keyword,
                        text: existingKeyword.keyword
                    });
                }
            }

            select.value = state.addAsVariationTo || '';
            select.addEventListener('change', (e) => {
                state.addAsVariationTo = e.target.value || null;
                if (e.target.value) {
                    checkbox.checked = true;
                    state.selected = true;
                }
            });
        }
    }

    async addSelectedKeywords() {
        let addedCount = 0;
        let variationCount = 0;

        for (let [keyword, state] of this.selectedSuggestions) {
            if (!state.selected) continue;

            if (state.addAsVariationTo) {
                // Add as variation to existing keyword
                const existingKeyword = this.plugin.settings.keywords.find(
                    k => k.keyword === state.addAsVariationTo
                );
                if (existingKeyword) {
                    if (!existingKeyword.variations) {
                        existingKeyword.variations = [];
                    }
                    if (!existingKeyword.variations.includes(keyword)) {
                        existingKeyword.variations.push(keyword);
                        variationCount++;
                    }
                }
            } else {
                // Add as new keyword
                this.plugin.settings.keywords.push({
                    keyword: keyword,
                    target: keyword,
                    variations: [],
                    enableTags: false,
                    linkScope: 'vault-wide',
                    scopeFolder: ''
                });
                addedCount++;
            }
        }

        // Save settings
        await this.plugin.saveSettings();

        // Show result
        let message = '';
        if (addedCount > 0 && variationCount > 0) {
            message = `Added ${addedCount} new keyword(s) and ${variationCount} variation(s)`;
        } else if (addedCount > 0) {
            message = `Added ${addedCount} new keyword(s)`;
        } else if (variationCount > 0) {
            message = `Added ${variationCount} variation(s)`;
        } else {
            message = 'No keywords selected';
        }

        new Notice(message);
        this.close();
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}

module.exports = SuggestedKeywordBuilderModal;
