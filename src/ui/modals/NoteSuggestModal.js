/**
 * Note Suggest Modal
 * Searchable note picker with fuzzy matching
 * Extracted from main-source.js (Session 6)
 */

const { FuzzySuggestModal } = require('obsidian');

class NoteSuggestModal extends FuzzySuggestModal {
    constructor(app, notes, currentValue, onChoose) {
        super(app);
        this.notes = notes;
        this.currentValue = currentValue;
        this.onChooseCallback = onChoose;
    }

    getItems() {
        return this.notes;
    }

    getItemText(note) {
        return note;
    }

    onChooseItem(note, evt) {
        this.onChooseCallback(note);
    }
}

module.exports = NoteSuggestModal;
