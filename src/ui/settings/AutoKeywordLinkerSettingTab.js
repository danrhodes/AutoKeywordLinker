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

class AutoKeywordLinkerSettingTab extends PluginSettingTab {
    /**
     * @param {App} app - Obsidian app instance
     * @param {Plugin} plugin - Reference to the plugin instance
     */
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.searchFilter = ''; // Track current search term
        this.currentTab = 'keywords'; // Track which tab is active: 'keywords', 'groups', 'general', 'import-export'
    }

    /**
     * Display the settings tab
     * Called when the user opens the settings
     */
    display() {
        const {containerEl} = this;
        containerEl.empty();  // Clear any existing content

        // Add custom CSS for improved UI
        this.addCustomStyles();

        // Main heading
        const headerDiv = containerEl.createDiv({cls: 'akl-header'});
        headerDiv.createEl('h2', {text: 'Auto keyword linker'});

        // Tab navigation
        const tabNav = containerEl.createDiv({cls: 'akl-tab-nav'});

        const tabs = [
            { id: 'keywords', label: 'Keywords', icon: '🔤' },
            { id: 'groups', label: 'Groups', icon: '📁' },
            { id: 'general', label: 'General', icon: '⚙️' },
            { id: 'import-export', label: 'Import/export', icon: '📦' }
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
        }
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

        // Search box for filtering keywords
        const searchContainer = containerEl.createDiv({cls: 'akl-search-container'});
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

        // Container for keyword list
        const keywordsDiv = containerEl.createDiv({cls: 'akl-keywords-container'});

        // Render all current keywords
        this.renderKeywords(keywordsDiv);

        // Add button to create new keyword entries
        const addBtnContainer = containerEl.createDiv({cls: 'akl-add-button-container'});
        const addBtn = addBtnContainer.createEl('button', {
            text: '+ Add keyword',
            cls: 'mod-cta akl-add-button'
        });
        addBtn.addEventListener('click', () => {
            // Add empty keyword object to settings
            // Use null for inheritable boolean settings so they inherit from group if assigned
            this.plugin.settings.keywords.push({
                id: generateId('kw'),
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
        });
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
            .setDesc('Organize keywords into groups with shared settings. Keywords inherit settings from their group.')
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
                    preventSelfLink: false
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
            .setDesc('Match keywords with exact case')
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

        // Filter keywords based on search term
        const searchTerm = this.searchFilter.toLowerCase();
        let visibleCount = 0;

        // Iterate through all keyword entries
        for (let i = 0; i < this.plugin.settings.keywords.length; i++) {
            const item = this.plugin.settings.keywords[i];

            // Filter logic: search in keyword, target, and variations
            if (searchTerm) {
                const matchesKeyword = item.keyword && item.keyword.toLowerCase().includes(searchTerm);
                const matchesTarget = item.target && item.target.toLowerCase().includes(searchTerm);
                const matchesVariations = item.variations && item.variations.some(v =>
                    v.toLowerCase().includes(searchTerm)
                );

                // Skip this keyword if it doesn't match the search
                if (!matchesKeyword && !matchesTarget && !matchesVariations) {
                    continue;
                }
            }

            visibleCount++;

            // Initialize collapsed state if not set
            if (item.collapsed === undefined) {
                item.collapsed = false;
            }

            // Create card container for this keyword entry
            const cardDiv = container.createDiv({cls: 'akl-keyword-card'});

            // Card header with collapse toggle
            const cardHeader = cardDiv.createDiv({cls: 'akl-card-header'});

            // Collapse toggle button
            const collapseBtn = cardHeader.createDiv({cls: 'akl-collapse-btn'});
            collapseBtn.innerHTML = item.collapsed ? '▶' : '▼';
            collapseBtn.setAttribute('aria-label', item.collapsed ? 'Expand' : 'Collapse');
            collapseBtn.addEventListener('click', async () => {
                item.collapsed = !item.collapsed;
                await this.plugin.saveSettings();
                this.display();
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

            // Card body (collapsible)
            const cardBody = cardDiv.createDiv({cls: 'akl-card-body'});
            if (item.collapsed) {
                cardBody.style.display = 'none';
            }

            // Check if keyword is in a group (used throughout the settings below)
            const isInGroup = !!item.groupId;
            const groupName = isInGroup ? this.plugin.settings.keywordGroups.find(g => g.id === item.groupId)?.name : null;

            // Keyword input field
            new Setting(cardBody)
                .setName('Keyword')
                .setDesc('The text to search for in your notes')
                .addText(text => {
                    text.setValue(item.keyword)
                        .setPlaceholder('Enter keyword...')
                        .onChange(async (value) => {
                            this.plugin.settings.keywords[i].keyword = value;
                            await this.plugin.saveSettings();
                            // Update card header title without full re-render
                            this.updateCardHeader(cardTitle, value, this.plugin.settings.keywords[i].target);
                        });
                    text.inputEl.addClass('akl-input');

                    // Auto-fill target only when user leaves the field (on blur)
                    text.inputEl.addEventListener('blur', async () => {
                        // If target is empty, auto-fill it with the keyword
                        if (!this.plugin.settings.keywords[i].target && this.plugin.settings.keywords[i].keyword) {
                            this.plugin.settings.keywords[i].target = this.plugin.settings.keywords[i].keyword;
                            await this.plugin.saveSettings();
                            // Update card header and re-render to show the auto-filled target
                            this.display();
                        }
                    });
                });

            // Target note input field with fuzzy search modal
            new Setting(cardBody)
                .setName('Target note')
                .setDesc('Click to search and select the note to create links to')
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
                    });
                });

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

                    // Check for duplicates (case-insensitive)
                    const isDuplicate = item.variations.some(v => v.toLowerCase() === newVariation.toLowerCase());

                    if (isDuplicate) {
                        new Notice('Variation already exists');
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
            if (item.linkScope === 'source-folder' || item.linkScope === 'target-folder') {
                // Get all unique folders in the vault
                const folders = this.getAllFolders();

                // Add empty string for root option
                const allFolders = ['', ...folders];

                new Setting(cardBody)
                    .setName('Folder')
                    .setDesc('Type to search and select a folder')
                    .addText(text => {
                        // Display current folder or root
                        const displayValue = item.scopeFolder || '/ (Root)';
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
                            this.plugin.settings.keywords[i].scopeFolder = folderValue;
                            await this.plugin.saveSettings();
                        });
                    });
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
        }

        // Show message if no keywords match the search
        if (visibleCount === 0 && searchTerm) {
            const noResults = container.createDiv({cls: 'akl-no-results'});
            noResults.createEl('p', {text: 'No keywords found'});
            noResults.createEl('p', {
                text: `No keywords match "${this.searchFilter}"`,
                cls: 'akl-no-results-hint'
            });
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
                group.collapsed = !group.collapsed;
                await this.plugin.saveSettings();
                this.display();
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
                text: 'These settings apply to all keywords in this group (unless overridden per-keyword).',
                cls: 'akl-hint-text'
            });

            // Link scope dropdown
            new Setting(settingsSection)
                .setName('Link scope')
                .setDesc('Where this group\'s keywords should create links')
                .addDropdown(dropdown => dropdown
                    .addOption('vault-wide', 'Vault-wide (link in all notes)')
                    .addOption('source-folder', 'Source folder only')
                    .addOption('target-folder', 'Target folder only')
                    .setValue(group.settings.linkScope || 'vault-wide')
                    .onChange(async (value) => {
                        group.settings.linkScope = value;
                        await this.plugin.saveSettings();
                    }));

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
