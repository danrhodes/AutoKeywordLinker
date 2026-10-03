/**
 * Keyword Group Assign Modal
 * Searchable checklist for assigning one or more keywords to a group
 * Extracted from main-source.js (Session 6)
 */

const { Modal, Notice } = require('obsidian');
const { assignKeywordToGroup } = require('../../utils/groups');

class KeywordGroupAssignModal extends Modal {
    constructor(app, plugin, groupId, currentKeywords) {
        super(app);
        this.plugin = plugin;
        this.groupId = groupId;
        this.currentKeywordIds = new Set(currentKeywords.map(kw => kw.id));
        this.selectedIds = new Set();
        this.filter = '';
    }

    /**
     * Keywords that are not already in this group
     */
    getItems() {
        return this.plugin.settings.keywords.filter(kw => !this.currentKeywordIds.has(kw.id));
    }

    /**
     * Keywords matching the current search filter
     */
    getVisibleItems() {
        const filter = this.filter.toLowerCase();
        if (!filter) return this.getItems();
        return this.getItems().filter(kw =>
            (kw.keyword || '').toLowerCase().includes(filter) ||
            (kw.target || '').toLowerCase().includes(filter) ||
            (kw.variations || []).some(v => v.toLowerCase().includes(filter))
        );
    }

    onOpen() {
        const { contentEl, modalEl } = this;
        contentEl.empty();
        modalEl.addClass('akl-group-assign-modal');

        const group = this.plugin.settings.keywordGroups.find(g => g.id === this.groupId);
        contentEl.createEl('h2', { text: `Add keywords to "${group ? group.name : 'group'}"`, cls: 'akl-modal-title' });

        // Search box
        const searchInput = contentEl.createEl('input', {
            type: 'text',
            placeholder: 'Search keywords, targets or variations...',
            cls: 'akl-search-input'
        });
        searchInput.addEventListener('input', () => {
            this.filter = searchInput.value;
            this.renderList();
        });
        setTimeout(() => searchInput.focus(), 50);

        // Select all / none for the visible results
        const bulkRow = contentEl.createDiv({ cls: 'akl-assign-bulk-row' });
        const selectAllBtn = bulkRow.createEl('button', { text: 'Select all shown' });
        selectAllBtn.addEventListener('click', () => {
            this.getVisibleItems().forEach(kw => this.selectedIds.add(kw.id));
            this.renderList();
        });
        const selectNoneBtn = bulkRow.createEl('button', { text: 'Clear selection' });
        selectNoneBtn.addEventListener('click', () => {
            this.selectedIds.clear();
            this.renderList();
        });

        // Checklist
        this.listEl = contentEl.createDiv({ cls: 'akl-assign-list' });

        // Action buttons
        const buttonRow = contentEl.createDiv({ cls: 'akl-action-row' });
        const cancelBtn = buttonRow.createEl('button', { text: 'Cancel' });
        cancelBtn.addEventListener('click', () => this.close());
        this.addBtn = buttonRow.createEl('button', { cls: 'mod-cta' });
        this.addBtn.addEventListener('click', () => this.assignSelected());

        this.renderList();
    }

    renderList() {
        this.listEl.empty();
        const items = this.getVisibleItems();

        if (items.length === 0) {
            this.listEl.createEl('p', {
                text: this.getItems().length === 0 ? 'All keywords are already in this group.' : 'No keywords match your search.',
                cls: 'akl-hint-text'
            });
        }

        for (const kw of items) {
            const row = this.listEl.createEl('label', { cls: 'akl-assign-row' });
            const checkbox = row.createEl('input', { type: 'checkbox' });
            checkbox.checked = this.selectedIds.has(kw.id);
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    this.selectedIds.add(kw.id);
                } else {
                    this.selectedIds.delete(kw.id);
                }
                this.updateAddButton();
            });

            row.createSpan({ text: kw.keyword || 'Untitled', cls: 'akl-keyword-name' });
            row.createSpan({ text: ` → ${kw.target || '(no target)'}`, cls: 'akl-target-name' });
            if (kw.groupId) {
                const otherGroup = this.plugin.settings.keywordGroups.find(g => g.id === kw.groupId);
                row.createSpan({ text: `In "${otherGroup ? otherGroup.name : 'another group'}"`, cls: 'akl-badge akl-badge-group' });
            }
        }

        this.updateAddButton();
    }

    updateAddButton() {
        const count = this.selectedIds.size;
        this.addBtn.setText(count > 0 ? `Add ${count} keyword${count !== 1 ? 's' : ''}` : 'Add keywords');
        this.addBtn.disabled = count === 0;
    }

    async assignSelected() {
        const keywords = this.plugin.settings.keywords.filter(kw => this.selectedIds.has(kw.id));
        if (keywords.length === 0) return;

        for (const keyword of keywords) {
            assignKeywordToGroup(keyword, this.groupId);
        }

        await this.plugin.saveSettings();

        // Show notice that group settings will be applied to future links
        new Notice(`${keywords.length} keyword${keywords.length !== 1 ? 's' : ''} assigned to group. Group settings will apply to new links.`);
        this.close();

        // Refresh the settings display
        const settingTab = this.app.setting.activeTab;
        const AutoKeywordLinkerSettingTab = require('../settings/AutoKeywordLinkerSettingTab');
        if (settingTab instanceof AutoKeywordLinkerSettingTab) {
            settingTab.display();
        }
    }

    onClose() {
        this.contentEl.empty();
    }
}

module.exports = KeywordGroupAssignModal;
