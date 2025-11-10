/**
 * Preview Modal
 * Shows preview of keyword linking changes before applying
 * Extracted from main-source.js (Session 5)
 */

const { Modal } = require('obsidian');

class PreviewModal extends Modal {
    /**
     * @param {App} app - Obsidian app instance
     * @param {Object} results - Results object from linkKeywordsInFile
     * @param {string} fileName - Name of the file being previewed
     */
    constructor(app, results, fileName) {
        super(app);
        this.results = results;
        this.fileName = fileName;
    }

    /**
     * Called when the modal is opened
     * Builds the modal content
     */
    onOpen() {
        const {contentEl} = this;

        // Add title showing which file is being previewed
        contentEl.createEl('h2', {text: `Preview: ${this.fileName}`});

        // Show count of keywords found
        contentEl.createEl('p', {text: `Found ${this.results.linkCount} keyword(s) to link:`});

        // Create list of changes
        const list = contentEl.createEl('ul');
        for (let change of this.results.changes) {
            const item = list.createEl('li');

            // Show the keyword in bold
            item.createEl('strong', {text: change.keyword});
            item.appendText(` → `);

            // Show what it will be linked to
            item.createEl('code', {text: `[[${change.target}]]`});
            item.createEl('br');

            // Show surrounding context
            item.createEl('small', {text: change.context, cls: 'preview-context'});
        }

        // Create button container
        const buttonDiv = contentEl.createDiv({cls: 'modal-button-container'});
        buttonDiv.style.marginTop = '20px';
        buttonDiv.style.display = 'flex';
        buttonDiv.style.gap = '10px';

        // Add close button
        const closeBtn = buttonDiv.createEl('button', {text: 'Close'});
        closeBtn.addEventListener('click', () => this.close());
    }

    /**
     * Called when the modal is closed
     * Clean up the modal content
     */
    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}

module.exports = PreviewModal;
