/**
 * Add custom CSS styles for the improved UI
 * This is called on plugin load to ensure styles are available for all modals
 *
 * Note: Styles are now loaded from styles.css file included in the plugin release.
 * This function is kept for backwards compatibility but no longer creates style elements.
 */
function addCustomStyles() {
    // Styles are now loaded from styles.css file
    // No dynamic style creation needed
}

module.exports = { addCustomStyles };
