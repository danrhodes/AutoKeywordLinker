# Auto Keyword Linker - Refactored Source Code

This directory contains the refactored source code extracted from main.js over 5 sessions.

## Current Status

**Session 1 COMPLETED** ✅ (2025-11-01)

## Directory Structure

```
src/
├── README.md                   # This file
├── types.ts                    # TypeScript type definitions (documentation)
├── types.js                    # Empty module (types are doc-only)
├── settings.js                 # Settings management
├── utils/
│   ├── constants.js            # Constants (DEFAULT_STOP_WORDS, DEFAULT_SETTINGS)
│   ├── helpers.js              # Utility functions
│   ├── linking.js              # [Session 2] Core linking engine
│   ├── detection.js            # [Session 3] Position safety checks
│   ├── analysis.js             # [Session 3] Keyword analysis
│   ├── tagManagement.js        # [Session 3] Tag operations
│   └── noteManagement.js       # [Session 2] Note creation/aliases
├── commands/                   # [Session 4]
│   ├── linking.js              # Linking commands
│   ├── suggestions.js          # Suggestion commands
│   ├── importExport.js         # Import/export commands
│   └── statistics.js           # Statistics command
└── ui/                         # [Session 5]
    ├── styles.js               # All CSS
    ├── statusBar.js            # Status bar handlers
    ├── SettingTab.js           # Main settings tab
    └── modals/                 # All modal classes
        ├── PreviewModal.js
        ├── BulkPreviewModal.js
        ├── SuggestionReviewModal.js
        ├── SuggestedKeywordBuilderModal.js
        ├── ImportModal.js
        ├── ImportCSVModal.js
        ├── StatisticsModal.js
        ├── KeywordGroupAssignModal.js
        ├── FolderSuggestModal.js
        └── NoteSuggestModal.js
```

## Session Details

### ✅ Session 1: Foundation (COMPLETED)

**Extracted:**
- Type definitions (TypeScript documentation)
- Constants (DEFAULT_STOP_WORDS, DEFAULT_SETTINGS)
- Settings management (load, save, watch)
- Helper utilities (generateId, escapeRegex, getContext, CSV functions)

**Files:** 4 modules
**Lines:** ~88 lines extracted from main.js

### ⏸️ Session 2: Core Linking Engine (NOT STARTED)

**To Extract:**
- `linkKeywordsInFile()` - Main linking engine
- `buildKeywordMap()` - Keyword lookup construction
- `getEffectiveKeywordSettings()` - Settings merging
- `checkLinkScope()` - Link scope validation
- `findTargetFile()` - Target note location
- `ensureNoteExists()` - Note creation
- `getAliasesForNote()` - Alias extraction
- `noteHasTag()`, `noteHasLinkToTarget()` - Validation functions

**Estimated Files:** 2 modules (linking.js, noteManagement.js)

### ⏸️ Session 3: Analysis & Detection (NOT STARTED)

**To Extract:**
- Text analysis functions (keyword suggestion)
- Position safety checks (link/code/URL/table detection)
- Tag management functions

**Estimated Files:** 3 modules

### ⏸️ Session 4: Commands (NOT STARTED)

**To Extract:**
- All 13 command implementations
- Command registration logic

**Estimated Files:** 4 modules

### ⏸️ Session 5: UI & Modals (NOT STARTED)

**To Extract:**
- All modal classes (10+ modals)
- Settings tab UI
- CSS styles
- Status bar handlers

**Estimated Files:** 14+ modules

## Module Format

All modules use **CommonJS** format for compatibility with Obsidian:

```javascript
// Import
const { functionName } = require('./module');

// Export
module.exports = {
    functionName
};
```

## TypeScript Files

TypeScript (.ts) files are for **documentation only**. The actual runtime uses JavaScript (.js) files.

## Progress Tracking

See [../REFACTORING_PROGRESS.md](../REFACTORING_PROGRESS.md) for detailed session-by-session progress tracking.

## Testing Between Sessions

After each session, the plugin must be tested to ensure:
1. No console errors
2. All features work identically
3. No regressions or breaking changes

See [../SESSION_1_SUMMARY.md](../SESSION_1_SUMMARY.md) for Session 1 testing checklist.
