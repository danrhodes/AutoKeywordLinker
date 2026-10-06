# Auto Keyword Linker - Feature List

## Core Linking Features

- Automatic keyword-to-wiki-link conversion
- Keyword variations support (multiple spellings/abbreviations → one target)
- Case-sensitive and case-insensitive matching modes
- First occurrence only mode (link once per note)
- Word boundary detection (matches whole words only)
- 🆕 Link scope control (vault-wide or folder-specific)
- 🆕 Relative link support (relative path links instead of absolute)
- 🆕 Block reference linking (link to specific blocks/headings)

## 🆕 AI-Powered Keyword Suggestions

- Automatically scan all markdown files in vault
- Extract common phrases and terms (2-3 words)
- Intelligent stop word filtering (excludes common words)
- Frequency counting for each suggestion
- Preview which notes contain each suggested keyword
- Interactive modal with search, sort, and bulk selection
- Sort options:
  - By frequency (most common first)
  - By phrase length (longest first)
  - Alphabetically
- Bulk actions:
  - Select All
  - Deselect All
  - Toggle Selection
- Choose to add as new keyword or variation of existing
- Real-time search filtering
- Notes preview showing where suggestion appears

## Smart Content Detection

- Skips keywords inside existing wiki links
- Skips keywords inside code blocks and inline code
- Skips keywords inside markdown links `[text](url)`
- Skips keywords in image embeds `![[image]]`
- Skips keywords in YAML frontmatter
- Skips keywords in link aliases `[[target|alias]]`
- Skips keywords preceded by # (existing tags)
- Comprehensive URL detection and protection

## 🆕 Link Scope Management

