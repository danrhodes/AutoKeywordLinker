/**
 * Position detection utilities for safe link placement
 * Prevents links from being created inside existing links, code blocks, URLs, etc.
 * Extracted from main-source.js (Session 3)
 */

/**
 * Get the start and end positions of YAML frontmatter
 * @param {string} content - The full content
 * @returns {Object|null} Object with start and end positions, or null if no frontmatter
 */
function getFrontmatterBounds(content) {
    // Frontmatter must start at the very beginning of the file with ---
    if (!content.startsWith('---')) {
        return null;
    }

    // Find the closing ---
    const lines = content.split('\n');
    let endLine = -1;

    // Start from line 1 (skip the opening ---)
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '---' || lines[i].trim() === '...') {
            endLine = i;
            break;
        }
    }

    // If we found a closing delimiter
    if (endLine !== -1) {
        // Calculate character positions
        let endPos = 0;
        for (let i = 0; i <= endLine; i++) {
            endPos += lines[i].length + 1; // +1 for newline
        }

        return {
            start: 0,
            end: endPos
        };
    }

    return null;
}

/**
 * Check if a position is inside the alias portion of an Obsidian link
 * Format: [[target|alias]] - we want to skip text in the alias part
 * @param {string} content - The full content
 * @param {number} index - Position to check
 * @returns {boolean} True if inside alias portion of a link
 */
function isInsideAlias(content, index) {
    // Look backwards to find [[ and check if there's a | between [[ and our position
    let foundOpenBracket = false;
    let foundPipe = false;

    // Search backwards from our position (up to 500 chars)
    for (let i = index - 1; i >= Math.max(0, index - 500); i--) {
        // If we find ]] going backwards, we're not in a link
        if (i > 0 && content[i] === ']' && content[i - 1] === ']') {
            return false;
        }

        // If we find a pipe going backwards, mark it
        if (content[i] === '|' && !foundPipe) {
            foundPipe = true;
        }

        // If we find [[ going backwards
        if (i < content.length - 1 && content[i] === '[' && content[i + 1] === '[') {
            foundOpenBracket = true;
            break;
        }

        // If we hit a newline, stop searching
        if (content[i] === '\n') {
            return false;
        }
    }

    // If we found [[ and a | between [[ and our position, check if ]] is ahead
    if (foundOpenBracket && foundPipe) {
        // Look forward to confirm there's a ]] ahead
        for (let i = index; i < Math.min(content.length, index + 500); i++) {
            if (i < content.length - 1 && content[i] === ']' && content[i + 1] === ']') {
                // We're inside [[...|alias]] structure
                return true;
            }
            if (content[i] === '\n') {
                break;
            }
        }
    }

    return false;
}

/**
 * Check if a position is part of a URL
 * Detects various URL formats including protocol-based and domain-only URLs
 * @param {string} content - The full content
 * @param {number} index - Position to check
 * @param {number} length - Length of the matched text
 * @returns {boolean} True if part of a URL
 */
