/**
 * Bulk Preview Modal
 * Previews keyword linking changes across multiple notes
 * Extracted from main-source.js (Session 5)
 */

const { Modal, Notice } = require('obsidian');

class BulkPreviewModal extends Modal {
    /**
     * @param {App} app - Obsidian app instance
     * @param {Array} results - Array of result objects from linkKeywordsInFile
     * @param {Plugin} plugin - Reference to the plugin instance (for applying changes)
     */
    constructor(app, results, plugin) {
        super(app);
        this.results = results;
        this.plugin = plugin;
        // Track which specific links are selected for processing
        // Format: Map<noteIndex, Set<changeIndex>>
        this.selectedLinks = new Map();

        // Initialize all links as selected by default
        this.results.forEach((result, noteIndex) => {
            const linkIndices = new Set(result.changes.map((_, i) => i));
            this.selectedLinks.set(noteIndex, linkIndices);
        });
    }

    /**
     * Called when the modal is opened
     * Builds the modal content
     */
    onOpen() {
        const {contentEl} = this;
        contentEl.createEl('h2', {text: 'Preview: Select Links to Create'});

        // Calculate and show total statistics
        const totalLinks = this.results.reduce((sum, r) => sum + r.linkCount, 0);
        const initialSelectedCount = this.getSelectedLinksCount();
        const statsText = `Found ${totalLinks} link(s) in ${this.results.length} note(s). ${initialSelectedCount} link(s) selected.`;
        const statsEl = contentEl.createEl('p', {text: statsText, cls: 'bulk-preview-stats'});

        // Select/Deselect all buttons
        const selectButtonsDiv = contentEl.createDiv({cls: 'bulk-preview-select-buttons'});
        selectButtonsDiv.style.marginBottom = '15px';
        selectButtonsDiv.style.display = 'flex';
        selectButtonsDiv.style.gap = '10px';

        const selectAllBtn = selectButtonsDiv.createEl('button', {text: 'Select All Links'});
        selectAllBtn.addEventListener('click', () => {
            this.results.forEach((result, noteIndex) => {
                const linkIndices = new Set(result.changes.map((_, i) => i));
                this.selectedLinks.set(noteIndex, linkIndices);
            });
            contentEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
            this.updateStats(statsEl);
        });

        const deselectAllBtn = selectButtonsDiv.createEl('button', {text: 'Deselect All Links'});
        deselectAllBtn.addEventListener('click', () => {
            this.selectedLinks.clear();
            contentEl.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            this.updateStats(statsEl);
        });

        // Create scrollable container for results
        const scrollDiv = contentEl.createDiv({cls: 'preview-scroll'});
        scrollDiv.style.maxHeight = '400px';
        scrollDiv.style.overflowY = 'auto';
        scrollDiv.style.marginBottom = '20px';
        scrollDiv.style.border = '1px solid var(--background-modifier-border)';
        scrollDiv.style.borderRadius = '6px';
        scrollDiv.style.padding = '10px';

        // Display results for each file with individual link checkboxes
        this.results.forEach((result, noteIndex) => {
            const noteDiv = scrollDiv.createDiv({cls: 'preview-note'});
            noteDiv.style.marginBottom = '15px';
            noteDiv.style.padding = '10px';
            noteDiv.style.background = 'var(--background-secondary)';
            noteDiv.style.borderRadius = '6px';

            // Note header with select all checkbox
            const noteHeader = noteDiv.createDiv();
            noteHeader.style.display = 'flex';
            noteHeader.style.alignItems = 'center';
            noteHeader.style.gap = '10px';
            noteHeader.style.marginBottom = '10px';

            // Master checkbox for this note (selects/deselects all links in note)
            const noteCheckbox = noteHeader.createEl('input', {type: 'checkbox'});
            noteCheckbox.checked = true;
            noteCheckbox.setAttribute('data-note-index', noteIndex.toString());
            noteCheckbox.addEventListener('change', (e) => {
                const checked = e.target.checked;
                const linkSet = this.selectedLinks.get(noteIndex) || new Set();

                if (checked) {
                    // Select all links in this note
                    result.changes.forEach((_, linkIndex) => linkSet.add(linkIndex));
                    this.selectedLinks.set(noteIndex, linkSet);
                    // Check all link checkboxes
                    contentEl.querySelectorAll(`input[data-note="${noteIndex}"]`).forEach(cb => cb.checked = true);
                } else {
                    // Deselect all links in this note
                    this.selectedLinks.delete(noteIndex);
                    // Uncheck all link checkboxes
                    contentEl.querySelectorAll(`input[data-note="${noteIndex}"]`).forEach(cb => cb.checked = false);
                }
                this.updateStats(statsEl);
            });

            // Note title and count
            const noteTitleDiv = noteHeader.createDiv();
            noteTitleDiv.style.flex = '1';
            noteTitleDiv.createEl('strong', {text: result.fileName});
            noteTitleDiv.createEl('span', {
                text: ` (${result.linkCount} link${result.linkCount !== 1 ? 's' : ''})`,
                cls: 'bulk-preview-link-count'
            });

            // Links list with individual checkboxes
            const linksList = noteDiv.createDiv();
            linksList.style.marginLeft = '30px';

            result.changes.forEach((change, linkIndex) => {
                const linkItem = linksList.createDiv();
                linkItem.style.display = 'flex';
                linkItem.style.alignItems = 'flex-start';
                linkItem.style.gap = '8px';
                linkItem.style.marginBottom = '8px';
                linkItem.style.padding = '4px';
                linkItem.style.borderRadius = '4px';
                linkItem.style.transition = 'background 0.2s';

                linkItem.addEventListener('mouseenter', () => {
                    linkItem.style.background = 'var(--background-modifier-hover)';
                });
                linkItem.addEventListener('mouseleave', () => {
                    linkItem.style.background = 'transparent';
                });

                // Individual link checkbox
                const linkCheckbox = linkItem.createEl('input', {type: 'checkbox'});
                linkCheckbox.checked = true;
                linkCheckbox.setAttribute('data-note', noteIndex.toString());
                linkCheckbox.setAttribute('data-link', linkIndex.toString());
                linkCheckbox.style.marginTop = '2px';
                linkCheckbox.addEventListener('change', (e) => {
                    const linkSet = this.selectedLinks.get(noteIndex) || new Set();

                    if (e.target.checked) {
                        linkSet.add(linkIndex);
                    } else {
                        linkSet.delete(linkIndex);
                    }

                    if (linkSet.size === 0) {
                        this.selectedLinks.delete(noteIndex);
                    } else {
                        this.selectedLinks.set(noteIndex, linkSet);
                    }

                    // Update note-level checkbox state
                    const allChecked = result.changes.every((_, i) => {
                        const set = this.selectedLinks.get(noteIndex);
                        return set && set.has(i);
                    });
                    noteCheckbox.checked = allChecked;

                    this.updateStats(statsEl);
                });

                // Link content
                const linkContent = linkItem.createDiv();
                linkContent.style.flex = '1';
                linkContent.style.fontSize = '0.9em';

                const linkText = linkContent.createDiv();
                linkText.createEl('strong', {text: change.keyword});
                linkText.appendText(' → ');
                linkText.createEl('code', {text: `[[${change.target}]]`});

                // Show line number if available
                if (change.lineNumber !== undefined) {
                    const lineInfo = linkContent.createDiv();
                    lineInfo.style.fontSize = '0.85em';
                    lineInfo.style.color = 'var(--text-muted)';
                    lineInfo.style.marginTop = '2px';
                    lineInfo.textContent = `Line ${change.lineNumber + 1}`;
                }
            });
        });

        // Create button container
        const buttonDiv = contentEl.createDiv({cls: 'modal-button-container'});
        buttonDiv.style.display = 'flex';
        buttonDiv.style.gap = '10px';
        buttonDiv.style.justifyContent = 'flex-end';
        buttonDiv.style.marginTop = '20px';

        // Add "Cancel" button
        const closeBtn = buttonDiv.createEl('button', {text: 'Cancel'});
        closeBtn.addEventListener('click', () => this.close());

        // Add "Apply Selected Links" button (primary action)
        const selectedCount = this.getSelectedLinksCount();
        const applyBtn = buttonDiv.createEl('button', {text: `Apply Selected Links (${selectedCount})`, cls: 'mod-cta'});
        applyBtn.addEventListener('click', async () => {
            await this.applySelected();
        });

        // Store button reference to update text
        this.applyBtn = applyBtn;
    }

