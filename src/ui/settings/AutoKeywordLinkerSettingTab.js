/**
 * AutoKeywordLinkerSettingTab.js
 *
 * Settings tab for the Auto Keyword Linker plugin.
 * Extracted from main-source.js (Session 6)
 *
 * This file contains the settings UI for managing keywords, groups, and plugin configuration.
 */

const { PluginSettingTab, Setting, Notice, normalizePath } = require('obsidian');

// Import helper modals
const KeywordGroupAssignModal = require('../modals/KeywordGroupAssignModal');

// Import suggest classes
const FolderSuggest = require('../suggests/FolderSuggest');
const NoteSuggest = require('../suggests/NoteSuggest');

// Import utility functions
const { generateId } = require('../../utils/helpers');
const { isKeywordCaseSensitive, keywordTextsConflict, sameTarget } = require('../../utils/linking');
const { assignKeywordToGroup } = require('../../utils/groups');

class AutoKeywordLinkerSettingTab extends PluginSettingTab {
    /**
     * @param {App} app - Obsidian app instance
     * @param {Plugin} plugin - Reference to the plugin instance
     */
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.searchFilter = ''; // Track current search term
        this.groupFilter = 'all'; // Keywords tab group filter: 'all', 'none' or a group ID
        this.selectedKeywordIds = new Set(); // Keywords ticked for bulk actions
        this.visibleKeywordIds = []; // Keyword IDs currently shown (after search/filter)
        this.currentTab = 'keywords'; // Track which tab is active: 'keywords', 'groups', 'general', 'import-export', 'tools', 'help'
        this.addedAtTopIds = new Set(); // Keywords added with the top button, shown first until settings close
    }

    /**
     * Check if a keyword already exists
     * Texts differing only in case conflict unless both keywords match case-sensitively
     * @param {string} keyword - The keyword to check
     * @param {string} excludeId - Optional ID to exclude (for editing existing keywords)
     * @param {boolean} caseSensitive - Whether the keyword being checked matches case-sensitively
     * @param {string} target - Target of the keyword being checked. With "Pick target from context" on,
     *                          the same text may point at different targets, so only a same-target match is a duplicate
     * @returns {Object|null} The existing keyword object if duplicate found, null otherwise
     */
    isDuplicateKeyword(keyword, excludeId = null, caseSensitive = !!this.plugin.settings.caseSensitive, target = null) {
        if (!keyword || !keyword.trim()) return null;
        const allowSharedText = this.plugin.settings.contextDisambiguation !== false;

        for (const kw of this.plugin.settings.keywords) {
            if (excludeId && kw.id === excludeId) continue;
            if (allowSharedText && !sameTarget(kw.target, target)) continue;
            const kwCaseSensitive = isKeywordCaseSensitive(this.plugin.settings, kw);

            // Check main keyword and variations
            const texts = [kw.keyword, ...(kw.variations || [])];
            if (texts.some(t => keywordTextsConflict(keyword, caseSensitive, t, kwCaseSensitive))) {
                return kw;
            }
        }
        return null;
    }

    /**
     * Find other keywords that share text (keyword or variation) with this one but link elsewhere
     * - the ones "Pick target from context" chooses between
     * @param {Object} item - Keyword object
     * @returns {Array<Object>} The other keywords
     */
    getKeywordsSharingText(item) {
        if (this.plugin.settings.contextDisambiguation === false || !item.keyword) return [];
        const itemCaseSensitive = isKeywordCaseSensitive(this.plugin.settings, item);
        const itemTexts = [item.keyword, ...(item.variations || [])];

        return this.plugin.settings.keywords.filter(kw => {
            if (kw.id === item.id || !kw.target || sameTarget(kw.target, item.target)) return false;
            const kwCaseSensitive = isKeywordCaseSensitive(this.plugin.settings, kw);
            const kwTexts = [kw.keyword, ...(kw.variations || [])];
            return itemTexts.some(a => kwTexts.some(b => keywordTextsConflict(a, itemCaseSensitive, b, kwCaseSensitive)));
        });
    }

    /**
     * Display the settings tab
     * Called when the user opens the settings
     */
    display() {
        const {containerEl} = this;

        // Remember scroll position so re-renders on the same tab don't jump back to the top
        const previousScrollTop = containerEl.scrollTop;
        const previousTab = this.lastRenderedTab;

        containerEl.empty();  // Clear any existing content

        // Add custom CSS for improved UI
        this.addCustomStyles();

        // If we need to scroll to a keyword, switch to Keywords tab
        if (this.plugin.scrollToKeywordId) {
            this.currentTab = 'keywords';
        }

        // Tab navigation
        const tabNav = containerEl.createDiv({cls: 'akl-tab-nav'});

        const tabs = [
            { id: 'keywords', label: 'Keywords', icon: '🔤' },
            { id: 'groups', label: 'Groups', icon: '📁' },
            { id: 'general', label: 'General', icon: '⚙️' },
            { id: 'import-export', label: 'Import/export', icon: '📦' },
            { id: 'tools', label: 'Tools', icon: '🔧' },
            { id: 'help', label: 'Help', icon: '❓' }
        ];

        tabs.forEach(tab => {
            const tabBtn = tabNav.createEl('button', {
                text: `${tab.icon} ${tab.label}`,
                cls: `akl-tab-button ${this.currentTab === tab.id ? 'akl-tab-active' : ''}`
            });
            tabBtn.addEventListener('click', () => {
                this.currentTab = tab.id;
                this.display(); // Re-render with new tab
            });
        });

        // Tab content container
        const tabContent = containerEl.createDiv({cls: 'akl-tab-content'});

        // Render the appropriate tab content
        switch (this.currentTab) {
            case 'keywords':
                this.displayKeywordsTab(tabContent);
                break;
            case 'groups':
                this.displayGroupsTab(tabContent);
                break;
            case 'general':
                this.displayGeneralTab(tabContent);
                break;
            case 'import-export':
                this.displayImportExportTab(tabContent);
                break;
            case 'tools':
                this.displayToolsTab(tabContent);
                break;
            case 'help':
                this.displayHelpTab(tabContent);
                break;
        }

        // Restore scroll position when re-rendering the same tab
        // (skipped when jumping to a specific keyword, which handles its own scrolling)
        if (previousTab === this.currentTab && !this.plugin.scrollToKeywordId) {
            containerEl.scrollTop = previousScrollTop;
        }
        this.lastRenderedTab = this.currentTab;
    }

    /**
     * Display the Keywords tab
     */
    displayKeywordsTab(containerEl) {
        // Stats
        const statsDiv = containerEl.createDiv({cls: 'akl-stats-bar'});
        statsDiv.createEl('span', {
            text: `${this.plugin.settings.keywords.length} keyword${this.plugin.settings.keywords.length !== 1 ? 's' : ''} configured`
        });

        // Keywords section with improved header
        new Setting(containerEl)
            .setName('Keywords & variations')
            .setDesc('Define keywords and their variations. All variations will link to the target note.')
            .setHeading();

        // Search and controls row
        const controlsRow = containerEl.createDiv({cls: 'akl-controls-row'});

        // Search box for filtering keywords
        const searchContainer = controlsRow.createDiv({cls: 'akl-search-container'});
        const searchInput = searchContainer.createEl('input', {
            type: 'text',
            placeholder: 'Search keywords...',
            cls: 'akl-search-input',
            value: this.searchFilter
        });
        searchInput.addEventListener('input', (e) => {
            this.searchFilter = e.target.value;
            this.renderKeywords(keywordsDiv);
        });

        // Fold/Unfold all button
        const foldBtnContainer = controlsRow.createDiv({cls: 'akl-fold-btn-container'});
        const allCollapsed = this.plugin.settings.keywords.every(kw => kw.collapsed !== false);
        const foldBtn = foldBtnContainer.createEl('button', {
            text: allCollapsed ? '▼ Unfold All' : '▲ Fold All',
            cls: 'akl-fold-button'
        });
        foldBtn.addEventListener('click', async () => {
            const shouldCollapse = !allCollapsed;
            for (const kw of this.plugin.settings.keywords) {
                kw.collapsed = shouldCollapse;
            }
            await this.plugin.saveSettings();
            this.display();
        });

        // Add keyword button at the top too, so adding many doesn't mean scrolling to the bottom
        const topAddBtn = foldBtnContainer.createEl('button', {
            text: '+ Add keyword',
            cls: 'mod-cta akl-add-button-top'
        });
        topAddBtn.addEventListener('click', () => this.addEmptyKeyword(true));

        // Sort, group filter and accordion controls
        const viewRow = containerEl.createDiv({cls: 'akl-view-row'});

        const sortSelect = viewRow.createEl('select', {cls: 'dropdown'});
        [
            ['manual', 'Sort: order added'],
            ['newest', 'Sort: newest first'],
            ['keyword-asc', 'Sort: keyword A–Z'],
            ['keyword-desc', 'Sort: keyword Z–A'],
            ['target', 'Sort: target note A–Z'],
            ['group', 'Sort: by group']
        ].forEach(([value, label]) => sortSelect.createEl('option', {value, text: label}));
        sortSelect.value = this.plugin.settings.keywordSortOrder || 'manual';
        sortSelect.addEventListener('change', async () => {
            this.plugin.settings.keywordSortOrder = sortSelect.value;
            await this.plugin.saveSettings();
            this.renderKeywords(keywordsDiv);
        });

        const groupSelect = viewRow.createEl('select', {cls: 'dropdown'});
        groupSelect.createEl('option', {value: 'all', text: 'All groups'});
        groupSelect.createEl('option', {value: 'none', text: 'Not in a group'});
        this.plugin.settings.keywordGroups.forEach(group => {
            groupSelect.createEl('option', {value: group.id, text: `Group: ${group.name}`});
        });
        if (this.groupFilter !== 'all' && this.groupFilter !== 'none' &&
            !this.plugin.settings.keywordGroups.some(g => g.id === this.groupFilter)) {
            this.groupFilter = 'all'; // Filtered group was deleted
        }
        groupSelect.value = this.groupFilter;
        groupSelect.addEventListener('change', () => {
            this.groupFilter = groupSelect.value;
            this.renderKeywords(keywordsDiv);
        });

        const accordionLabel = viewRow.createEl('label', {cls: 'akl-accordion-toggle'});
        const accordionCheckbox = accordionLabel.createEl('input', {type: 'checkbox'});
        accordionCheckbox.checked = this.plugin.settings.keywordAccordion !== false;
        accordionLabel.appendText(' Open one at a time');
        accordionCheckbox.addEventListener('change', async () => {
            this.plugin.settings.keywordAccordion = accordionCheckbox.checked;
            await this.plugin.saveSettings();
        });

        // Bulk actions bar (select, move to group, delete)
        this.bulkBarEl = containerEl.createDiv({cls: 'akl-bulk-bar'});

        // Container for keyword list
        const keywordsDiv = containerEl.createDiv({cls: 'akl-keywords-container'});
        this.keywordsDiv = keywordsDiv;

        // Render all current keywords
        this.renderKeywords(keywordsDiv);

        // Add button to create new keyword entries
        const addBtnContainer = containerEl.createDiv({cls: 'akl-add-button-container'});
        const addBtn = addBtnContainer.createEl('button', {
            text: '+ Add keyword',
            cls: 'mod-cta akl-add-button'
        });
        addBtn.addEventListener('click', () => this.addEmptyKeyword(false));
    }

    /**
     * Update card header title without full re-render
     * @param {HTMLElement} cardTitle - The card title element to update
     * @param {string} keyword - The keyword value
     * @param {string} target - The target value
     */
    updateCardHeader(cardTitle, keyword, target) {
        cardTitle.empty();
        const titleText = keyword || 'New Keyword';
        const targetText = target ? ` → ${target}` : '';
        cardTitle.createSpan({text: titleText, cls: 'akl-keyword-name'});
        if (targetText) {
            cardTitle.createSpan({text: targetText, cls: 'akl-target-name'});
        }
    }

    /**
     * Get indices of keywords to show, after search and group filter, in the chosen sort order
     * Sorting only affects display - the stored keyword order is unchanged
     * @param {string|null} alwaysShowId - Keyword ID to include regardless of filters (scroll target)
     * @returns {number[]} Indices into settings.keywords
     */
    getVisibleKeywordIndices(alwaysShowId = null) {
        const keywords = this.plugin.settings.keywords;
        const searchTerm = this.searchFilter.toLowerCase();
        const groupNames = new Map(this.plugin.settings.keywordGroups.map(g => [g.id, g.name]));

        const indices = keywords.map((_, i) => i).filter(i => {
            const kw = keywords[i];
            if (alwaysShowId && kw.id === alwaysShowId) return true;

            if (this.groupFilter === 'none' && kw.groupId) return false;
            if (this.groupFilter !== 'all' && this.groupFilter !== 'none' && kw.groupId !== this.groupFilter) return false;

            if (searchTerm) {
                const matches = (kw.keyword || '').toLowerCase().includes(searchTerm) ||
                    (kw.target || '').toLowerCase().includes(searchTerm) ||
                    (kw.variations || []).some(v => v.toLowerCase().includes(searchTerm));
                if (!matches) return false;
            }
            return true;
        });

        const compare = (a, b) => (a || '').localeCompare(b || '', undefined, {sensitivity: 'base', numeric: true});
        // IDs are "kw-<timestamp>-<random>"; older migrated IDs have no timestamp and sort as oldest
        const createdAt = (kw) => {
            const match = /^kw-(\d{10,})-/.exec(kw.id || '');
            return match ? Number(match[1]) : 0;
        };
        const byKeyword = (a, b) => compare(keywords[a].keyword, keywords[b].keyword);

        switch (this.plugin.settings.keywordSortOrder) {
            case 'newest':
                indices.sort((a, b) => createdAt(keywords[b]) - createdAt(keywords[a]) || b - a);
                break;
            case 'keyword-asc':
                indices.sort(byKeyword);
                break;
            case 'keyword-desc':
                indices.sort((a, b) => byKeyword(b, a));
                break;
            case 'target':
                indices.sort((a, b) => compare(keywords[a].target, keywords[b].target) || byKeyword(a, b));
                break;
            case 'group':
                // Grouped keywords together by group name, ungrouped last
                indices.sort((a, b) => {
                    const groupA = groupNames.get(keywords[a].groupId);
                    const groupB = groupNames.get(keywords[b].groupId);
                    if (!groupA !== !groupB) return groupA ? -1 : 1;
                    return compare(groupA, groupB) || byKeyword(a, b);
                });
                break;
        }

        // Keywords added with the top "Add keyword" button stay at the top (newest first)
        // until settings close, so adding several in a row doesn't mean scrolling
        if (this.addedAtTopIds.size > 0) {
            const pinned = indices.filter(i => this.addedAtTopIds.has(keywords[i].id)).sort((a, b) => b - a);
            return [...pinned, ...indices.filter(i => !this.addedAtTopIds.has(keywords[i].id))];
        }

        return indices;
    }

    /**
     * Add an empty keyword and open its card
     * @param {boolean} atTop - Show the new card at the top of the list (rather than where the sort puts it)
     */
    addEmptyKeyword(atTop) {
        // Use null for inheritable boolean settings so they inherit from group if assigned
        const newId = generateId('kw');
        // Show and scroll to the new keyword even if sorting or filters would hide it
        this.plugin.scrollToKeywordId = newId;
        if (atTop) {
            this.addedAtTopIds.add(newId);
        }
        this.plugin.settings.keywords.push({
            id: newId,
            keyword: '',
            target: '',
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
        });
        // Re-render the display to show new entry
        this.display();
    }

    /**
     * Called when the settings tab closes
     */
    hide() {
        super.hide();
        // Newly added keywords go back to their normal sort position next time
        this.addedAtTopIds.clear();
    }

    /**
     * Render the bulk actions bar for the Keywords tab
     */
    renderBulkBar() {
        const bar = this.bulkBarEl;
        if (!bar) return;
        bar.empty();

        // Drop selections for keywords that no longer exist
        const existingIds = new Set(this.plugin.settings.keywords.map(kw => kw.id));
        for (const id of this.selectedKeywordIds) {
            if (!existingIds.has(id)) this.selectedKeywordIds.delete(id);
        }

        const count = this.selectedKeywordIds.size;
        bar.toggleClass('akl-bulk-bar-active', count > 0);

        // Select all / none for the keywords currently shown
        const visible = this.visibleKeywordIds;
        const allVisibleSelected = visible.length > 0 && visible.every(id => this.selectedKeywordIds.has(id));
        const selectAllLabel = bar.createEl('label', {cls: 'akl-bulk-select-all'});
        const selectAll = selectAllLabel.createEl('input', {type: 'checkbox'});
        selectAll.checked = allVisibleSelected;
        selectAll.indeterminate = !allVisibleSelected && visible.some(id => this.selectedKeywordIds.has(id));
        selectAllLabel.appendText(count > 0 ? ` ${count} selected` : ' Select all shown');
        selectAll.addEventListener('change', () => {
            visible.forEach(id => selectAll.checked ? this.selectedKeywordIds.add(id) : this.selectedKeywordIds.delete(id));
            this.renderKeywords(this.keywordsDiv);
        });

        if (count === 0) return;

        // Move to group
        const moveSelect = bar.createEl('select', {cls: 'dropdown'});
        moveSelect.createEl('option', {value: '', text: 'Move to group…'});
        moveSelect.createEl('option', {value: '__none__', text: 'Remove from group'});
        this.plugin.settings.keywordGroups.forEach(group => {
            moveSelect.createEl('option', {value: group.id, text: group.name});
        });
        moveSelect.addEventListener('change', async () => {
            if (!moveSelect.value) return;
            const groupId = moveSelect.value === '__none__' ? null : moveSelect.value;
            const selected = this.plugin.settings.keywords.filter(kw => this.selectedKeywordIds.has(kw.id));
            selected.forEach(kw => assignKeywordToGroup(kw, groupId));
            await this.plugin.saveSettings();
            const groupName = groupId ? this.plugin.settings.keywordGroups.find(g => g.id === groupId)?.name : null;
            new Notice(groupName
                ? `Moved ${selected.length} keyword(s) to "${groupName}"`
                : `Removed ${selected.length} keyword(s) from their group`);
            this.selectedKeywordIds.clear();
            this.display();
        });

        // Delete (click twice to confirm)
        const deleteBtn = bar.createEl('button', {text: `Delete ${count}`, cls: 'akl-delete-btn'});
        let confirmPending = false;
        deleteBtn.addEventListener('click', async () => {
            if (!confirmPending) {
                confirmPending = true;
                deleteBtn.setText(`Confirm delete ${count}?`);
                deleteBtn.addClass('mod-warning');
                return;
            }
            this.plugin.settings.keywords = this.plugin.settings.keywords.filter(kw => !this.selectedKeywordIds.has(kw.id));
            await this.plugin.saveSettings();
            new Notice(`Deleted ${count} keyword(s)`);
            this.selectedKeywordIds.clear();
            this.display();
        });

        // Clear selection
        const clearBtn = bar.createEl('button', {text: 'Clear selection'});
        clearBtn.addEventListener('click', () => {
            this.selectedKeywordIds.clear();
            this.renderKeywords(this.keywordsDiv);
        });
    }

    /**
     * Display the Groups tab
     */
    displayGroupsTab(containerEl) {
        // Stats
        const statsDiv = containerEl.createDiv({cls: 'akl-stats-bar'});
        const totalKeywordsInGroups = this.plugin.settings.keywordGroups.reduce((sum, group) => {
            return sum + this.plugin.settings.keywords.filter(kw => kw.groupId === group.id).length;
        }, 0);
        statsDiv.createEl('span', {
            text: `${this.plugin.settings.keywordGroups.length} group${this.plugin.settings.keywordGroups.length !== 1 ? 's' : ''} • ${totalKeywordsInGroups} keyword${totalKeywordsInGroups !== 1 ? 's' : ''} in groups`
        });

        // Groups section header
        new Setting(containerEl)
            .setName('Keyword groups')
            .setDesc('Organize keywords into groups with shared settings. Keywords in a group use the group\'s settings.')
            .setHeading();

        // Container for groups list
        const groupsDiv = containerEl.createDiv({cls: 'akl-groups-container'});

        // Render all groups
        this.renderGroups(groupsDiv);

        // Add button to create new group
        const addBtnContainer = containerEl.createDiv({cls: 'akl-add-button-container'});
        const addBtn = addBtnContainer.createEl('button', {
            text: '+ Create group',
            cls: 'mod-cta akl-add-button'
        });
        addBtn.addEventListener('click', () => {
            // Add empty group object to settings
            this.plugin.settings.keywordGroups.push({
                id: generateId('grp'),
                name: 'New group',
                collapsed: false,
                settings: {
                    enableTags: false,
                    linkScope: 'vault-wide',
                    scopeFolder: '',
                    useRelativeLinks: false,
                    blockRef: '',
                    requireTag: '',
                    onlyInNotesLinkingTo: false,
                    suggestMode: false,
                    preventSelfLink: false,
                    skipCodeBlocks: false,
                    caseSensitive: null
                }
            });
            // Re-render the display to show new entry
            this.display();
        });
    }

    /**
     * Display the General tab
     */
    displayGeneralTab(containerEl) {
        // General settings section
        new Setting(containerEl)
            .setName('Linking behavior')
            .setDesc('Configure how keywords are linked in your notes.')
            .setHeading();

        // First occurrence only toggle
        new Setting(containerEl)
            .setName('First occurrence only')
            .setDesc('Link only the first mention of each keyword per note')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.firstOccurrenceOnly)
                .onChange(async (value) => {
                    this.plugin.settings.firstOccurrenceOnly = value;
                    await this.plugin.saveSettings();
                }));

        // Case sensitive toggle
        new Setting(containerEl)
            .setName('Case sensitive')
            .setDesc('Match keywords with exact case. Individual keywords and groups can override this.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.caseSensitive)
                .onChange(async (value) => {
                    this.plugin.settings.caseSensitive = value;
                    await this.plugin.saveSettings();
                }));

        // Prevent self-link toggle (global)
        new Setting(containerEl)
            .setName('Prevent self-links (global)')
            .setDesc('Prevent keywords from linking on their own target note (applies to all keywords unless overridden per-keyword)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.preventSelfLinkGlobal)
                .onChange(async (value) => {
                    this.plugin.settings.preventSelfLinkGlobal = value;
                    await this.plugin.saveSettings();
                }));

        // Skip headings toggle
        new Setting(containerEl)
            .setName('Skip headings')
            .setDesc('Prevent keywords from being linked inside Markdown heading lines (e.g. ## My Heading). Enable this if keywords are breaking heading-based links.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.skipHeadings)
                .onChange(async (value) => {
                    this.plugin.settings.skipHeadings = value;
                    await this.plugin.saveSettings();
                }));

        // Skip code blocks toggle (global)
        new Setting(containerEl)
            .setName('Skip code blocks')
            .setDesc('Prevent keywords from being linked or suggested inside fenced code blocks (``` or ~~~). Can be overridden per keyword or per group.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.skipCodeBlocks || false)
                .onChange(async (value) => {
                    this.plugin.settings.skipCodeBlocks = value;
                    await this.plugin.saveSettings();
                }));

        // Context disambiguation toggle
        new Setting(containerEl)
            .setName('Pick target from context')
            .setDesc('When several keywords share the same text but link to different notes (e.g. "Mercury" → planet and "Mercury" → element), choose the target for each mention from the words, links, tags and folder around it. Off: the first keyword always wins.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.contextDisambiguation !== false)
                .onChange(async (value) => {
                    this.plugin.settings.contextDisambiguation = value;
                    await this.plugin.saveSettings();
                    this.display();
                }));

        if (this.plugin.settings.contextDisambiguation !== false) {
            new Setting(containerEl)
                .setName('When context is unclear')
                .setDesc('What to do with a shared keyword when nothing around it clearly points to one target')
                .addDropdown(dropdown => dropdown
                    .addOption('first', 'Link to the first keyword\'s target')
                    .addOption('skip', 'Leave it unlinked')
                    .setValue(this.plugin.settings.ambiguousFallback || 'first')
                    .onChange(async (value) => {
                        this.plugin.settings.ambiguousFallback = value;
                        await this.plugin.saveSettings();
                    }));
        }

        // Auto-link on save toggle
        new Setting(containerEl)
            .setName('Auto-link on save')
            .setDesc('Automatically link keywords when you save a note (requires reload)')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoLinkOnSave)
                .onChange(async (value) => {
                    this.plugin.settings.autoLinkOnSave = value;
                    await this.plugin.saveSettings();
                    new Notice('Please reload the plugin for this change to take effect');
                }));

        // Note creation section
        new Setting(containerEl)
            .setName('Note creation')
            .setDesc('Configure how new notes are created when target notes don\'t exist.')
            .setHeading();

        // Auto-create notes toggle
        new Setting(containerEl)
            .setName('Auto-create notes')
            .setDesc('Automatically create target notes if they don\'t exist')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoCreateNotes)
                .onChange(async (value) => {
                    this.plugin.settings.autoCreateNotes = value;
                    await this.plugin.saveSettings();
                }));

        // New note folder setting
        const folders = this.getAllFolders();
        const allFolders = ['', ...folders];

        new Setting(containerEl)
            .setName('New note folder')
            .setDesc('Type to search and select folder where new notes will be created')
            .addText(text => {
                // Display current folder or root
                const displayValue = this.plugin.settings.newNoteFolder || '/ (Root)';
                text.setValue(displayValue)
                    .setPlaceholder('Type to search folders...');

                // Attach folder suggest
                new FolderSuggest(this.app, text.inputEl, allFolders);

                // Save on change
                text.onChange(async (value) => {
                    // Handle root folder and normalize path
                    let folderValue = (value === '/ (Root)') ? '' : value;
                    if (folderValue) {
                        folderValue = normalizePath(folderValue);
                    }
                    this.plugin.settings.newNoteFolder = folderValue;
                    await this.plugin.saveSettings();
                });
            });

        // New note template setting
        new Setting(containerEl)
            .setName('New note template')
            .setDesc('Template for auto-created notes. Use {{keyword}} and {{date}} as placeholders.')
            .addTextArea(text => text
                .setPlaceholder('# {{keyword}}\n\nCreated: {{date}}')
                .setValue(this.plugin.settings.newNoteTemplate)
                .onChange(async (value) => {
                    this.plugin.settings.newNoteTemplate = value;
                    await this.plugin.saveSettings();
                }));

        // Keyword suggestion section
        new Setting(containerEl)
            .setName('Keyword suggestions')
            .setDesc('Configure how the keyword suggestion feature works.')
            .setHeading();

        // Custom stop words setting
        new Setting(containerEl)
            .setName('Custom stop words')
            .setDesc('Additional words to exclude from keyword suggestions (comma-separated). These are added to the default stop word list.')
            .addTextArea(text => {
                text.setPlaceholder('example, test, demo, sample')
                    .setValue((this.plugin.settings.customStopWords || []).join(', '))
                    .onChange(async (value) => {
                        // Parse comma-separated values and trim whitespace
                        const words = value.split(',')
                            .map(w => w.trim())
                            .filter(w => w.length > 0);
                        this.plugin.settings.customStopWords = words;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.rows = 4;
                text.inputEl.cols = 50;
            });

        // Button to reset custom stop words
        new Setting(containerEl)
            .setName('Reset custom stop words')
            .setDesc('Clear all custom stop words')
            .addButton(button => button
                .setButtonText('Reset')
                .onClick(async () => {
                    this.plugin.settings.customStopWords = [];
                    await this.plugin.saveSettings();
                    new Notice('Custom stop words cleared');
                    this.display(); // Refresh the display
                }));
    }

    /**
     * Display the Import/Export tab
     */
    displayImportExportTab(containerEl) {
        // Import/Export section header
        new Setting(containerEl)
            .setName('Import & export keywords')
            .setDesc('Export your keywords to CSV or import keywords from a CSV file.')
            .setHeading();

        // Export section
        new Setting(containerEl)
            .setName('Export keywords to CSV')
            .setDesc('Export all keywords and their settings to a CSV file')
            .addButton(button => button
                .setButtonText('Export to CSV')
                .setCta()
                .onClick(() => this.plugin.exportKeywordsToCSV()));

        // Import section
        new Setting(containerEl)
            .setName('Import keywords from CSV')
            .setDesc('Import keywords from a CSV file (opens file picker)')
            .addButton(button => button
                .setButtonText('Import from CSV')
                .onClick(() => this.plugin.importKeywordsFromCSV()));

        // Statistics section
        new Setting(containerEl)
            .setName('Statistics')
            .setDesc('View usage statistics for the plugin.')
            .setHeading();

        // View statistics button
        new Setting(containerEl)
            .setName('View statistics')
            .setDesc('See how many links have been created and which notes have been processed')
            .addButton(button => button
                .setButtonText('View statistics')
                .onClick(() => this.plugin.showStatistics()));
    }

    /**
     * Render the list of keywords with their settings
     * @param {HTMLElement} container - Container element to render into
     */
    renderKeywords(container) {
        container.empty();  // Clear existing content

        // Check if we need to scroll to a specific keyword (from addKeywordFromSelection)
        const scrollToId = this.plugin.scrollToKeywordId;
        let cardToScrollTo = null;

        // Search, group filter and sort order (display only)
        const visibleIndices = this.getVisibleKeywordIndices(scrollToId);
        this.visibleKeywordIds = visibleIndices.map(i => this.plugin.settings.keywords[i].id);
        const visibleCount = visibleIndices.length;

        // Expand/collapse functions for rendered cards, used for "open one at a time"
        const cardTogglers = new Map(); // keyword id -> setExpanded(boolean)

        // Iterate through the visible keyword entries
        for (const i of visibleIndices) {
            const item = this.plugin.settings.keywords[i];

            // Initialize collapsed state if not set
            if (item.collapsed === undefined) {
                item.collapsed = false;
            }

            // If this is the keyword we need to scroll to, expand it
            if (scrollToId && item.id === scrollToId) {
                item.collapsed = false;
            }

            // Create card container for this keyword entry
            const cardDiv = container.createDiv({cls: 'akl-keyword-card'});

            // Mark this card for scrolling if it's the one we need
            if (scrollToId && item.id === scrollToId) {
                cardToScrollTo = cardDiv;
                cardDiv.addClass('akl-highlight-card');
            }

            // Card header - click anywhere on it to expand/collapse
            const cardHeader = cardDiv.createDiv({cls: 'akl-card-header'});

            // Selection checkbox for bulk actions
            const selectBox = cardHeader.createEl('input', {type: 'checkbox', cls: 'akl-card-select'});
            selectBox.checked = this.selectedKeywordIds.has(item.id);
            selectBox.setAttribute('aria-label', `Select ${item.keyword || 'keyword'}`);
            cardDiv.toggleClass('akl-card-selected', selectBox.checked);
            selectBox.addEventListener('change', () => {
                if (selectBox.checked) {
                    this.selectedKeywordIds.add(item.id);
                } else {
                    this.selectedKeywordIds.delete(item.id);
                }
                cardDiv.toggleClass('akl-card-selected', selectBox.checked);
                this.renderBulkBar();
            });

            // Collapse indicator
            const collapseBtn = cardHeader.createDiv({cls: 'akl-collapse-btn'});
            collapseBtn.innerHTML = item.collapsed ? '▶' : '▼';
            collapseBtn.setAttribute('aria-label', item.collapsed ? 'Expand' : 'Collapse');

            // Expand/collapse in place (no re-render, so the list doesn't jump).
            // The settings body is only built the first time the card is opened.
            let bodyRendered = false;
            const setExpanded = (expanded) => {
                item.collapsed = !expanded;
                if (expanded && !bodyRendered) {
                    bodyRendered = true;
                    renderBody();
                }
                cardBody.style.display = expanded ? '' : 'none';
                cardDiv.toggleClass('akl-card-expanded', expanded);
                collapseBtn.innerHTML = expanded ? '▼' : '▶';
                collapseBtn.setAttribute('aria-label', expanded ? 'Collapse' : 'Expand');
            };
            cardTogglers.set(item.id, setExpanded);

            cardHeader.addEventListener('click', async (e) => {
                if (e.target === selectBox) return;
                const expand = item.collapsed;
                // "Open one at a time": close any other open keyword first
                if (expand && this.plugin.settings.keywordAccordion !== false) {
                    for (const [id, toggle] of cardTogglers) {
                        if (id === item.id) continue;
                        const other = this.plugin.settings.keywords.find(kw => kw.id === id);
                        if (other && !other.collapsed) toggle(false);
                    }
                }
                setExpanded(expand);
                await this.plugin.saveSettings();
            });

            // Card title area
            const cardTitle = cardHeader.createDiv({cls: 'akl-card-title'});
            const titleText = item.keyword || 'New Keyword';
            const targetText = item.target ? ` → ${item.target}` : '';
            cardTitle.createSpan({text: titleText, cls: 'akl-keyword-name'});
            if (targetText) {
                cardTitle.createSpan({text: targetText, cls: 'akl-target-name'});
            }

            // Card badges
            const cardBadges = cardHeader.createDiv({cls: 'akl-card-badges'});

            // Show group badge if keyword is in a group
            if (item.groupId) {
                const group = this.plugin.settings.keywordGroups.find(g => g.id === item.groupId);
                if (group) {
                    cardBadges.createSpan({text: `📁 ${group.name}`, cls: 'akl-badge akl-badge-group'});
                }
            }

            // Get effective settings for badge display
            const effectiveSettings = this.plugin.getEffectiveKeywordSettings(item);

            if (effectiveSettings.enableTags) {
                cardBadges.createSpan({text: 'Tags', cls: 'akl-badge akl-badge-tags'});
            }
            if (effectiveSettings.useRelativeLinks) {
                cardBadges.createSpan({text: 'MD Links', cls: 'akl-badge akl-badge-md-links'});
            }
            if (effectiveSettings.suggestMode) {
                cardBadges.createSpan({text: 'Suggest', cls: 'akl-badge akl-badge-suggest'});
            }
            const sharingKeywords = this.getKeywordsSharingText(item);
            if (sharingKeywords.length > 0) {
                const sharedBadge = cardBadges.createSpan({text: 'Shared', cls: 'akl-badge akl-badge-shared'});
                sharedBadge.setAttribute('aria-label', `Shares text with ${sharingKeywords.map(kw => kw.target).join(', ')} - target picked from context`);
            }

            // Get auto-discovered aliases for counting (will be reused later)
            const autoAliasesForItem = this.plugin.getAliasesForNote(item.target);

            // Count both manual variations and auto-discovered aliases
            const manualCount = (item.variations && item.variations.length) || 0;
            const autoCount = (autoAliasesForItem && autoAliasesForItem.length) || 0;
            const totalVariations = manualCount + autoCount;

            if (totalVariations > 0) {
                cardBadges.createSpan({
                    text: `${totalVariations} var`,
                    cls: 'akl-badge akl-badge-variations'
                });
            }

            // Card body (collapsible, built on first expand)
            const cardBody = cardDiv.createDiv({cls: 'akl-card-body'});

            const renderBody = () => {
            // Check if keyword is in a group (used throughout the settings below)
            const isInGroup = !!item.groupId;
            const groupName = isInGroup ? this.plugin.settings.keywordGroups.find(g => g.id === item.groupId)?.name : null;

            // Keyword input field
            const keywordSetting = new Setting(cardBody)
                .setName('Keyword')
                .setDesc('The text to search for in your notes')
                .addText(text => {
                    text.setValue(item.keyword)
                        .setPlaceholder('Enter keyword...');
                    text.inputEl.addClass('akl-input');

                    // Store reference to track the pending value
                    let pendingValue = item.keyword;

                    // Update pending value on every keystroke (but don't save yet)
                    text.inputEl.addEventListener('input', () => {
                        pendingValue = text.inputEl.value;
                        // Clear any error state while typing
                        text.inputEl.removeClass('akl-input-error');
                        keywordSetting.setDesc('The text to search for in your notes');
                        keywordSetting.descEl.removeClass('akl-error-text');
                    });

                    // Validate and save on blur
                    text.inputEl.addEventListener('blur', async () => {
                        const value = pendingValue.trim();

                        // Check for duplicates before saving
                        if (value) {
                            const duplicate = this.isDuplicateKeyword(value, item.id, isKeywordCaseSensitive(this.plugin.settings, item), item.target);
                            if (duplicate) {
                                text.inputEl.addClass('akl-input-error');
                                keywordSetting.setDesc(`Duplicate: "${value}" already exists (keyword: "${duplicate.keyword}" → ${duplicate.target})`);
                                keywordSetting.descEl.addClass('akl-error-text');
                                // Revert to previous value
                                text.setValue(item.keyword);
                                pendingValue = item.keyword;
                                return;
                            }
                        }

                        // Save the value
                        this.plugin.settings.keywords[i].keyword = value;
                        await this.plugin.saveSettings();
                        // Update card header title
                        this.updateCardHeader(cardTitle, value, this.plugin.settings.keywords[i].target);

                        // Auto-fill target if empty
                        if (!this.plugin.settings.keywords[i].target && value) {
                            this.plugin.settings.keywords[i].target = value;
                            await this.plugin.saveSettings();
                            this.display();
                        }
                    });

                    // Auto-focus if this is a new keyword (empty)
                    if (!item.keyword) {
                        setTimeout(() => text.inputEl.focus(), 50);
                    }
                });

            // Target note input field with fuzzy search modal
            const targetDesc = 'Click to search and select the note to create links to';
            const missingTargetDesc = 'No target note set - this keyword will not be linked until you choose one';
            const updateTargetWarning = (target) => {
                const missing = !!item.keyword && !(target && target.trim());
                targetSetting.setDesc(missing ? missingTargetDesc : targetDesc);
                targetSetting.descEl.toggleClass('akl-error-text', missing);
            };
            const targetSetting = new Setting(cardBody)
                .setName('Target note')
                .setDesc(targetDesc)
                .addText(text => {
                    // Get all markdown files for the fuzzy search
                    const files = this.app.vault.getMarkdownFiles();
                    const noteNames = new Set(); // Use Set to avoid duplicates

                    for (let file of files) {
                        // Add basename (note name without extension)
                        noteNames.add(file.basename);

                        // If note is in a subfolder, also add the full path without extension
                        if (file.path.includes('/')) {
                            const pathWithoutExt = file.path.endsWith('.md') ? file.path.slice(0, -3) : file.path;
                            noteNames.add(pathWithoutExt);
                        }
                    }

                    // Sort alphabetically
                    const allNotes = Array.from(noteNames).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

                    // Display current target
                    const displayValue = item.target || '';
                    text.setValue(displayValue)
                        .setPlaceholder('Type to search notes...');

                    // Attach note suggest
                    new NoteSuggest(this.app, text.inputEl, allNotes);

                    // Save on change
                    text.onChange(async (value) => {
                        this.plugin.settings.keywords[i].target = value;
                        await this.plugin.saveSettings();

                        // Update card header title without full re-render
                        this.updateCardHeader(cardTitle, this.plugin.settings.keywords[i].keyword, value);
                        updateTargetWarning(value);
                    });
                });
            updateTargetWarning(item.target);

            // Block reference input field
            new Setting(cardBody)
                .setName('Block reference')
                .setDesc('Optional: Link to a specific block (e.g., ^block-id for abbreviation definitions)')
                .addText(text => {
                    text.setValue(item.blockRef || '')
                        .setPlaceholder('^block-id')
                        .onChange(async (value) => {
                            // Sanitize: remove any wikilinks that might have been autocompleted
                            // Extract just the block reference ID from strings like "^[[Note|text]]-def"
                            let sanitized = value;

                            // Remove wikilinks: [[Note|text]] or [[Note]]
                            sanitized = sanitized.replace(/\[\[.*?\]\]/g, '');

                            // Ensure it starts with ^ if user provided content
                            if (sanitized && !sanitized.startsWith('^')) {
                                sanitized = '^' + sanitized;
                            }

                            // Remove any spaces
                            sanitized = sanitized.replace(/\s/g, '');

                            this.plugin.settings.keywords[i].blockRef = sanitized;
                            await this.plugin.saveSettings();

                            // Update the input field to show sanitized value
                            if (sanitized !== value) {
                                text.setValue(sanitized);
                            }
                        });

                    // Disable Obsidian's autocomplete on this field
                    text.inputEl.setAttribute('autocomplete', 'off');
                    text.inputEl.setAttribute('data-no-suggest', 'true');
                });

            // Require tag input field
            new Setting(cardBody)
                .setName('Require tag')
                .setDesc('Optional: Only link to target note if it has this tag (e.g., #reviewed or reviewed)')
                .addText(text => {
                    text.setValue(item.requireTag || '')
                        .setPlaceholder('#tag or tag')
                        .onChange(async (value) => {
                            // Normalize: ensure consistent format (remove # if present, we'll add it back for checking)
                            let normalized = value.trim();

                            // Remove leading # if present for storage (we'll handle both formats when checking)
                            if (normalized.startsWith('#')) {
                                normalized = normalized.substring(1);
                            }

                            this.plugin.settings.keywords[i].requireTag = normalized;
                            await this.plugin.saveSettings();
                        });

                    text.inputEl.setAttribute('autocomplete', 'off');
                });

            // Only link in notes already linking to target toggle
            new Setting(cardBody)
                .setName('Only link in notes already linking to target')
                .setDesc('Only create keyword links in notes that already have at least one link to the target note')
                .addToggle(toggle => {
                    const effectiveSettings = this.plugin.getEffectiveKeywordSettings(item);
                    toggle.setValue(effectiveSettings.onlyInNotesLinkingTo || false)
                        .onChange(async (value) => {
                            this.plugin.settings.keywords[i].onlyInNotesLinkingTo = value;
                            await this.plugin.saveSettings();
                        });
                });

            // Context hints - only relevant when another keyword shares this text
            if (sharingKeywords.length > 0) {
                const others = sharingKeywords.map(kw => `"${kw.keyword}" → ${kw.target}`).join(', ');
                new Setting(cardBody)
                    .setName('Context hints')
                    .setDesc(`Shares text with ${others}. Each mention links to whichever target its surroundings fit best. List words or phrases that point to this target (comma-separated), e.g. "planet, orbit, NASA".`)
                    .addText(text => {
                        text.setValue((item.contextHints || []).join(', '))
                            .setPlaceholder('word, another phrase')
                            .onChange(async (value) => {
                                this.plugin.settings.keywords[i].contextHints = value.split(',').map(h => h.trim()).filter(Boolean);
                                await this.plugin.saveSettings();
                            });
                        text.inputEl.addClass('akl-input');
                        text.inputEl.setAttribute('autocomplete', 'off');
                    });
            }

            // Variations with chip-style interface
            const variationsContainer = cardBody.createDiv({cls: 'akl-variations-section'});
            variationsContainer.createEl('div', {
                text: 'Variations',
                cls: 'setting-item-name'
            });
            variationsContainer.createEl('div', {
                text: 'Alternative spellings that also link to the target note',
                cls: 'setting-item-description'
            });

            // Reuse the auto-discovered aliases from earlier (already fetched for badge count)
            // const autoAliases = this.plugin.getAliasesForNote(item.target); // REMOVED - reusing autoAliasesForItem

            // Chips display area
            const chipsContainer = variationsContainer.createDiv({cls: 'akl-chips-container'});

            // Check if we have any variations or aliases to show
            const hasManualVariations = item.variations && item.variations.length > 0;
            const hasAutoAliases = autoAliasesForItem && autoAliasesForItem.length > 0;

            if (!hasManualVariations && !hasAutoAliases) {
                chipsContainer.createSpan({
                    text: 'No variations added yet',
                    cls: 'akl-no-variations'
                });
            } else {
                // Render manual variations
                this.renderVariationChips(chipsContainer, item.variations || [], i);

                // Render auto-discovered aliases (with different style)
                if (hasAutoAliases) {
                    this.renderAliasChips(chipsContainer, autoAliasesForItem);
                }
            }

            // Input for adding new variations
            const addVariationContainer = variationsContainer.createDiv({cls: 'akl-add-variation'});
            const variationInput = addVariationContainer.createEl('input', {
                type: 'text',
                placeholder: 'Type and press Enter to add...',
                cls: 'akl-variation-input'
            });

            variationInput.addEventListener('keydown', async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const newVariation = variationInput.value.trim();

                    if (!newVariation) {
                        return; // Empty input, do nothing
                    }

                    if (!item.variations) {
                        item.variations = [];
                    }

                    // Check for duplicates within this keyword (its own name and its variations)
                    const itemCaseSensitive = isKeywordCaseSensitive(this.plugin.settings, item);
                    const caseNote = itemCaseSensitive ? '' : ' (this keyword ignores case - set "Case sensitive" on the keyword or in General settings to treat them separately)';

                    if (keywordTextsConflict(item.keyword, itemCaseSensitive, newVariation, itemCaseSensitive)) {
                        new Notice(`"${newVariation}" already matches this keyword${caseNote}`);
                        variationInput.value = '';
                        return;
                    }

                    const isDuplicateLocal = item.variations.some(v => keywordTextsConflict(v, itemCaseSensitive, newVariation, itemCaseSensitive));

                    if (isDuplicateLocal) {
                        new Notice(`Variation already exists in this keyword${caseNote}`);
                        variationInput.value = '';
                        return;
                    }

                    // Check for duplicates across all keywords (excluding this one's variations)
                    const duplicateKeyword = this.isDuplicateKeyword(newVariation, item.id, itemCaseSensitive, item.target);
                    if (duplicateKeyword) {
                        new Notice(`"${newVariation}" already exists as keyword "${duplicateKeyword.keyword}" → ${duplicateKeyword.target}`);
                        variationInput.value = '';
                        return;
                    }

                    // Clear input immediately (before async operations)
                    variationInput.value = '';

                    // Add variation and save
                    item.variations.push(newVariation);
                    await this.plugin.saveSettings();

                    // Clear chips container before re-rendering
                    chipsContainer.empty();

                    // Re-render all chips (manual variations + auto aliases)
                    const hasManualVariations = item.variations && item.variations.length > 0;
                    const hasAutoAliases = autoAliasesForItem && autoAliasesForItem.length > 0;

                    if (!hasManualVariations && !hasAutoAliases) {
                        chipsContainer.createSpan({
                            text: 'No variations added yet',
                            cls: 'akl-no-variations'
                        });
                    } else {
                        // Render manual variations
                        this.renderVariationChips(chipsContainer, item.variations || [], i);

                        // Render auto-discovered aliases (with different style)
                        if (hasAutoAliases) {
                            this.renderAliasChips(chipsContainer, autoAliasesForItem);
                        }
                    }

                    // Restore focus to input
                    variationInput.focus();
                }
            });

            // Enable tags toggle
            const enableTagsSetting = new Setting(cardBody)
                .setName('Enable tags')
                .setDesc(isInGroup ? `Inherited from group "${groupName}"` : 'Automatically add tags to source and target notes')
                .addToggle(toggle => {
                    const effectiveSettings = this.plugin.getEffectiveKeywordSettings(item);
                    toggle.setValue(effectiveSettings.enableTags || false)
                        .setDisabled(isInGroup)
                        .onChange(async (value) => {
                            if (!isInGroup) {
                                this.plugin.settings.keywords[i].enableTags = value;
                                await this.plugin.saveSettings();
                                this.display();
                            }
                        });
                });
            if (isInGroup) {
                enableTagsSetting.settingEl.addClass('akl-disabled-setting');
            }

            // Use relative markdown links toggle
            const useRelativeLinksSetting = new Setting(cardBody)
                .setName('Use relative Markdown links')
                .setDesc(isInGroup ? `Inherited from group "${groupName}"` : 'Create Markdown links [text](note.md) instead of wikilinks [[note]]')
                .addToggle(toggle => {
                    const effectiveSettings = this.plugin.getEffectiveKeywordSettings(item);
                    toggle.setValue(effectiveSettings.useRelativeLinks || false)
                        .setDisabled(isInGroup)
                        .onChange(async (value) => {
                            if (!isInGroup) {
                                this.plugin.settings.keywords[i].useRelativeLinks = value;
                                await this.plugin.saveSettings();
                            }
                        });
                });
            if (isInGroup) {
                useRelativeLinksSetting.settingEl.addClass('akl-disabled-setting');
            }

            // Suggest mode toggle
            const suggestModeSetting = new Setting(cardBody)
                .setName('Suggest instead of auto-link')
                .setDesc(isInGroup ? `Inherited from group "${groupName}"` : 'Highlight keywords as suggestions instead of automatically creating links. Right-click to accept.')
                .addToggle(toggle => {
                    // Show effective value (from group if null)
                    const effectiveSettings = this.plugin.getEffectiveKeywordSettings(item);
                    toggle.setValue(effectiveSettings.suggestMode || false)
                        .setDisabled(isInGroup)
                        .onChange(async (value) => {
                            if (!isInGroup) {
                                this.plugin.settings.keywords[i].suggestMode = value;
                                await this.plugin.saveSettings();
                                this.display(); // Re-render to update badge
                            }
                        });
                });
            if (isInGroup) {
                suggestModeSetting.settingEl.addClass('akl-disabled-setting');
            }

            // Group assignment dropdown
            new Setting(cardBody)
                .setName('Keyword group')
                .setDesc('Assign to a group to inherit group settings. Group settings will be locked and cannot be overridden per-keyword.')
                .addDropdown(dropdown => {
                    // Add "None" option
                    dropdown.addOption('', '(No group)');

                    // Add all groups as options
                    this.plugin.settings.keywordGroups.forEach(group => {
                        dropdown.addOption(group.id, group.name);
                    });

                    dropdown.setValue(item.groupId || '')
                        .onChange(async (value) => {
                            this.plugin.settings.keywords[i].groupId = value || null;
                            await this.plugin.saveSettings();
                            this.display(); // Re-render to update UI and disable/enable settings
                        });
                });

            // Prevent self-link toggle (per-keyword)
            const preventSelfLinkSetting = new Setting(cardBody)
                .setName('Prevent self-link')
                .setDesc(isInGroup ? `Inherited from group "${groupName}"` : 'Prevent this keyword from linking on its own target note (overrides global setting)')
                .addToggle(toggle => {
                    const effectiveSettings = this.plugin.getEffectiveKeywordSettings(item);
                    toggle.setValue(effectiveSettings.preventSelfLink || false)
                        .setDisabled(isInGroup)
                        .onChange(async (value) => {
                            if (!isInGroup) {
                                this.plugin.settings.keywords[i].preventSelfLink = value;
                                await this.plugin.saveSettings();
                            }
                        });
                });
            if (isInGroup) {
                preventSelfLinkSetting.settingEl.addClass('akl-disabled-setting');
            }

            // Skip code blocks toggle (per-keyword)
            const skipCodeBlocksSetting = new Setting(cardBody)
                .setName('Skip code blocks')
                .setDesc(isInGroup
                    ? `Inherited from group "${groupName}"`
                    : 'Prevent this keyword from being linked or suggested inside fenced code blocks. "Inherit" uses the global setting.')
                .addDropdown(dropdown => {
                    const effectiveSettings = this.plugin.getEffectiveKeywordSettings(item);
                    // null = inherit global, true = always skip, false = never skip (override global)
                    const currentVal = isInGroup ? String(effectiveSettings.skipCodeBlocks || false) : String(item.skipCodeBlocks);
                    dropdown
                        .addOption('null', 'Inherit global setting')
                        .addOption('true', 'Always skip code blocks')
                        .addOption('false', 'Never skip code blocks')
                        .setValue(currentVal === 'null' || currentVal === 'undefined' ? 'null' : currentVal)
                        .setDisabled(isInGroup)
                        .onChange(async (value) => {
                            if (!isInGroup) {
                                this.plugin.settings.keywords[i].skipCodeBlocks = value === 'null' ? null : value === 'true';
                                await this.plugin.saveSettings();
                            }
                        });
                });
            if (isInGroup) {
                skipCodeBlocksSetting.settingEl.addClass('akl-disabled-setting');
            }

            // Case sensitive override (per-keyword)
            const caseSensitiveSetting = new Setting(cardBody)
                .setName('Case sensitive')
                .setDesc(isInGroup
                    ? `Inherited from group "${groupName}"`
                    : 'Whether this keyword and its variations must match exact case. "Inherit" uses the global setting.')
                .addDropdown(dropdown => {
                    // null = inherit global, true = exact case, false = ignore case
                    const source = isInGroup ? this.plugin.getEffectiveKeywordSettings(item) : item;
                    const currentVal = source.caseSensitive === null || source.caseSensitive === undefined ? 'null' : String(source.caseSensitive);
                    dropdown
                        .addOption('null', 'Inherit global setting')
                        .addOption('true', 'Match exact case')
                        .addOption('false', 'Ignore case')
                        .setValue(currentVal)
                        .setDisabled(isInGroup)
                        .onChange(async (value) => {
                            if (!isInGroup) {
                                this.plugin.settings.keywords[i].caseSensitive = value === 'null' ? null : value === 'true';
                                await this.plugin.saveSettings();
                            }
                        });
                });
            if (isInGroup) {
                caseSensitiveSetting.settingEl.addClass('akl-disabled-setting');
            }

            // Link Scope dropdown
            const linkScopeSetting = new Setting(cardBody)
                .setName('Link scope')
                .setDesc(isInGroup ? `Inherited from group "${groupName}"` : 'Control where this keyword will be linked')
                .addDropdown(dropdown => {
                    const effectiveSettings = this.plugin.getEffectiveKeywordSettings(item);
                    dropdown.addOption('vault-wide', 'Vault-wide (everywhere)')
                        .addOption('same-folder', 'Same folder only')
                        .addOption('source-folder', 'Source in specific folder')
                        .addOption('target-folder', 'Target in specific folder')
                        .setValue(effectiveSettings.linkScope || 'vault-wide')
                        .setDisabled(isInGroup)
                        .onChange(async (value) => {
                            if (!isInGroup) {
                                this.plugin.settings.keywords[i].linkScope = value;
                                await this.plugin.saveSettings();
                                this.display(); // Re-render to show/hide folder input
                            }
                        });
                });
            if (isInGroup) {
                linkScopeSetting.settingEl.addClass('akl-disabled-setting');
            }

            // Folder selector (only shown for source-folder or target-folder scopes)
            // For grouped keywords, show the group's folder (read-only)
            const effectiveScope = this.plugin.getEffectiveKeywordSettings(item);
            if (effectiveScope.linkScope === 'source-folder' || effectiveScope.linkScope === 'target-folder') {
                // Get all unique folders in the vault
                const folders = this.getAllFolders();

                // Add empty string for root option
                const allFolders = ['', ...folders];

                const folderSetting = new Setting(cardBody)
                    .setName('Folder')
                    .setDesc(isInGroup ? `Inherited from group "${groupName}"` : 'Type to search and select a folder')
                    .addText(text => {
                        // Display current folder or root
                        const displayValue = effectiveScope.scopeFolder || '/ (Root)';
                        text.setValue(displayValue)
                            .setPlaceholder('Type to search folders...')
                            .setDisabled(isInGroup);

                        if (isInGroup) return;

                        // Attach folder suggest
                        new FolderSuggest(this.app, text.inputEl, allFolders);

                        // Save on change
                        text.onChange(async (value) => {
                            // Handle root folder and normalize path
                            let folderValue = (value === '/ (Root)') ? '' : value;
                            if (folderValue) {
                                folderValue = normalizePath(folderValue);
                            }
                            this.plugin.settings.keywords[i].scopeFolder = folderValue;
                            await this.plugin.saveSettings();
                        });
                    });
                if (isInGroup) {
                    folderSetting.settingEl.addClass('akl-disabled-setting');
                }
            }

            // Card footer with actions
            const cardFooter = cardBody.createDiv({cls: 'akl-card-footer'});

            // Delete button
            const deleteBtn = cardFooter.createEl('button', {
                text: 'Delete keyword',
                cls: 'akl-delete-btn'
            });
            deleteBtn.addEventListener('click', async () => {
                // Remove this keyword from the array
                this.plugin.settings.keywords.splice(i, 1);
                await this.plugin.saveSettings();
                // Re-render to show updated list
                this.display();
            });
            }; // end renderBody

            setExpanded(!item.collapsed);
        }

        // Show message if no keywords match the search or group filter
        if (visibleCount === 0 && (this.searchFilter || this.groupFilter !== 'all')) {
            const noResults = container.createDiv({cls: 'akl-no-results'});
            noResults.createEl('p', {text: 'No keywords found'});
            noResults.createEl('p', {
                text: this.searchFilter
                    ? `No keywords match "${this.searchFilter}"`
                    : 'No keywords in this group',
                cls: 'akl-no-results-hint'
            });
        }

        this.renderBulkBar();

        // Scroll to the keyword card if needed (from addKeywordFromSelection)
        if (cardToScrollTo && scrollToId) {
            // Clear the scroll target so we don't scroll again on re-render
            this.plugin.scrollToKeywordId = null;

            // Scroll the card into view with a delay to ensure the settings modal is fully rendered
            // Using 300ms to account for modal open animation
            setTimeout(() => {
                cardToScrollTo.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Add a brief highlight animation
                cardToScrollTo.addClass('akl-highlight-pulse');
                setTimeout(() => {
                    cardToScrollTo.removeClass('akl-highlight-pulse');
                    cardToScrollTo.removeClass('akl-highlight-card');
                }, 2000);
            }, 300);
        }
    }

    /**
     * Render the list of groups with their settings
     * @param {HTMLElement} container - Container element to render into
     */
    renderGroups(container) {
        container.empty();  // Clear existing content

        // If no groups exist yet, show empty state
        if (this.plugin.settings.keywordGroups.length === 0) {
            const emptyState = container.createDiv({cls: 'akl-empty-state'});
            emptyState.createEl('p', {text: 'No groups yet'});
            emptyState.createEl('p', {
                text: 'Create a group to organize your keywords with shared settings',
                cls: 'akl-empty-hint'
            });
            return;
        }

        // Iterate through all group entries
        for (let i = 0; i < this.plugin.settings.keywordGroups.length; i++) {
            const group = this.plugin.settings.keywordGroups[i];

            // Initialize collapsed state if not set
            if (group.collapsed === undefined) {
                group.collapsed = false;
            }

            // Get keywords in this group
            const keywordsInGroup = this.plugin.settings.keywords.filter(kw => kw.groupId === group.id);

            // Create card container for this group entry
            const cardDiv = container.createDiv({cls: 'akl-keyword-card akl-group-card'});

            // Card header with collapse toggle
            const cardHeader = cardDiv.createDiv({cls: 'akl-card-header'});

            // Collapse toggle button
            const collapseBtn = cardHeader.createDiv({cls: 'akl-collapse-btn'});
            collapseBtn.innerHTML = group.collapsed ? '▶' : '▼';
            collapseBtn.setAttribute('aria-label', group.collapsed ? 'Expand' : 'Collapse');
            collapseBtn.addEventListener('click', async () => {
                // Toggle in place rather than re-rendering, so the list doesn't jump
                group.collapsed = !group.collapsed;
                cardBody.style.display = group.collapsed ? 'none' : '';
                collapseBtn.innerHTML = group.collapsed ? '▶' : '▼';
                collapseBtn.setAttribute('aria-label', group.collapsed ? 'Expand' : 'Collapse');
                await this.plugin.saveSettings();
            });

            // Card title area
            const cardTitle = cardHeader.createDiv({cls: 'akl-card-title'});
            cardTitle.createSpan({text: group.name, cls: 'akl-keyword-name'});
            cardTitle.createSpan({text: ` (${keywordsInGroup.length} keywords)`, cls: 'akl-target-name'});

            // Delete button
            const deleteBtn = cardHeader.createEl('button', {
                text: '🗑️ Delete',
                cls: 'akl-delete-btn'
            });
            deleteBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                // Remove group ID from all keywords in this group
                this.plugin.settings.keywords.forEach(kw => {
                    if (kw.groupId === group.id) {
                        kw.groupId = null;
                    }
                });
                // Remove the group
                this.plugin.settings.keywordGroups.splice(i, 1);
                await this.plugin.saveSettings();
                this.display();
            });

            // Card body (collapsible)
            const cardBody = cardDiv.createDiv({cls: 'akl-card-body'});
            if (group.collapsed) {
                cardBody.style.display = 'none';
            }

            // Group name input field
            new Setting(cardBody)
                .setName('Group name')
                .setDesc('Name for this group of keywords')
                .addText(text => {
                    text.setValue(group.name)
                        .setPlaceholder('Enter group name...')
                        .onChange(async (value) => {
                            this.plugin.settings.keywordGroups[i].name = value;
                            await this.plugin.saveSettings();
                            // Update card header title
                            cardTitle.empty();
                            cardTitle.createSpan({text: value, cls: 'akl-keyword-name'});
                            cardTitle.createSpan({text: ` (${keywordsInGroup.length} keywords)`, cls: 'akl-target-name'});
                        });
                    text.inputEl.addClass('akl-input');
                });

            // Keywords in group section
            const keywordsSection = cardBody.createDiv({cls: 'akl-group-keywords-section'});
            keywordsSection.createEl('h4', {text: 'Keywords in this group', cls: 'akl-subsection-header'});

            if (keywordsInGroup.length === 0) {
                keywordsSection.createEl('p', {
                    text: 'No keywords in this group yet. Add keywords below or assign them from the keywords tab.',
                    cls: 'akl-hint-text'
                });
            } else {
                const keywordsList = keywordsSection.createDiv({cls: 'akl-keywords-list'});
                keywordsInGroup.forEach(kw => {
                    const kwChip = keywordsList.createDiv({cls: 'akl-keyword-chip'});
                    kwChip.createSpan({text: kw.keyword || 'Untitled'});
                    const removeBtn = kwChip.createSpan({text: '×', cls: 'akl-chip-remove'});
                    removeBtn.addEventListener('click', async () => {
                        kw.groupId = null;
                        await this.plugin.saveSettings();
                        this.display();
                    });
                });
            }

            // Add keywords button
            const addKeywordsBtn = keywordsSection.createEl('button', {
                text: '+ Add keywords to group',
                cls: 'akl-button-secondary'
            });
            addKeywordsBtn.addEventListener('click', () => {
                // Open fuzzy search modal to select keywords
                // Fetch current keywords in group dynamically to avoid stale data
                const currentKeywordsInGroup = this.plugin.settings.keywords.filter(kw => kw.groupId === group.id);
                new KeywordGroupAssignModal(this.app, this.plugin, group.id, currentKeywordsInGroup).open();
            });

            // Group settings section
            const settingsSection = cardBody.createDiv({cls: 'akl-group-settings-section'});
            settingsSection.createEl('h4', {text: 'Group settings', cls: 'akl-subsection-header'});
            settingsSection.createEl('p', {
                text: 'These settings apply to all keywords in this group.',
                cls: 'akl-hint-text'
            });

            // Link scope dropdown
            new Setting(settingsSection)
                .setName('Link scope')
                .setDesc('Control where keywords in this group will be linked')
                .addDropdown(dropdown => dropdown
                    .addOption('vault-wide', 'Vault-wide (everywhere)')
                    .addOption('same-folder', 'Same folder only')
                    .addOption('source-folder', 'Source in specific folder')
                    .addOption('target-folder', 'Target in specific folder')
                    .setValue(group.settings.linkScope || 'vault-wide')
                    .onChange(async (value) => {
                        group.settings.linkScope = value;
                        await this.plugin.saveSettings();
                        this.display(); // Re-render to show/hide folder input
                    }));

            // Folder selector (only shown for source-folder or target-folder scopes)
            if (group.settings.linkScope === 'source-folder' || group.settings.linkScope === 'target-folder') {
                const allFolders = ['', ...this.getAllFolders()];

                new Setting(settingsSection)
                    .setName('Folder')
                    .setDesc('Type to search and select a folder')
                    .addText(text => {
                        text.setValue(group.settings.scopeFolder || '/ (Root)')
                            .setPlaceholder('Type to search folders...');

                        new FolderSuggest(this.app, text.inputEl, allFolders);

                        text.onChange(async (value) => {
                            let folderValue = (value === '/ (Root)') ? '' : value;
                            if (folderValue) {
                                folderValue = normalizePath(folderValue);
                            }
                            group.settings.scopeFolder = folderValue;
                            await this.plugin.saveSettings();
                        });
                    });
            }

            // Enable tags toggle
            new Setting(settingsSection)
                .setName('Enable tags')
                .setDesc('Add #tag to target notes when linking')
                .addToggle(toggle => toggle
                    .setValue(group.settings.enableTags || false)
                    .onChange(async (value) => {
                        group.settings.enableTags = value;
                        await this.plugin.saveSettings();
                    }));

            // Suggest mode toggle
            new Setting(settingsSection)
                .setName('Suggest mode')
                .setDesc('Suggest links instead of creating them automatically')
                .addToggle(toggle => toggle
                    .setValue(group.settings.suggestMode || false)
                    .onChange(async (value) => {
                        group.settings.suggestMode = value;
                        await this.plugin.saveSettings();
                    }));

            // Use relative links toggle
            new Setting(settingsSection)
                .setName('Use Markdown links')
                .setDesc('Use [text](link.md) format instead of [[wikilinks]]')
                .addToggle(toggle => toggle
                    .setValue(group.settings.useRelativeLinks || false)
                    .onChange(async (value) => {
                        group.settings.useRelativeLinks = value;
                        await this.plugin.saveSettings();
                    }));

            // Prevent self-link toggle
            new Setting(settingsSection)
                .setName('Prevent self-links')
                .setDesc('Don\'t link keywords on their own target note')
                .addToggle(toggle => toggle
                    .setValue(group.settings.preventSelfLink || false)
                    .onChange(async (value) => {
                        group.settings.preventSelfLink = value;
                        await this.plugin.saveSettings();
                    }));

            // Skip code blocks toggle
            new Setting(settingsSection)
                .setName('Skip code blocks')
                .setDesc('Prevent keywords in this group from being linked or suggested inside fenced code blocks (``` or ~~~)')
                .addToggle(toggle => toggle
                    .setValue(group.settings.skipCodeBlocks || false)
                    .onChange(async (value) => {
                        group.settings.skipCodeBlocks = value;
                        await this.plugin.saveSettings();
                    }));

            // Case sensitive override
            new Setting(settingsSection)
                .setName('Case sensitive')
                .setDesc('Whether keywords in this group must match exact case. "Inherit" uses the global setting.')
                .addDropdown(dropdown => {
                    const current = group.settings.caseSensitive;
                    dropdown
                        .addOption('null', 'Inherit global setting')
                        .addOption('true', 'Match exact case')
                        .addOption('false', 'Ignore case')
                        .setValue(current === null || current === undefined ? 'null' : String(current))
                        .onChange(async (value) => {
                            group.settings.caseSensitive = value === 'null' ? null : value === 'true';
                            await this.plugin.saveSettings();
                        });
                });
        }
    }

    /**
     * Render variation chips with remove buttons
     * @param {HTMLElement} container - Container for chips
     * @param {Array} variations - Array of variation strings
     * @param {number} keywordIndex - Index of the keyword in settings
     */
    renderVariationChips(container, variations, keywordIndex) {
        // Don't empty container - we'll add both manual and auto chips

        if (variations.length === 0) {
            // Only show "no variations" if there are also no aliases coming
            // This check will be done by the caller
            return;
        }

        variations.forEach((variation, varIndex) => {
            const chip = container.createDiv({cls: 'akl-chip'});
            chip.createSpan({text: variation, cls: 'akl-chip-text'});

            const removeBtn = chip.createSpan({text: '×', cls: 'akl-chip-remove'});
            removeBtn.setAttribute('aria-label', `Remove ${variation}`);
            removeBtn.addEventListener('click', async () => {
                this.plugin.settings.keywords[keywordIndex].variations.splice(varIndex, 1);
                await this.plugin.saveSettings();
                this.display();
            });
        });
    }

    /**
     * Render auto-discovered alias chips (from note frontmatter)
     * These are shown with a different style and cannot be removed (auto-discovered)
     * @param {HTMLElement} container - Container element
     * @param {Array<string>} aliases - Array of auto-discovered aliases
     */
    renderAliasChips(container, aliases) {
        if (!aliases || aliases.length === 0) {
            return;
        }

        aliases.forEach(alias => {
            const chip = container.createDiv({cls: 'akl-chip akl-chip-auto'});
            chip.createSpan({text: alias, cls: 'akl-chip-text'});

            // Add a small indicator that this is auto-discovered
            const autoIndicator = chip.createSpan({text: '🔗', cls: 'akl-chip-auto-indicator'});
            autoIndicator.setAttribute('aria-label', 'Auto-discovered from note alias');
            autoIndicator.setAttribute('title', 'Auto-discovered from note frontmatter');
        });
    }

    /**
     * Get all unique folders in the vault
     * @returns {Array<string>} Sorted array of folder paths
     */
    /**
     * Display the Tools tab
     */
    displayToolsTab(containerEl) {

        // ── Maintenance ──────────────────────────────────────────────────────
        new Setting(containerEl)
            .setName('Maintenance')
            .setDesc('Fix and clean up keyword links across your vault.')
            .setHeading();

        // 1. Remove links from headings
        new Setting(containerEl)
            .setName('Remove links from headings')
            .setDesc('Scans all notes and unwraps keyword links inside heading lines (e.g. ## [[dog]] → ## dog).')
            .addButton(button => button
                .setButtonText('Run')
                .setCta()
                .onClick(async () => {
                    const files = this.app.vault.getMarkdownFiles();
                    let filesChanged = 0;
                    let linksRemoved = 0;

                    for (const file of files) {
                        const content = await this.app.vault.read(file);
                        const lines = content.split('\n');
                        let fileChanged = false;

                        const newLines = lines.map(line => {
                            if (!/^#{1,6} /.test(line)) return line;
                            return line.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, target, alias) => {
                                linksRemoved++;
                                fileChanged = true;
                                return alias || target;
                            });
                        });

                        if (fileChanged) {
                            await this.app.vault.modify(file, newLines.join('\n'));
                            filesChanged++;
                        }
                    }

                    new Notice(`Done — removed ${linksRemoved} link${linksRemoved !== 1 ? 's' : ''} from headings across ${filesChanged} file${filesChanged !== 1 ? 's' : ''}.`);
                }));

        // 2. Unlink all keywords (vault-wide)
        new Setting(containerEl)
            .setName('Unlink all keywords')
            .setDesc('Removes all wiki-links created by this plugin from every note in the vault, restoring plain text. Cannot be undone.')
            .addButton(button => button
                .setButtonText('Run')
                .setWarning()
                .onClick(async () => {
                    const files = this.app.vault.getMarkdownFiles();
                    let filesChanged = 0;
                    let linksRemoved = 0;

                    for (const file of files) {
                        const content = await this.app.vault.read(file);
                        // Unwrap [[target|alias]] → alias, [[target]] → target
                        const newContent = content.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, target, alias) => {
                            linksRemoved++;
                            return alias || target;
                        });

                        if (newContent !== content) {
                            await this.app.vault.modify(file, newContent);
                            filesChanged++;
                        }
                    }

                    new Notice(`Done — removed ${linksRemoved} link${linksRemoved !== 1 ? 's' : ''} across ${filesChanged} file${filesChanged !== 1 ? 's' : ''}.`);
                }));

        // 3. Unlink a specific keyword
        new Setting(containerEl)
            .setName('Unlink a specific keyword')
            .setDesc('Remove links for one keyword across the whole vault without affecting others.')
            .setHeading();

        const unlinkRow = containerEl.createDiv({ cls: 'akl-tool-row' });
        const unlinkSelect = unlinkRow.createEl('select', { cls: 'akl-tool-select dropdown' });

        const allKeywords = this.plugin.settings.keywords.flatMap(kw =>
            [kw.keyword, ...(kw.variations || [])].map(word => ({ word, target: kw.target }))
        );

        unlinkSelect.createEl('option', { text: '— select keyword —', value: '' });
        allKeywords.forEach(({ word }) => {
            unlinkSelect.createEl('option', { text: word, value: word });
        });

        const unlinkBtn = unlinkRow.createEl('button', { text: 'Unlink', cls: 'mod-warning' });
        unlinkBtn.addEventListener('click', async () => {
            const keyword = unlinkSelect.value;
            if (!keyword) { new Notice('Please select a keyword first.'); return; }

            const files = this.app.vault.getMarkdownFiles();
            let filesChanged = 0;
            let linksRemoved = 0;

            // Match [[target|keyword]] or [[keyword]]
            const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = new RegExp(`\\[\\[[^\\]|]*(?:\\|${escaped})?\\]\\]`, 'gi');

            for (const file of files) {
                const content = await this.app.vault.read(file);
                const newContent = content.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, target, alias) => {
                    const displayed = alias || target;
                    if (displayed.toLowerCase() === keyword.toLowerCase()) {
                        linksRemoved++;
                        return displayed;
                    }
                    return match;
                });

                if (newContent !== content) {
                    await this.app.vault.modify(file, newContent);
                    filesChanged++;
                }
            }

            new Notice(`Done — unlinked "${keyword}" in ${filesChanged} file${filesChanged !== 1 ? 's' : ''} (${linksRemoved} link${linksRemoved !== 1 ? 's' : ''} removed).`);
        });

        // ── Audit ─────────────────────────────────────────────────────────────
        new Setting(containerEl)
            .setName('Audit')
            .setDesc('Inspect your keywords and vault for issues.')
            .setHeading();

        // 4. Find broken keyword targets
        new Setting(containerEl)
            .setName('Find broken keyword targets')
            .setDesc('Lists keywords whose target note does not exist in the vault.')
            .addButton(button => button
                .setButtonText('Run')
                .onClick(() => {
                    const files = this.app.vault.getMarkdownFiles();
                    const fileNames = new Set(files.map(f => f.basename.toLowerCase()));

                    const broken = this.plugin.settings.keywords.filter(kw => {
                        if (!kw.target || !kw.target.trim()) return false;
                        const base = kw.target.split('/').pop().replace(/\.md$/, '').toLowerCase();
                        return !fileNames.has(base);
                    });

                    if (broken.length === 0) {
                        new Notice('All keyword targets exist in the vault.');
                        return;
                    }

                    const resultsEl = containerEl.querySelector('.akl-broken-targets-results');
                    if (resultsEl) resultsEl.remove();

                    const results = containerEl.createDiv({ cls: 'akl-tool-results akl-broken-targets-results' });
                    results.createEl('p', { text: `${broken.length} broken target${broken.length !== 1 ? 's' : ''} found:`, cls: 'akl-tool-results-title' });
                    const list = results.createEl('ul', { cls: 'akl-help-list' });
                    broken.forEach(kw => list.createEl('li', { text: `"${kw.keyword}" → "${kw.target}"` }));
                }));

        // 5. Find unlinked keyword mentions
        new Setting(containerEl)
            .setName('Find unlinked keyword mentions')
            .setDesc('Scans the vault for keyword mentions that would be linked by running "Link keywords in all notes".')
            .addButton(button => button
                .setButtonText('Run')
                .onClick(async () => {
                    const files = this.app.vault.getMarkdownFiles();
                    // Use the real linking engine in preview mode so the audit applies exactly
                    // the same rules (scope, tags, first occurrence, skipped contexts, etc.)
                    const linker = this.plugin.keywordLinker;
                    linker.settings = this.plugin.settings;
                    const keywordMap = this.plugin.buildKeywordMap();
                    await linker.warmContextCache(keywordMap);

                    const unlinked = new Map(); // lowercase keyword + target → { label, files: Set of file basenames }

                    for (const file of files) {
                        const content = await this.app.vault.cachedRead(file);
                        const processed = linker.processContent(content, file, true, true, keywordMap);

                        for (const change of processed.changes) {
                            const key = `${change.keyword.toLowerCase()}\u0000${change.target.toLowerCase()}`;
                            if (!unlinked.has(key)) {
                                unlinked.set(key, { label: `"${change.keyword}" → ${change.target}`, files: new Set() });
                            }
                            unlinked.get(key).files.add(file.basename);
                        }
                    }

                    const prevResults = containerEl.querySelector('.akl-unlinked-results');
                    if (prevResults) prevResults.remove();

                    const results = containerEl.createDiv({ cls: 'akl-tool-results akl-unlinked-results' });

                    if (unlinked.size === 0) {
                        results.createEl('p', { text: 'No unlinked keyword mentions found.', cls: 'akl-tool-results-title' });
                        return;
                    }

                    results.createEl('p', { text: `${unlinked.size} keyword${unlinked.size !== 1 ? 's' : ''} found with unlinked mentions:`, cls: 'akl-tool-results-title' });
                    const list = results.createEl('ul', { cls: 'akl-help-list' });
                    unlinked.forEach(({ label, files: fileSet }) => {
                        const fileList = Array.from(fileSet).join(', ');
                        list.createEl('li', { text: `${label} — in: ${fileList}` });
                    });
                }));

        // 6. Orphaned keywords report
        new Setting(containerEl)
            .setName('Orphaned keywords report')
            .setDesc('Lists keywords that have never been linked anywhere in the vault — candidates for removal.')
            .addButton(button => button
                .setButtonText('Run')
                .onClick(async () => {
                    const files = this.app.vault.getMarkdownFiles();
                    const keywords = this.plugin.settings.keywords;

                    // Build a set of all link targets used across the vault
                    const usedTargets = new Set();
                    for (const file of files) {
                        const content = await this.app.vault.read(file);
                        const matches = content.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g);
                        for (const m of matches) {
                            usedTargets.add(m[1].toLowerCase());
                        }
                    }

                    const orphaned = keywords.filter(kw => {
                        if (!kw.target) return false;
                        return !usedTargets.has(kw.target.toLowerCase()) &&
                               !usedTargets.has(kw.keyword.toLowerCase());
                    });

                    const prevResults = containerEl.querySelector('.akl-orphaned-results');
                    if (prevResults) prevResults.remove();

                    const results = containerEl.createDiv({ cls: 'akl-tool-results akl-orphaned-results' });

                    if (orphaned.length === 0) {
                        results.createEl('p', { text: 'No orphaned keywords found — all keywords are linked somewhere in the vault.', cls: 'akl-tool-results-title' });
                        return;
                    }

                    results.createEl('p', { text: `${orphaned.length} orphaned keyword${orphaned.length !== 1 ? 's' : ''} found:`, cls: 'akl-tool-results-title' });
                    const list = results.createEl('ul', { cls: 'akl-help-list' });
                    orphaned.forEach(kw => list.createEl('li', { text: `"${kw.keyword}" → "${kw.target}"` }));
                }));
    }

    /**
     * Display the Help tab
     */
    displayHelpTab(containerEl) {
        new Setting(containerEl)
            .setName('Auto Keyword Linker — Help')
            .setDesc('How to use the plugin and where to get support.')
            .setHeading();

        new Setting(containerEl)
            .setName('Getting started')
            .setHeading();

        const introEl = containerEl.createEl('p', { cls: 'akl-help-text' });
        introEl.setText('Auto Keyword Linker automatically turns keywords in your notes into Obsidian wiki-links. Add a keyword and point it to a target note — every time that word appears in your vault, it will be linked.');

        new Setting(containerEl)
            .setName('Basic usage')
            .setHeading();

        const steps = [
            '1. Go to the Keywords tab and add a keyword along with the note it should link to.',
            '2. Open any note containing that keyword and run "Link keywords" from the command palette (or enable Auto-link on save in General settings).',
            '3. The keyword will be wrapped in a wiki-link: [[target|keyword]].',
            '4. Use variations to catch alternate forms of the same word (e.g. "dogs", "doggo").',
            '5. Use Groups to apply shared settings across multiple keywords at once.'
        ];

        const stepsEl = containerEl.createEl('ul', { cls: 'akl-help-list' });
        steps.forEach(step => stepsEl.createEl('li', { text: step }));

        new Setting(containerEl)
            .setName('Tips')
            .setHeading();

        const tips = [
            'Enable "First occurrence only" to avoid over-linking repeated words in the same note.',
            'Enable "Skip headings" (General tab) to prevent keywords from being linked inside heading lines — this avoids breaking heading-based anchor links.',
            'Enable "Prevent self-links" so a note about "dog" does not link the word dog back to itself.',
            'Use Suggest mode on a keyword to review proposed links before they are applied.',
            'To stop a keyword linking in one note, right-click its link and choose "Unlink and don\'t link again in this note". This adds the target to the note\'s akl-ignore property. Use "akl-ignore: all" to turn off linking for a whole note.',
            'Use the Tools tab to bulk-remove any links that were previously added inside headings.'
        ];

        const tipsEl = containerEl.createEl('ul', { cls: 'akl-help-list' });
        tips.forEach(tip => tipsEl.createEl('li', { text: tip }));

        new Setting(containerEl)
            .setName('Support & feedback')
            .setHeading();

        new Setting(containerEl)
            .setName('Report an issue or request a feature')
            .setDesc('Found a bug or have an idea? Open an issue on GitHub.')
            .addButton(button => button
                .setButtonText('Open GitHub')
                .onClick(() => {
                    window.open('https://github.com/danrhodes/AutoKeywordLinker', '_blank');
                }));
    }

    getAllFolders() {
        const folders = new Set();

        // Get all folders from the vault
        const allFolders = this.app.vault.getAllLoadedFiles()
            .filter(f => f.children) // Only folders have children
            .map(f => f.path);

        allFolders.forEach(folder => {
            if (folder && folder !== '/') {
                folders.add(folder);
            }
        });

        // Sort alphabetically
        return Array.from(folders).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    }

    /**
     * Add custom CSS styles for the improved UI
     *
     * Note: Styles are now loaded from styles.css file included in the plugin release.
     * This function is kept for backwards compatibility but no longer creates style elements.
     */
    addCustomStyles() {
        // Styles are now loaded from styles.css file
        // No dynamic style creation needed
    }
}

module.exports = AutoKeywordLinkerSettingTab;
