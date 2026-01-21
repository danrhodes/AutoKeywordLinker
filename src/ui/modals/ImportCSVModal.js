/**
 * Import CSV Modal
 * Handles importing keywords from CSV files
 * Extracted from main-source.js (Session 5)
 */

const { Modal, Notice } = require('obsidian');
const { parseCSVLine } = require('../../utils/helpers');

class ImportCSVModal extends Modal {
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const {contentEl} = this;
        contentEl.createEl('h2', {text: 'Import Keywords from CSV'});

        contentEl.createEl('p', {
            text: 'Select a CSV file from your vault to import keywords. This will ADD to your existing keywords.'
        });

        // Get all CSV files in vault
        const csvFiles = this.app.vault.getFiles().filter(f => f.extension === 'csv');

        if (csvFiles.length === 0) {
            contentEl.createEl('p', {
                text: 'No CSV files found in vault. Download a template first or export existing keywords.',
                cls: 'mod-warning'
            });

            const closeBtn = contentEl.createEl('button', {text: 'Close'});
            closeBtn.addEventListener('click', () => this.close());
            return;
        }

        const dropdown = contentEl.createEl('select');
        dropdown.style.width = '100%';
        dropdown.style.marginBottom = '10px';

        for (let file of csvFiles) {
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
                    const lines = content.split('\n').filter(line => line.trim());

                    if (lines.length === 0) {
                        new Notice('CSV file is empty');
                        return;
                    }

                    // Parse header
                    const headers = parseCSVLine(lines[0]);
                    const headerMap = {};
                    headers.forEach((header, index) => {
                        headerMap[header.toLowerCase()] = index;
                    });

                    // Validate required headers
                    if (headerMap['keyword'] === undefined || headerMap['target'] === undefined) {
                        new Notice('CSV must have "keyword" and "target" columns');
                        return;
                    }

                    let addedCount = 0;
                    let updatedCount = 0;
                    let errorCount = 0;
                    const errors = [];

                    // Parse data rows
                    for (let i = 1; i < lines.length; i++) {
                        const lineNum = i + 1;
                        try {
                            const fields = parseCSVLine(lines[i]);

                            // Skip empty rows
                            if (fields.length === 0 || !fields[headerMap['keyword']]) {
                                continue;
                            }

                            const keyword = fields[headerMap['keyword']] || '';
                            const target = fields[headerMap['target']] || '';

                            if (!keyword.trim() || !target.trim()) {
                                errors.push(`Line ${lineNum}: Missing keyword or target`);
                                errorCount++;
                                continue;
                            }

                            // Parse variations (pipe-separated)
                            const variationsStr = fields[headerMap['variations']] || '';
                            const variations = variationsStr
                                ? variationsStr.split('|').map(v => v.trim()).filter(v => v)
                                : [];

                            // Parse boolean fields
                            const parseBool = (value) => {
                                if (typeof value === 'boolean') return value;
                                const str = String(value).toLowerCase().trim();
                                return str === 'true' || str === 'yes' || str === '1';
                            };

                            // Build keyword object
                            const keywordObj = {
                                keyword: keyword.trim(),
                                target: target.trim(),
                                variations: variations,
                                enableTags: parseBool(fields[headerMap['enabletags']] || false),
                                linkScope: fields[headerMap['linkscope']] || 'vault-wide',
                                scopeFolder: fields[headerMap['scopefolder']] || '',
                                useRelativeLinks: parseBool(fields[headerMap['userelativelinks']] || false),
                                blockRef: fields[headerMap['blockref']] || '',
                                requireTag: fields[headerMap['requiretag']] || '',
                                onlyInNotesLinkingTo: parseBool(fields[headerMap['onlyinnoteslinkingto']] || false),
                                suggestMode: parseBool(fields[headerMap['suggestmode']] || false),
                                preventSelfLink: parseBool(fields[headerMap['preventselflink']] || false)
                            };

                            // Check if keyword already exists
                            const existingIndex = this.plugin.settings.keywords.findIndex(
                                k => k.keyword.toLowerCase() === keywordObj.keyword.toLowerCase()
                            );

                            if (existingIndex !== -1) {
                                // Update existing keyword with new field values
                                const existing = this.plugin.settings.keywords[existingIndex];
                                let hasChanges = false;

                                // Compare and update all fields (except keyword name)
                                const fieldsToCompare = [
                                    'target', 'enableTags', 'linkScope', 'scopeFolder',
                                    'useRelativeLinks', 'blockRef', 'requireTag',
                                    'onlyInNotesLinkingTo', 'suggestMode', 'preventSelfLink'
                                ];

                                for (const field of fieldsToCompare) {
                                    if (existing[field] !== keywordObj[field]) {
                                        existing[field] = keywordObj[field];
                                        hasChanges = true;
                                    }
                                }

                                // Merge variations (add new ones, keep existing)
                                const existingVars = new Set(existing.variations.map(v => v.toLowerCase()));
                                for (let variation of keywordObj.variations) {
                                    if (!existingVars.has(variation.toLowerCase())) {
                                        existing.variations.push(variation);
                                        hasChanges = true;
                                    }
                                }

                                if (hasChanges) {
                                    updatedCount++;
                                }
                            } else {
                                // Add new keyword
                                this.plugin.settings.keywords.push(keywordObj);
                                addedCount++;
                            }

                        } catch (rowError) {
                            errors.push(`Line ${lineNum}: ${rowError.message}`);
                            errorCount++;
                        }
                    }

                    // Save settings
                    await this.plugin.saveSettings();

                    // Build result message
                    let message = '';
                    if (addedCount > 0 && updatedCount > 0) {
                        message = `Added ${addedCount} new keyword(s), updated ${updatedCount} existing keyword(s)`;
                    } else if (addedCount > 0) {
                        message = `Added ${addedCount} new keyword(s)`;
                    } else if (updatedCount > 0) {
                        message = `Updated ${updatedCount} existing keyword(s)`;
                    } else {
                        message = `No changes to import`;
                    }

                    if (errorCount > 0) {
                        message += `\n${errorCount} error(s) encountered`;
                        console.error('CSV Import Errors:', errors);
                    }

                    new Notice(message);
                    this.close();

                    // Refresh settings tab if open
                    this.app.setting.close();
                    this.app.setting.open();
                    this.app.setting.openTabById(this.plugin.manifest.id);

                } catch (error) {
                    new Notice(`Import failed: ${error.message}`);
                    console.error('CSV Import Error:', error);
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

module.exports = ImportCSVModal;
