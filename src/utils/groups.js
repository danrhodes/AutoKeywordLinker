/**
 * Keyword group utilities
 */

/**
 * Assign a keyword to a group (or remove it from its group)
 * Joining a group resets keyword-specific settings to null so they inherit from the group
 * @param {Object} keyword - Keyword object (modified in place)
 * @param {string|null} groupId - Group ID, or null to remove from its group
 */
function assignKeywordToGroup(keyword, groupId) {
    keyword.groupId = groupId || null;
    if (!groupId) return;

    keyword.enableTags = null;
    keyword.linkScope = null;
    keyword.scopeFolder = null;
    keyword.useRelativeLinks = null;
    keyword.blockRef = null;
    keyword.requireTag = null;
    keyword.onlyInNotesLinkingTo = null;
    keyword.suggestMode = null;
    keyword.preventSelfLink = null;
    keyword.caseSensitive = null;
}

module.exports = { assignKeywordToGroup };
