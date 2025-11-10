/**
 * Keyword Group Assign Modal
 * Fuzzy searchable modal for assigning keywords to groups
 * Extracted from main-source.js (Session 6)
 */

const { FuzzySuggestModal, Notice } = require('obsidian');

class KeywordGroupAssignModal extends FuzzySuggestModal {
    constructor(app, plugin, groupId, currentKeywords) {
        super(app);
        this.plugin = plugin;
        this.groupId = groupId;
        this.currentKeywordIds = new Set(currentKeywords.map(kw => kw.id));
    }

    getItems() {
        // Get all keywords that are not already in this group
        return this.plugin.settings.keywords.filter(kw => !this.currentKeywordIds.has(kw.id));
    }

    getItemText(keyword) {
        const groupInfo = keyword.groupId ? ' [In another group]' : '';
        return `${keyword.keyword || 'Untitled'} → ${keyword.target || '(no target)'}${groupInfo}`;
    }

    async onChooseItem(keyword) {
        // Assign keyword to this group
        keyword.groupId = this.groupId;

        // Reset keyword-specific settings to null so they inherit from the group
        keyword.enableTags = null;
        keyword.linkScope = null;
        keyword.scopeFolder = null;
        keyword.useRelativeLinks = null;
        keyword.blockRef = null;
        keyword.requireTag = null;
        keyword.onlyInNotesLinkingTo = null;
        keyword.suggestMode = null;
        keyword.preventSelfLink = null;

        await this.plugin.saveSettings();

        // Show notice that group settings will be applied to future links
        new Notice(`Keyword "${keyword.keyword}" assigned to group. Group settings will apply to new links.`);

        // Refresh the settings display
        const settingTab = this.app.setting.activeTab;
        const AutoKeywordLinkerSettingTab = require('../settings/AutoKeywordLinkerSettingTab');
        if (settingTab instanceof AutoKeywordLinkerSettingTab) {
            settingTab.display();
        }
    }
}

module.exports = KeywordGroupAssignModal;
