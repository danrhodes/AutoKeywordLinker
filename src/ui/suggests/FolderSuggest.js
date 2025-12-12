/**
 * Folder Input Suggest
 * Provides type-ahead folder selection using AbstractInputSuggest
 */

const { AbstractInputSuggest } = require('obsidian');

class FolderSuggest extends AbstractInputSuggest {
    constructor(app, inputEl, folders) {
        super(app, inputEl);
        this.folders = folders;
    }

    getSuggestions(query) {
        const lowerQuery = query.toLowerCase();

        // Filter folders that match the query
        const filtered = this.folders.filter(folder => {
            const folderDisplay = folder || '/ (Root)';
            return folderDisplay.toLowerCase().includes(lowerQuery);
        });

        // Sort by relevance (starts with query first, then contains)
        return filtered.sort((a, b) => {
            const aDisplay = (a || '/ (Root)').toLowerCase();
            const bDisplay = (b || '/ (Root)').toLowerCase();
            const aStarts = aDisplay.startsWith(lowerQuery);
            const bStarts = bDisplay.startsWith(lowerQuery);

            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return aDisplay.localeCompare(bDisplay);
        });
    }

    renderSuggestion(folder, el) {
        el.setText(folder || '/ (Root)');
    }

    selectSuggestion(folder, evt) {
        this.inputEl.value = folder || '/ (Root)';
        this.inputEl.trigger('input');
        this.close();
    }
}

module.exports = FolderSuggest;
