/**
 * Import Modal
 * Handles importing keywords from JSON files
 * Extracted from main-source.js (Session 5)
 */

const { Modal, Notice } = require('obsidian');

class ImportModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.createEl('h2', {text: 'Import Keywords from JSON'});

        contentEl.createEl('p', {
            text: 'Select a JSON file from your vault to import keywords. This will ADD to your existing keywords.'
        });

        // Get all JSON files in vault
        const jsonFiles = this.app.vault.getFiles().filter(f => f.extension === 'json');

        if (jsonFiles.length === 0) {
            contentEl.createEl('p', {
                text: 'No JSON files found in vault. Please create an export first.',
                cls: 'mod-warning'
            });

            const closeBtn = contentEl.createEl('button', {text: 'Close'});
            closeBtn.addEventListener('click', () => this.close());
            return;
        }

        const dropdown = contentEl.createEl('select');
        dropdown.style.width = '100%';
        dropdown.style.marginBottom = '10px';

        for (let file of jsonFiles) {
            const option = dropdown.createEl('option', {
                text: file.path,
                value: file.path
            });
        }

        const buttonDiv = contentEl.createDiv();
        buttonDiv.style.display = 'flex';
        buttonDiv.style.gap = '10px';
        buttonDiv.style.marginTop = '20px';

        const importBtn = buttonDiv.createEl('button', {text: 'Import', cls: 'mod-cta'});
        importBtn.addEventListener('click', async () => {
            const selectedPath = dropdown.value;
            const file = this.app.vault.getAbstractFileByPath(selectedPath);

            if (file) {
                try {
                    const content = await this.app.vault.read(file);
                    const imported = JSON.parse(content);

                    if (!Array.isArray(imported)) {
                        new Notice('Invalid JSON format: expected an array of keywords');
                        return;
                    }

                    // Add imported keywords to existing ones, checking for duplicates
                    let addedCount = 0;
                    let mergedCount = 0;

                    for (let item of imported) {
                        // Ensure enableTags field exists
                        if (item.enableTags === undefined) {
                            item.enableTags = false;
                        }

                        // Check if this keyword already exists (case-insensitive)
                        const existingIndex = this.plugin.settings.keywords.findIndex(
                            k => k.keyword.toLowerCase() === item.keyword.toLowerCase()
                        );

                        if (existingIndex !== -1) {
                            // Keyword exists - merge variations
                            const existing = this.plugin.settings.keywords[existingIndex];

                            // Ensure variations arrays exist
                            if (!existing.variations) existing.variations = [];
                            if (!item.variations) item.variations = [];

                            // Merge variations, avoiding duplicates (case-insensitive)
                            const existingVariationsLower = existing.variations.map(v => v.toLowerCase());
                            const newVariations = item.variations.filter(
                                v => !existingVariationsLower.includes(v.toLowerCase())
                            );

                            if (newVariations.length > 0) {
                                existing.variations.push(...newVariations);
                                mergedCount++;
                            }
                        } else {
                            // New keyword - add it
                            this.plugin.settings.keywords.push(item);
                            addedCount++;
                        }
                    }

                    await this.plugin.saveSettings();

                    // Build informative message
                    let message = '';
                    if (addedCount > 0 && mergedCount > 0) {
                        message = `Imported: ${addedCount} new keyword(s), merged variations into ${mergedCount} existing keyword(s)`;
                    } else if (addedCount > 0) {
                        message = `Imported ${addedCount} new keyword(s)`;
                    } else if (mergedCount > 0) {
                        message = `Merged variations into ${mergedCount} existing keyword(s)`;
                    } else {
                        message = `No new keywords or variations to import`;
                    }

                    new Notice(message);
                    this.close();

                    // Refresh settings tab if open
                    this.app.setting.close();
                    this.app.setting.open();
                    this.app.setting.openTabById(this.plugin.manifest.id);
                } catch (error) {
                    new Notice(`Import failed: ${error.message}`);
                }
            }
        });

        const closeBtn = buttonDiv.createEl('button', {text: 'Cancel'});
        closeBtn.addEventListener('click', () => this.close());
    }

    onClose() {
        const {contentEl} = this;
        contentEl.empty();
    }
}

module.exports = ImportModal;