    /**
     * Update the statistics text
     */
    updateStats(statsEl) {
        const totalLinks = this.results.reduce((sum, r) => sum + r.linkCount, 0);
        const selectedCount = this.getSelectedLinksCount();
        statsEl.textContent = `Found ${totalLinks} link(s) in ${this.results.length} note(s). ${selectedCount} link(s) selected.`;

        // Update button text
        if (this.applyBtn) {
            this.applyBtn.textContent = `Apply Selected Links (${selectedCount})`;
        }
    }

    /**
     * Get total count of selected links across all notes
     */
    getSelectedLinksCount() {
        let total = 0;
        for (const linkSet of this.selectedLinks.values()) {
            total += linkSet.size;
        }
        return total;
    }

    /**
     * Apply only the selected links to their respective notes
     */
    async applySelected() {
        if (this.selectedLinks.size === 0) {
            new Notice('No links selected');
            return;
        }

        this.close();

        const totalSelectedLinks = this.getSelectedLinksCount();
        new Notice(`Creating ${totalSelectedLinks} link(s)...`);

        let totalLinksCreated = 0;
        let notesProcessed = 0;

        // Process each note that has selected links
        for (const [noteIndex, linkIndices] of this.selectedLinks) {
            if (linkIndices.size === 0) continue;

            const result = this.results[noteIndex];
            if (!result || !result.file) continue;

            const file = result.file;

            // Get the selected keywords/targets for this note
            const selectedChanges = result.changes.filter((_, i) => linkIndices.has(i));

            // Create a temporary keyword filter set
            const selectedKeywords = new Set(selectedChanges.map(c => c.keyword.toLowerCase()));

            // Temporarily modify the plugin's keyword map to only include selected keywords
            const originalBuildKeywordMap = this.plugin.buildKeywordMap.bind(this.plugin);

            this.plugin.buildKeywordMap = () => {
                const fullMap = originalBuildKeywordMap();
                const filteredMap = {};

                for (const [key, value] of Object.entries(fullMap)) {
                    if (selectedKeywords.has(key.toLowerCase())) {
                        filteredMap[key] = value;
                    }
                }

                return filteredMap;
            };

            try {
                // Process the file with only the selected keywords
                const processResult = await this.plugin.linkKeywordsInFile(file, false);

                if (processResult && processResult.changed) {
                    totalLinksCreated += processResult.linkCount;
                    notesProcessed++;
                }
            } finally {
                // Restore the original buildKeywordMap function
                this.plugin.buildKeywordMap = originalBuildKeywordMap;
            }
        }

        // Update statistics
        this.plugin.settings.statistics.totalLinksCreated += totalLinksCreated;
        this.plugin.settings.statistics.totalNotesProcessed += notesProcessed;
        this.plugin.settings.statistics.lastRunDate = new Date().toISOString();
        await this.plugin.saveSettings();

        // Show summary
        new Notice(`✓ Processed ${notesProcessed} note(s), created ${totalLinksCreated} link(s)`);
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

module.exports = BulkPreviewModal;
