/**
 * Related Preview Modal
 * Shows the related blocks that "Update related sections" would write, and applies them
 */

const { Modal, Notice } = require('obsidian');
const { applyRelatedUpdates } = require('../../utils/cooccurrence');

class RelatedPreviewModal extends Modal {
    /**
     * @param {App} app - Obsidian app instance
     * @param {Array<Object>} updates - From planRelatedUpdates()
     */
    constructor(app, updates) {
        super(app);
        this.updates = updates;
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.addClass('akl-related-modal');

        contentEl.createEl('h2', {text: 'Update related sections'});
        contentEl.createEl('p', {
            text: `${this.updates.length} note${this.updates.length !== 1 ? 's' : ''} will change. Only the text between the akl-related markers is touched.`
        });

        const list = contentEl.createDiv({cls: 'akl-related-preview-list'});
        for (const update of this.updates) {
            const item = list.createDiv({cls: 'akl-related-preview-item'});
            item.createEl('strong', {text: update.file.path});

            const columns = item.createDiv({cls: 'akl-related-preview-columns'});
            const before = columns.createDiv();
            before.createEl('small', {text: 'Before'});
            before.createEl('pre', {text: update.oldBlock || '(no related section)'});
            const after = columns.createDiv();
            after.createEl('small', {text: 'After'});
            after.createEl('pre', {text: update.newBlock || '(related section removed)'});
        }

        const buttons = contentEl.createDiv({cls: 'modal-button-container'});
        buttons.createEl('button', {text: 'Cancel'}).addEventListener('click', () => this.close());
        const applyBtn = buttons.createEl('button', {text: `Update ${this.updates.length} note${this.updates.length !== 1 ? 's' : ''}`, cls: 'mod-cta'});
        applyBtn.addEventListener('click', async () => {
            applyBtn.disabled = true;
            const changed = await applyRelatedUpdates(this.app, this.updates);
            new Notice(`Updated related sections in ${changed} note${changed !== 1 ? 's' : ''}`);
            this.close();
        });
    }

    onClose() {
        this.contentEl.empty();
    }
}

module.exports = RelatedPreviewModal;
