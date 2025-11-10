/**
 * Folder Suggest Modal
 * Searchable folder picker with fuzzy matching
 * Extracted from main-source.js (Session 6)
 */

const { FuzzySuggestModal } = require('obsidian');

class FolderSuggestModal extends FuzzySuggestModal {
    constructor(app, folders, currentValue, onChoose) {
        super(app);
        this.folders = folders;
        this.currentValue = currentValue;
        this.onChooseCallback = onChoose;
    }

    getItems() {
        return this.folders;
    }

    getItemText(folder) {
        return folder || '/ (Root)';
    }

    onChooseItem(folder, evt) {
        this.onChooseCallback(folder);
    }
}

module.exports = FolderSuggestModal;