- Per-keyword scope configuration
- Vault-wide linking (default) - link everywhere
- Folder-specific linking - only link within specified folder
- Folder path configuration for scoped keywords
- Scope inheritance through subfolders
- Multiple keywords can target same term in different contexts
- Context-aware linking prevents ambiguous matches
- 🆕 Same keyword text, different targets: each mention links to the target its paragraph and note fit best
- 🆕 Scores context hints, words shared with the target note, existing links, linked neighbours, tags and folder
- 🆕 Per-keyword context hints field (shown when another keyword shares the text)
- 🆕 Configurable fallback when context is unclear (first keyword's target, or leave unlinked)
- 🆕 Previews explain why each shared keyword went to its target
- Allows same keyword with different meanings in different folders

## 🆕 Advanced Link Options

- Relative link toggle per keyword
- Block reference field for direct section linking
- Support for block IDs: `#^block-id`
- Support for headings: `#Heading Name`
- Support for nested headings: `#Parent > Child`
- Combine with scope and variations
- Compatible with all link formats

## Tag Management

- Automatic tag addition to source notes (where keyword appears)
- Automatic tag addition to target notes (where keyword links to)
- Tag name sanitization (spaces → hyphens, special chars removed)
- Duplicate tag prevention
- Debounced tag addition (1-second delay during auto-save)
- Clean tag placement at end of notes
- Per-keyword tag enable/disable toggle

## Execution Options

- Link keywords in current note only
- Link keywords in all notes (bulk operation)
- Preview mode for both single and bulk operations
- Auto-link on save (automatic linking when saving files)
- Manual command execution via command palette
- 🆕 Suggest keywords from notes (AI-powered discovery)

## Note Management

- Automatic target note creation (if doesn't exist)
- Vault-wide duplicate checking before creating notes
- Customizable new note folder location
- New note template support with variables (`{{keyword}}`, `{{date}}`)

## Import/Export

- Export keywords to JSON file (timestamped)
- Import keywords from JSON file
- Smart merge on import (adds new keywords, merges variations)
- Duplicate prevention during import
- Import summary with add/merge counts
- Includes all settings: scope, relative links, block refs, tags
- Version-compatible JSON format

## Statistics & Analytics

- Total links created counter
- Total notes processed counter
- Last run date tracking
- Configured keywords count
- Per-keyword breakdown with:
  - Variations list
  - Tag status
  - 🆕 Link scope
  - 🆕 Relative link status
  - 🆕 Block reference

## Safety Features

- Markdown-only processing (skips all attachments)
- Multiple file extension validation checks
- Recursion prevention (tracks files being processed)
- Cursor position preservation during edits
- Editor content validation before applying changes
- Compatible with Obsidian Sync and backup solutions
- 🆕 Scope-based filtering prevents unwanted links
- 🆕 Settings sync with conflict prevention

## 🆕 Settings Synchronization

- Automatic background settings sync (15-second intervals)
- Detects external changes from sync services
- Silent reload without interrupting workflow
- Prevents save/reload loops with isSaving flag
- Maintains keyword configuration consistency across devices
- Compatible with Obsidian Sync, iCloud, and other sync solutions
- Backward compatibility with older keyword formats

## User Interface

- Settings tab with visual keyword list
- Add/edit/delete keywords inline
- Command palette integration (8 commands)
- Preview modals with context display
- Statistics modal
- Import file selector modal
- 🆕 Keyword suggestion modal with interactive controls
- 🆕 Per-keyword scope dropdown
- 🆕 Relative link toggle per keyword
- 🆕 Block reference input field

## Configuration Options

- First occurrence only toggle
- Case sensitive toggle
- Auto-create notes toggle
- New note folder setting
- New note template editor
- Auto-link on save toggle
- Per-keyword tag enable toggle
- 🆕 Per-keyword link scope (vault-wide or folder-specific)
- 🆕 Per-keyword scope folder path
- 🆕 Per-keyword relative link toggle
- 🆕 Per-keyword block reference field

## Commands Available

1. Link keywords in current note
2. Preview keyword linking in current note
3. Link keywords in all notes
4. Preview keyword linking in all notes
5. View statistics
6. Export keywords to JSON
7. Import keywords from JSON
8. 🆕 Suggest keywords from notes
9. 🆕 Show keyword relationships
10. 🆕 Update related sections

## 🆕 Keyword Relationships & Related Sections

- Finds pairs of keyword targets that are linked together in your notes
- Same paragraph (or same top-level bullet) counts fully; same note counts less
- Hub notes (dailies, indexes) that link many targets are discounted
- Strength ranks pairs against the rarer target's appearances, so popular notes don't dominate
- Fast: works from Obsidian's metadata cache, reading only target notes
- Relationships report: strongest pairs first, filter by minimum notes and "not linked yet"
- Report actions: show the notes a pair shares, Link (adds both to each other's Related section), Dismiss (remembered), Restore dismissed
- Per-keyword and per-group "Related section" toggle (opt-in)
- "Update related sections" command with before/after preview
- Related block kept between `<!-- akl-related:start -->` / `<!-- akl-related:end -->` markers; nothing outside them is touched
- Skips notes the target already links to; alphabetical entries, so notes are only rewritten when the list changes
- Links inside Related blocks are ignored when measuring relationships (no feedback loop)
- New blocks go before the plugin's trailing tag line; turning the toggle off removes the block cleanly
- Settings: minimum notes together, maximum entries, section heading

## Performance Features

- Optimized regex patterns for efficient matching
- Batch processing for bulk operations
- Memory-safe file processing (one at a time)
- Asynchronous operations (non-blocking UI)
- Debounced tag operations
- Smart caching to prevent redundant processing
- 🆕 Scope-based keyword filtering reduces processing
- 🆕 Stop word filtering in suggestions improves relevance
- 🆕 Background settings sync with minimal overhead

## Compatibility

- Obsidian v0.15.0 or higher
- Official Obsidian API (no private APIs)
- Cross-platform (Windows, macOS, Linux, iOS, Android)
- Obsidian Sync compatible
- iCloud and other sync solutions
- Standard JSON format for import/export
- 🆕 Works with complex folder hierarchies
- 🆕 Relative link support for portable vaults

## Intelligent Features

- **Context-Aware**: Respects markdown structure and existing formatting
- **Variation Matching**: Handles multiple forms of same keyword
- **Priority Sorting**: Processes longest keywords first to avoid partial matches
- **Safe Replacement**: Applies changes in reverse order to preserve positions
- 🆕 **Scope Filtering**: Only processes relevant keywords for each note
- 🆕 **AI Discovery**: Automatically finds potential keywords from actual usage
- 🆕 **Frequency Analysis**: Shows which terms matter most in your vault
- 🆕 **Multi-Context Support**: Same term can link differently based on location

## Use Case Support

### Personal Knowledge Management
- Track people, concepts, projects
- 🆕 Discover emerging patterns with suggestions
- Build interconnected personal wiki
- Mix vault-wide and scoped keywords

### Team Documentation
- Maintain consistent terminology
- Share keyword configurations
- 🆕 Department-specific scoped keywords
- Collaborative keyword discovery

### Academic Research
- Link concepts and methodologies
- Track authors and papers
- 🆕 Link to specific sections in literature notes
- Discover frequently-cited concepts

### Project Management
- Track projects and stakeholders
- Milestone and deliverable linking
- 🆕 Project-scoped keywords prevent cross-contamination
- Meeting note auto-linking

### Content Creation
- Build topical content networks
- Manage characters and themes
- 🆕 Relative links for portable content
- Series and collection linking

## Quality of Life

- Visual keyword cards in settings
- Animated UI transitions
- Searchable suggestion modal
- Color-coded statistics
- Inline editing without modal switching
- Bulk selection tools
- Import/export with progress feedback
- 🆕 Real-time search in suggestions
- 🆕 Multiple sort options for suggestions
- 🆕 Note preview in suggestion selection
- 🆕 Frequency counts for data-driven decisions

## Safety & Reliability

- Preview mode before committing changes
- Undo-friendly operations
- No data loss on sync conflicts
- Validation before all modifications
- Clear error messaging
- 🆕 Scope isolation prevents unintended links
- 🆕 Settings sync with conflict detection
- 🆕 Background sync doesn't interrupt workflow

## Future-Ready

- Extensible JSON format
- Template variable system
- Plugin integration potential
- Customizable behavior
- 🆕 AI-ready architecture for future enhancements
- 🆕 Flexible scope system allows new scope types
- 🆕 Block reference format supports future Obsidian features
