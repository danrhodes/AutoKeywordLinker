/**
 * Statistics command implementation
 * Extracted from main-source.js (Session 4)
 */

/**
 * Show statistics modal
 * @param {Object} app - Obsidian app instance
 * @param {Object} settings - Plugin settings
 * @param {Class} StatisticsModal - StatisticsModal class
 */
function showStatistics(app, settings, StatisticsModal) {
    new StatisticsModal(app, settings).open();
}

module.exports = {
    showStatistics
};
