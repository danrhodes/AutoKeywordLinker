/**
 * Helper utilities for Auto Keyword Linker plugin
 * Extracted from main.js during refactoring Session 1
 */

/**
 * Generate a unique ID for keywords or groups
 * @param prefix - Prefix for the ID (e.g., 'kw' for keywords, 'grp' for groups)
 * @returns Unique ID
 */
export function generateId(prefix = 'id'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Escape special regex characters in a string
 * @param string - String to escape
 * @returns Escaped string safe for use in regex
 */
export function escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get context around a position in content
 * @param content - Full content string
 * @param index - Position in content
 * @param contextLength - Number of characters to include on each side
 * @returns Context string with ellipses
 */
export function getContext(content: string, index: number, contextLength = 40): string {
    const start = Math.max(0, index - contextLength);
    const end = Math.min(content.length, index + contextLength);
    return '...' + content.substring(start, end) + '...';
}

/**
 * Escape a CSV field if it contains special characters
 * @param field - Field to escape
 * @returns Escaped field (quoted if necessary)
 */
export function escapeCSV(field: any): string {
    if (typeof field !== 'string') return field;
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
}

/**
 * Parse CSV line respecting quoted fields
 * Handles escaped quotes within quoted fields
 * @param line - CSV line to parse
 * @returns Array of field values
 */
export function parseCSVLine(line: string): string[] {
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
