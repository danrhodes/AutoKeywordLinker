/**
 * Statistics Modal
 * Displays plugin usage statistics
 * Extracted from main-source.js (Session 5)
 */

const { Modal } = require('obsidian');

class StatisticsModal extends Modal {
    constructor(app, settings) {
        super(app);
        this.settings = settings;
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.createEl('h2', {text: 'Auto Keyword Linker Statistics'});

        const stats = this.settings.statistics;

        contentEl.createEl('p', {
            text: `Total Links Created: ${stats.totalLinksCreated || 0}`
        });

        contentEl.createEl('p', {
            text: `Total Notes Processed: ${stats.totalNotesProcessed || 0}`
        });

        contentEl.createEl('p', {
            text: `Total Keywords Configured: ${this.settings.keywords.length}`
        });

        if (stats.lastRunDate) {
            const date = new Date(stats.lastRunDate);
            contentEl.createEl('p', {
                text: `Last Run: ${date.toLocaleString()}`
            });
        }

        // Keyword usage breakdown
        contentEl.createEl('h3', {text: 'Configured Keywords'});
        const list = contentEl.createEl('ul');
        for (let keyword of this.settings.keywords) {
            const item = list.createEl('li');
            item.appendText(`${keyword.keyword} → ${keyword.target}`);
            if (keyword.variations && keyword.variations.length > 0) {
                item.appendText(` (${keyword.variations.length} variations)`);
            }
            if (keyword.enableTags) {
                item.appendText(` [Tags enabled]`);
            }
        }

        const closeBtn = contentEl.createEl('button', {text: 'Close'});
        closeBtn.style.marginTop = '20px';
        closeBtn.addEventListener('click', () => this.close());
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}

module.exports = StatisticsModal;
