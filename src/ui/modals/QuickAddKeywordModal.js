/**
 * Quick Add Keyword Modal
 * A streamlined modal for quickly adding keywords from selected text
 * with inline note search and creation capability
 *
 * Uses Obsidian's Setting component for consistent styling with the settings tab
 */

const { Modal, Setting, Notice } = require('obsidian');
const { generateId } = require('../../utils/helpers');
const NoteSuggest = require('../suggests/NoteSuggest');

class QuickAddKeywordModal extends Modal {
    /**
     * Create a new QuickAddKeywordModal
     * @param {App} app - The Obsidian app instance
     * @param {Plugin} plugin - The plugin instance
     * @param {string} selectedText - The text selected by the user to become a keyword
     */
    constructor(app, plugin, selectedText) {
        super(app);
        this.plugin = plugin;
        this.selectedText = selectedText.trim();
        this.targetValue = '';
        this.allNotes = [];
    }

    onOpen() {
        const { contentEl, modalEl } = this;
        contentEl.empty();

        // Add modal class for styling
        modalEl.addClass('akl-quick-add-modal');

        // Gather all notes in vault
        this.allNotes = this.app.vault.getMarkdownFiles().map(f => f.path.replace(/\.md$/, ''));

        // Modal title
        contentEl.createEl('h2', { text: 'Quick Add Keyword', cls: 'akl-modal-title' });

        // Keyword display (read-only) using Setting component
        new Setting(contentEl)
            .setName('Keyword')
            .setDesc('The text that will be linked')
            .addText(text => {
                text.setValue(this.selectedText)
                    .setDisabled(true);
                text.inputEl.addClass('akl-input');
            });

        // Target note input with autocomplete
        const targetSetting = new Setting(contentEl)
            .setName('Target note')
            .setDesc('The note to link to (type to search, or enter a new note name to create it)')
            .addText(text => {
                text.setPlaceholder('Search or create note...')
                    .setValue(this.selectedText); // Pre-fill with keyword as default
                text.inputEl.addClass('akl-input');
                this.targetInput = text.inputEl;
                this.targetValue = this.selectedText;

                // Set up autocomplete
                new NoteSuggest(this.app, text.inputEl, this.allNotes);

                // Track value changes
                text.inputEl.addEventListener('input', () => {
                    this.targetValue = text.inputEl.value;
                });

                // Focus this input
                setTimeout(() => {
                    text.inputEl.focus();
                    text.inputEl.select();
                }, 50);
            });

        // Hint about creating new notes
        const hintEl = contentEl.createDiv({ cls: 'akl-hint-text' });
        hintEl.setText('Tip: If the note doesn\'t exist, it will be created automatically.');

        // Button row
        const buttonRow = contentEl.createDiv({ cls: 'akl-action-row' });

        const cancelBtn = buttonRow.createEl('button', { text: 'Cancel' });
        cancelBtn.addEventListener('click', () => this.close());

        const addBtn = buttonRow.createEl('button', { text: 'Add Keyword', cls: 'mod-cta' });
        addBtn.addEventListener('click', () => this.addKeyword());

        // Handle Enter key to submit
        contentEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                // Small delay to allow autocomplete selection
                setTimeout(() => {
                    this.targetValue = this.targetInput.value;
                    this.addKeyword();
                }, 100);
            }
        });
    }

    /**
     * Add the keyword to settings
     */
    async addKeyword() {
        const target = this.targetValue.trim();

        if (!target) {
            new Notice('Please enter a target note');
            return;
        }

        // Check for duplicate keyword
        const existingKeyword = this.plugin.settings.keywords.find(
            kw => kw.keyword.toLowerCase() === this.selectedText.toLowerCase()
        );
        if (existingKeyword) {
            new Notice(`Keyword "${this.selectedText}" already exists`);
            return;
        }

        // Check if target note exists, create if not
        const notePath = target.endsWith('.md') ? target : `${target}.md`;
        const existingFile = this.app.vault.getAbstractFileByPath(notePath);

        if (!existingFile) {
            try {
                // Use the new note template if configured
                const template = this.plugin.settings.newNoteTemplate || '# {{keyword}}\n\nCreated: {{date}}\n\n';
                const content = template
                    .replace(/\{\{keyword\}\}/g, this.selectedText)
                    .replace(/\{\{date\}\}/g, new Date().toISOString().split('T')[0]);

                // Ensure parent folders exist
                const folderPath = notePath.substring(0, notePath.lastIndexOf('/'));
                if (folderPath) {
                    const folder = this.app.vault.getAbstractFileByPath(folderPath);
                    if (!folder) {
                        await this.app.vault.createFolder(folderPath);
                    }
                }

                await this.app.vault.create(notePath, content);
                new Notice(`Created note: ${target}`);
            } catch (error) {
                new Notice(`Failed to create note: ${error.message}`);
                return;
            }
        }

        // Add keyword to settings
        const newKeyword = {
            id: generateId('kw'),
            keyword: this.selectedText,
            target: target,
            variations: [],
            enableTags: null,
            linkScope: 'vault-wide',
            scopeFolder: '',
            useRelativeLinks: null,
            blockRef: '',
            requireTag: '',
            onlyInNotesLinkingTo: null,
            suggestMode: null,
            preventSelfLink: null,
            collapsed: false,
            groupId: null
        };

        this.plugin.settings.keywords.push(newKeyword);
        await this.plugin.saveSettings();

        new Notice(`Keyword "${this.selectedText}" added → ${target}`);
        this.close();
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

module.exports = QuickAddKeywordModal;
