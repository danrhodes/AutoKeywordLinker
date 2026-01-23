/**
 * Event Registration Module
 * Registers all plugin event listeners with Obsidian
 * Extracted from main-source.js (Session 8)
 */

const SuggestionHandler = require('../ui/SuggestionHandler');
const QuickAddKeywordModal = require('../ui/modals/QuickAddKeywordModal');

/**
 * Register all event listeners for the plugin
 * @param {Plugin} plugin - The plugin instance
 */
function registerEvents(plugin) {
    // ============================================================
    // SUGGESTION CONTEXT MENU SETUP
    // ============================================================

    // Set up context menu for suggested links
    SuggestionHandler.setupSuggestionContextMenu(plugin);

    // ============================================================
    // MARKDOWN POST-PROCESSOR (READING MODE)
    // ============================================================

    // Register markdown post-processor for suggested links (Reading mode)
    plugin.registerMarkdownPostProcessor((element) => {
        SuggestionHandler.processSuggestedLinks(plugin, element);
    });

    // ============================================================
    // LIVE PREVIEW CLICK HANDLER
    // ============================================================

    // Set up Live Preview mode click handler
    SuggestionHandler.setupLivePreviewClickHandler(plugin);

    // ============================================================
    // EDITOR CONTEXT MENU
    // ============================================================

    // Register editor menu to add our option to right-click menu
    plugin.registerEvent(
        plugin.app.workspace.on('editor-menu', (menu, editor) => {
            // --------------------------------------------------------
            // ADD KEYWORD FROM SELECTION
            // --------------------------------------------------------
            // Check if text is selected
            const selectedText = editor.getSelection();
            if (selectedText && selectedText.trim().length > 0) {
                // Quick add keyword - streamlined modal
                menu.addItem((item) => {
                    item
                        .setTitle('Quick add keyword')
                        .setIcon('plus-circle')
                        .onClick(() => {
                            new QuickAddKeywordModal(plugin.app, plugin, selectedText).open();
                        });
                });

                // Add keyword... - opens settings with pre-filled keyword
                menu.addItem((item) => {
                    item
                        .setTitle('Add keyword...')
                        .setIcon('file-plus')
                        .onClick(() => {
                            plugin.addKeywordFromSelection(selectedText.trim());
                        });
                });

                menu.addSeparator();
            }

            // --------------------------------------------------------
            // LINK SUGGESTIONS
            // --------------------------------------------------------
            // Check if there are ANY suggestions in the entire document
            const content = editor.getValue();
            const spanPattern = /<span class="akl-suggested-link"[^>]*>([^<]+)<\/span>/;

            if (spanPattern.test(content)) {
                // Add menu items at the top
                menu.addItem((item) => {
                    item
                        .setTitle('Review all link suggestions...')
                        .setIcon('list-checks')
                        .onClick(() => {
                            plugin.reviewSuggestions(editor);
                        });
                });

                menu.addItem((item) => {
                    item
                        .setTitle('Accept all suggestions on this line')
                        .setIcon('check')
                        .onClick(() => {
                            plugin.acceptSuggestionAtCursor(editor);
                        });
                });

                menu.addSeparator();
            }
        })
    );

    // ============================================================
    // STATUS BAR
    // ============================================================

    // Add status bar item for suggestion count
    plugin.statusBarItem = plugin.addStatusBarItem();
    SuggestionHandler.updateStatusBar(plugin);

    // Update status bar when active leaf changes
    plugin.registerEvent(
        plugin.app.workspace.on('active-leaf-change', () => {
            SuggestionHandler.updateStatusBar(plugin);
        })
    );

    // Update status bar when editor changes
    plugin.registerEvent(
        plugin.app.workspace.on('editor-change', () => {
            setTimeout(() => SuggestionHandler.updateStatusBar(plugin), 100);
        })
    );
}

module.exports = { registerEvents };
