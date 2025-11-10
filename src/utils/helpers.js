/**
 * Helper utilities for Auto Keyword Linker plugin
 * Extracted from main.js during refactoring Session 1
 */

/**
 * Generate a unique ID for keywords or groups
 * @param {string} prefix - Prefix for the ID (e.g., 'kw' for keywords, 'grp' for groups)
 * @returns {string} Unique ID
 */
function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Escape special regex characters in a string
 * @param {string} string - String to escape
 * @returns {string} Escaped string safe for use in regex
 */
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get context around a position in content
 * @param {string} content - Full content string
 * @param {number} index - Position in content
 * @param {number} contextLength - Number of characters to include on each side
 * @returns {string} Context string with ellipses
 */
function getContext(content, index, contextLength = 40) {
    const start = Math.max(0, index - contextLength);
    const end = Math.min(content.length, index + contextLength);
    return '...' + content.substring(start, end) + '...';
}

/**
 * Escape a CSV field if it contains special characters
 * @param {any} field - Field to escape
 * @returns {string} Escaped field (quoted if necessary)
 */
function escapeCSV(field) {
    if (typeof field !== 'string') return field;
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
}

/**
 * Parse CSV line respecting quoted fields
 * Handles escaped quotes within quoted fields
 * @param {string} line - CSV line to parse
 * @returns {string[]} Array of field values
 */
function parseCSVLine(line) {
    const fields = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"' && inQuotes && nextChar === '"') {
            // Escaped quote
            currentField += '"';
            i++; // Skip next quote
        } else if (char === '"') {
            // Toggle quote mode
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            // Field separator
            fields.push(currentField.trim());
            currentField = '';
        } else {
            currentField += char;
        }
    }

    // Add last field
    fields.push(currentField.trim());

    return fields;
}

module.exports = {
    generateId,
    escapeRegex,
    getContext,
    escapeCSV,
    parseCSVLine
};