function isPartOfUrl(content, index, length) {
    // Get surrounding context (500 chars before and after)
    const contextStart = Math.max(0, index - 500);
    const contextEnd = Math.min(content.length, index + length + 500);
    const contextBefore = content.substring(contextStart, index);
    const contextAfter = content.substring(index + length, contextEnd);
    const matchText = content.substring(index, index + length);
    const fullContext = contextBefore + matchText + contextAfter;

    // Calculate position in context
    const posInContext = index - contextStart;

    // Pattern 1: Check for protocol-based URLs (http://, https://, ftp://, etc.)
    const protocolPattern = /(?:https?|ftp|ftps|sftp|file):\/\/[^\s\]]+/gi;
    let match;
    while ((match = protocolPattern.exec(fullContext)) !== null) {
        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;
        // Check if our position is within this URL
        if (posInContext >= matchStart && posInContext < matchEnd) {
            return true;
        }
    }

    // Pattern 2: Check for www. URLs
    const wwwPattern = /\bwww\.[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+[^\s\])"]*/gi;
    while ((match = wwwPattern.exec(fullContext)) !== null) {
        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;
        if (posInContext >= matchStart && posInContext < matchEnd) {
            return true;
        }
    }

    // Pattern 3: Check for domain.tld pattern (more conservative)
    // Common TLDs including country codes
    const domainPattern = /\b[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)*\.(com|org|net|edu|gov|mil|int|info|biz|name|museum|coop|aero|asia|cat|jobs|mobi|travel|xxx|pro|tel|post|co\.uk|co\.jp|co\.kr|co\.nz|co\.au|co\.za|co\.in|co\.id|co\.th|co\.il|ac\.uk|gov\.uk|org\.uk|de|fr|it|es|nl|be|ch|at|se|no|dk|fi|ie|pl|cz|hu|ro|bg|gr|pt|ru|ua|sk|si|hr|lt|lv|ee|cn|jp|kr|tw|hk|sg|my|th|vn|id|ph|in|pk|bd|lk|np|af|au|nz|fj|ca|mx|br|ar|cl|co|pe|ve|ec|uy|py|bo|cr|pa|gt|hn|ni|sv|cu|do|jm|tt|bs|bb|za|eg|ng|ke|gh|tz|ug|zw|ma|dz|tn|sn|ci|cm|ao|mz|na|bw|mw|zm|rw|so|sd|et|ly|iq|ir|sa|ae|kw|qa|om|ye|jo|lb|sy|il|ps|tr|am|az|ge|kz|uz|tm|tj|kg|mn|io|ai|sh|tv|me|cc|ws|to|ly|gl|gd|ms|vg|ag|lc|vc|dm|kn|gp|mq|aw|cw|sx|bq|tc|ky|bm|pr|vi)(?:\b|\/|:|\?|#|$)/gi;
    while ((match = domainPattern.exec(fullContext)) !== null) {
        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;
        if (posInContext >= matchStart && posInContext < matchEnd) {
            // Additional check: make sure there's no letter immediately before (to avoid false positives)
            if (matchStart === 0 || /[\s\(\[\{<"']/.test(fullContext[matchStart - 1])) {
                return true;
            }
        }
    }

    // Pattern 4: Check if the matched text itself contains a domain pattern
    const simpleTldPattern = /\.(com|org|net|edu|gov|io|ai|me|tv|co|uk|de|fr|it|jp|cn|au|ca|br|in|ru)\b/i;
    if (simpleTldPattern.test(matchText)) {
        return true;
    }

    // Pattern 5: Look around the matched text for URL indicators
    // Check 100 chars before and after for URL context
    const localBefore = content.substring(Math.max(0, index - 100), index);
    const localAfter = content.substring(index + length, Math.min(content.length, index + length + 100));

    // Check if there's a protocol or www before our match (without whitespace)
    if (/(?:https?|ftp|ftps):\/\/[^\s]*$/.test(localBefore) || /www\.[^\s]*$/.test(localBefore)) {
        return true;
    }

    // Check if there's a TLD pattern after our match (without whitespace in between)
    if (/^\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?(?:\/|\?|#|:|\s|$)/.test(localAfter)) {
        return true;
    }

    return false;
}

/**
 * Check if a position in the content is inside a link or code block
 * @param {string} content - The full content
 * @param {number} index - Position to check
 * @returns {boolean} True if inside link or code
 */
function isInsideLinkOrCode(content, index) {
    // Look backwards to find if we're inside any kind of brackets
    let bracketDepth = 0;
    let insideBrackets = false;

    // Scan backwards from position
    for (let i = index - 1; i >= Math.max(0, index - 500); i--) {
        // Check for closing brackets ]]
        if (i > 0 && content[i] === ']' && content[i - 1] === ']') {
            bracketDepth--;
            i--; // Skip both brackets
            continue;
        }

        // Check for opening brackets [[ or ![[
        if (i < content.length - 1 && content[i] === '[' && content[i + 1] === '[') {
            bracketDepth++;
            // If we find an opening bracket and our depth is positive, we're inside
            if (bracketDepth > 0) {
                insideBrackets = true;
                break;
            }
            i--; // Skip both brackets
            continue;
        }

        // If we hit a newline with depth 0, we're not in brackets
        if (content[i] === '\n' && bracketDepth === 0) {
            break;
        }
    }

    if (insideBrackets) {
        return true;
    }

    // Check if inside code block `...`
    let backtickCount = 0;
    for (let i = 0; i < index; i++) {
        if (content[i] === '`') {
            backtickCount++;
        }
    }

    // If odd number of backticks before our position, we're inside code
    if (backtickCount % 2 === 1) {
        return true;
    }

    // Check if inside markdown link [text](url)
    // First, check if we're inside the (url) part
    let parenDepth = 0;
    for (let i = index - 1; i >= Math.max(0, index - 300); i--) {
        if (content[i] === ')') {
            parenDepth--;
        } else if (content[i] === '(') {
            parenDepth++;
            // If we find ( and depth > 0, check if it's preceded by ]
            if (parenDepth > 0 && i > 0 && content[i - 1] === ']') {
                return true; // We're inside ](url) part of a markdown link
            }
        } else if (content[i] === '\n') {
            break;
        }
    }

    // Check if we're inside the [text] part
    let squareBracketDepth = 0;
    for (let i = index - 1; i >= Math.max(0, index - 300); i--) {
        if (content[i] === ']') {
            squareBracketDepth--;
        } else if (content[i] === '[') {
            squareBracketDepth++;
            // If we find [ and depth > 0, we might be in a markdown link
            if (squareBracketDepth > 0) {
                // Check if there's ]( ahead of our position
                for (let j = index; j < Math.min(content.length, index + 300); j++) {
                    if (content[j] === ']' && j < content.length - 1 && content[j + 1] === '(') {
                        return true;
                    }
                    if (content[j] === '\n') break;
                }
            }
        } else if (content[i] === '\n') {
            break;
        }
    }

    return false;
}

/**
 * Check if a position is inside a block reference (^block-id)
 * Block references are in the format: ^some-block-id at the end of a line
 * @param {string} content - The full content
 * @param {number} index - Position to check
 * @returns {boolean} True if inside a block reference
 */
function isInsideBlockReference(content, index) {
    // Find the start of the current line
    let lineStart = index;
    while (lineStart > 0 && content[lineStart - 1] !== '\n') {
        lineStart--;
    }

    // Find the end of the current line
    let lineEnd = index;
    while (lineEnd < content.length && content[lineEnd] !== '\n') {
        lineEnd++;
    }

    // Get the current line
    const line = content.substring(lineStart, lineEnd);

    // Check if there's a ^ before our position on this line
    const positionInLine = index - lineStart;

    // Look for ^ character before the match position
    const caretIndex = line.lastIndexOf('^', positionInLine);

    if (caretIndex !== -1) {
        // Check if there's only word characters, hyphens, and underscores between ^ and our position
        // This matches the typical block ID format: ^block-id or ^block_id
        const textBetween = line.substring(caretIndex, positionInLine + 1);

        // If the text between ^ and our position only contains valid block ID characters
        // then we're inside a block reference
        if (/^\^[\w\-]*$/.test(textBetween)) {
            return true;
        }
    }

    return false;
}

/**
 * Check if a position is inside a LaTeX math formula
 * Supports both inline math ($...$) and block math ($$...$$)
 * @param {string} content - The full content
 * @param {number} index - Position to check
 * @returns {boolean} True if inside a math formula
 */
function isInsideMath(content, index) {
    // Check for block math ($$...$$) first as it takes precedence
    // Count $$ before the position
    let blockMathCount = 0;
    let i = 0;

    while (i < index) {
        if (i < content.length - 1 && content[i] === '$' && content[i + 1] === '$') {
            blockMathCount++;
            i += 2; // Skip both $$
        } else {
            i++;
        }
    }

    // If odd number of $$ before position, we're inside block math
    if (blockMathCount % 2 === 1) {
        return true;
    }

    // Check for inline math ($...$)
    // We need to count single $ that are NOT part of $$
    let singleDollarCount = 0;
    i = 0;

    while (i < index) {
        if (content[i] === '$') {
            // Check if it's a double $$
            if (i < content.length - 1 && content[i + 1] === '$') {
                i += 2; // Skip $$, don't count for inline math
            } else if (i > 0 && content[i - 1] === '$') {
                i++; // Already counted as part of $$
            } else {
                // It's a single $
                singleDollarCount++;
                i++;
            }
        } else {
            i++;
        }
    }

    // If odd number of single $ before position, we're inside inline math
    if (singleDollarCount % 2 === 1) {
        return true;
    }

    return false;
}

/**
 * Check if a position is inside a Markdown table
 * Tables are defined by lines containing pipes (|) with a header separator line
 * @param {string} content - The full content
 * @param {number} index - Position to check
 * @returns {boolean} True if inside a table
 */
function isInsideTable(content, index) {
    // Find the current line
    let lineStart = index;
    while (lineStart > 0 && content[lineStart - 1] !== '\n') {
        lineStart--;
    }

    let lineEnd = index;
    while (lineEnd < content.length && content[lineEnd] !== '\n') {
        lineEnd++;
    }

    const currentLine = content.substring(lineStart, lineEnd);

    // Check if current line contains pipes (potential table row)
    if (!currentLine.includes('|')) {
        return false;
    }

    // Look backwards to find if there's a table separator line (like | --- | --- |)
    // This confirms we're in a table
    let searchStart = lineStart - 1;
    const maxLookback = 10; // Look back up to 10 lines
    let linesChecked = 0;

    while (searchStart > 0 && linesChecked < maxLookback) {
        // Find previous line start
        let prevLineEnd = searchStart;
        while (searchStart > 0 && content[searchStart - 1] !== '\n') {
            searchStart--;
        }

        const prevLine = content.substring(searchStart, prevLineEnd).trim();

        // Check if this line is a table separator (contains | and - and :)
        // Examples: | --- | --- | or |:---|:---:| or |-----|-----|
        if (prevLine.includes('|') && prevLine.includes('-')) {
            // Simple check: if line has pipes and dashes, likely a separator
            const withoutPipes = prevLine.replace(/\|/g, '');
            const dashCount = (withoutPipes.match(/-/g) || []).length;

            // If mostly dashes (table separator), we're in a table
            if (dashCount >= 3) {
                return true;
            }
        }

        // Also check forward from current position to find separator
        linesChecked++;
        searchStart--;
    }

    // Look forward as well (in case we're in the header row before separator)
    let searchEnd = lineEnd + 1;
    linesChecked = 0;

    while (searchEnd < content.length && linesChecked < 3) {
        let nextLineStart = searchEnd;
        while (searchEnd < content.length && content[searchEnd] !== '\n') {
            searchEnd++;
        }

        const nextLine = content.substring(nextLineStart, searchEnd).trim();

        if (nextLine.includes('|') && nextLine.includes('-')) {
            const withoutPipes = nextLine.replace(/\|/g, '');
            const dashCount = (withoutPipes.match(/-/g) || []).length;

            if (dashCount >= 3) {
                return true;
            }
        }

        linesChecked++;
        searchEnd++;
    }

    return false;
}

module.exports = {
    getFrontmatterBounds,
    isInsideAlias,
    isPartOfUrl,
    isInsideLinkOrCode,
    isInsideBlockReference,
    isInsideTable,
    isInsideMath
};
