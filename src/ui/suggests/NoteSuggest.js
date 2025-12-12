/**
 * Note Input Suggest
 * Provides type-ahead note selection using AbstractInputSuggest
 */

const { AbstractInputSuggest } = require('obsidian');

class NoteSuggest extends AbstractInputSuggest {
    constructor(app, inputEl, notes) {
        super(app, inputEl);
        this.notes = notes;
    }

    getSuggestions(query) {
        const lowerQuery = query.toLowerCase();

        // Filter notes that match the query
        const filtered = this.notes.filter(note =>
            note.toLowerCase().includes(lowerQuery)
        );

        // Sort by relevance (starts with query first, then contains)
        return filtered.sort((a, b) => {
            const aLower = a.toLowerCase();
            const bLower = b.toLowerCase();
            const aStarts = aLower.startsWith(lowerQuery);
            const bStarts = bLower.startsWith(lowerQuery);

            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return aLower.localeCompare(bLower);
        });
    }

    renderSuggestion(note, el) {
        el.setText(note);
    }

    selectSuggestion(note, evt) {
        this.inputEl.value = note;
        this.inputEl.trigger('input');
        this.close();
    }
}

module.exports = NoteSuggest;
