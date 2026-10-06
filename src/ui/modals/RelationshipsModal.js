/**
 * Relationships Modal
 * Report of keyword targets that keep appearing together, with actions to link or dismiss each pair
 */

const { Modal, Notice } = require('obsidian');
const { analyzeCooccurrence, planRelatedUpdates, applyRelatedUpdates, pairInList } = require('../../utils/cooccurrence');

// Most rows to render at once (the strongest pairs come first)
const MAX_ROWS = 200;

class RelationshipsModal extends Modal {
    /**
     * @param {App} app - Obsidian app instance
     * @param {Plugin} plugin - Reference to the plugin instance
     */
    constructor(app, plugin) {
        super(app);
        this.plugin = plugin;
        this.minNotes = plugin.settings.relatedMinNotes || 3;
        this.unlinkedOnly = true;
        this.analysis = null;
    }

    async onOpen() {
        const {contentEl} = this;
        contentEl.addClass('akl-related-modal');
        contentEl.createEl('h2', {text: 'Keyword relationships'});
        contentEl.createEl('p', {text: 'Scanning links in your vault...', cls: 'akl-related-status'});

        this.analysis = await analyzeCooccurrence(this.app, this.plugin.settings);
        this.render();
    }

    /**
     * Get a note's display name from its path
     * @param {string} path - Note path
     * @returns {string} Basename
     */
    noteName(path) {
        return path.split('/').pop().replace(/\.md$/, '');
    }

    render() {
        const {contentEl} = this;
        const settings = this.plugin.settings;
        contentEl.empty();
        contentEl.createEl('h2', {text: 'Keyword relationships'});
        contentEl.createEl('p', {
            text: 'Keyword target notes that are linked together in your notes. "Same paragraph" counts most; notes that link many targets (dailies, indexes) count for less.',
            cls: 'setting-item-description'
        });

        // Controls
        const controls = contentEl.createDiv({cls: 'akl-related-controls'});
        const minLabel = controls.createEl('label');
        minLabel.appendText('Min notes together ');
        const minInput = minLabel.createEl('input', {type: 'number', value: String(this.minNotes)});
        minInput.min = '1';
        minInput.addEventListener('change', () => {
            this.minNotes = Math.max(1, parseInt(minInput.value, 10) || 1);
            this.render();
        });

        const unlinkedLabel = controls.createEl('label');
        const unlinkedBox = unlinkedLabel.createEl('input', {type: 'checkbox'});
        unlinkedBox.checked = this.unlinkedOnly;
        unlinkedLabel.appendText(' Not linked yet only');
        unlinkedBox.addEventListener('change', () => {
            this.unlinkedOnly = unlinkedBox.checked;
            this.render();
        });

        const visible = this.analysis.pairs.filter(p =>
            p.notes >= this.minNotes &&
            !pairInList(settings.relatedDismissed, p.a, p.b) &&
            (!this.unlinkedOnly || (!p.linked && !p.inRelated)));

        controls.createSpan({text: `${visible.length} pair${visible.length !== 1 ? 's' : ''}`, cls: 'akl-related-count'});

        if (visible.length === 0) {
            contentEl.createEl('p', {
                text: this.analysis.targets.size === 0
                    ? 'None of your keyword targets exist as notes yet.'
                    : 'No pairs found. Try a lower minimum, or untick "Not linked yet only".',
                cls: 'akl-no-results'
            });
        }

        const list = contentEl.createDiv({cls: 'akl-related-list'});
        for (const pair of visible.slice(0, MAX_ROWS)) {
            this.renderRow(list, pair);
        }
        if (visible.length > MAX_ROWS) {
            contentEl.createEl('p', {text: `Showing the strongest ${MAX_ROWS}.`, cls: 'setting-item-description'});
        }

        // Footer
        const footer = contentEl.createDiv({cls: 'modal-button-container'});
        const dismissedCount = (settings.relatedDismissed || []).length;
        if (dismissedCount > 0) {
            footer.createEl('button', {text: `Restore ${dismissedCount} dismissed`}).addEventListener('click', async () => {
                settings.relatedDismissed = [];
                await this.plugin.saveSettings();
                this.render();
            });
        }
        footer.createEl('button', {text: 'Close'}).addEventListener('click', () => this.close());
    }

    /**
     * Render one pair
     * @param {HTMLElement} list - List container
     * @param {Object} pair - Pair from analyzeCooccurrence()
     */
    renderRow(list, pair) {
        const settings = this.plugin.settings;
        const row = list.createDiv({cls: 'akl-related-row'});

        const names = row.createDiv({cls: 'akl-related-names'});
        for (const [index, path] of [pair.a, pair.b].entries()) {
            if (index === 1) names.appendText(' ↔ ');
            const link = names.createEl('a', {text: this.noteName(path), href: '#'});
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.app.workspace.openLinkText(path, '', false);
            });
        }

        const info = row.createDiv({cls: 'akl-related-info'});
        info.appendText(`${pair.notes} note${pair.notes !== 1 ? 's' : ''} together`);
        if (pair.sameParagraph > 0) info.appendText(` (${pair.sameParagraph} same paragraph)`);
        const status = pair.inRelated ? 'In related' : pair.linked ? 'Linked' : 'Not linked';
        info.createSpan({text: status, cls: `akl-related-status-badge akl-related-${status.toLowerCase().replace(' ', '-')}`});

        const actions = row.createDiv({cls: 'akl-related-actions'});
        const notesEl = row.createDiv({cls: 'akl-related-notes'});
        notesEl.hide();

        actions.createEl('button', {text: 'Show notes'}).addEventListener('click', () => {
            if (notesEl.childElementCount === 0) {
                const ul = notesEl.createEl('ul');
                pair.files.forEach(path => {
                    const a = ul.createEl('li').createEl('a', {text: path, href: '#'});
                    a.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.app.workspace.openLinkText(path, '', false);
                    });
                });
            }
            notesEl.toggle(!notesEl.isShown());
        });

        if (!pair.inRelated) {
            const linkBtn = actions.createEl('button', {text: 'Link', cls: 'mod-cta'});
            linkBtn.setAttribute('aria-label', 'Add each note to the other\'s Related section');
            linkBtn.addEventListener('click', async () => {
                linkBtn.disabled = true;
                await this.linkPair(pair);
                this.render();
            });
        }

        actions.createEl('button', {text: 'Dismiss'}).addEventListener('click', async () => {
            settings.relatedDismissed = [...(settings.relatedDismissed || []), [pair.a, pair.b]];
            settings.relatedPins = (settings.relatedPins || []).filter(p => !pairInList([p], pair.a, pair.b));
            await this.plugin.saveSettings();
            this.render();
        });
    }

    /**
     * Pin a pair and write the Related sections of both notes now
     * @param {Object} pair - Pair from analyzeCooccurrence()
     */
    async linkPair(pair) {
        const settings = this.plugin.settings;
        if (!pairInList(settings.relatedPins, pair.a, pair.b)) {
            settings.relatedPins = [...(settings.relatedPins || []), [pair.a, pair.b]];
        }
        settings.relatedDismissed = (settings.relatedDismissed || []).filter(p => !pairInList([p], pair.a, pair.b));
        await this.plugin.saveSettings();

        const updates = (await planRelatedUpdates(this.app, settings, this.analysis))
            .filter(u => u.file.path === pair.a || u.file.path === pair.b);
        const changed = await applyRelatedUpdates(this.app, updates);
        pair.inRelated = true;
        new Notice(`Linked ${this.noteName(pair.a)} ↔ ${this.noteName(pair.b)} (${changed} note${changed !== 1 ? 's' : ''} updated)`);
    }

    onClose() {
        this.contentEl.empty();
    }
}

module.exports = RelationshipsModal;
