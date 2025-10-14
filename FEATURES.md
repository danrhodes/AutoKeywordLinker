# Auto Keyword Linker - Feature List v2.0.1

## Core Linking Features

- Automatic keyword-to-wiki-link conversion
- Keyword variations support (multiple spellings/abbreviations → one target)
- Case-sensitive and case-insensitive matching modes
- First occurrence only mode (link once per note)
- Word boundary detection (matches whole words only)

## Smart Content Detection

- Skips keywords inside existing wiki links
- Skips keywords inside code blocks and inline code
- Skips keywords inside markdown links `[text](url)`
- Skips keywords in image embeds `![[image]]`
- Skips keywords in YAML frontmatter
- Skips keywords in link aliases `[[target|alias]]`
- Skips keywords preceded by # (existing tags)
- Comprehensive URL detection and protection

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

## Note Management

- Automatic target note creation (if doesn’t exist)
- Vault-wide duplicate checking before creating notes
- Customizable new note folder location
- New note template support with variables (`{{keyword}}`, `{{date}}`)

## Import/Export

- Export keywords to JSON file (timestamped)
- Import keywords from JSON file
- Smart merge on import (adds new keywords, merges variations)
- Duplicate prevention during import
- Import summary with add/merge counts

## Statistics & Analytics

- Total links created counter
- Total notes processed counter
- Last run date tracking
- Configured keywords count
- Per-keyword breakdown with variations and tag status

## Safety Features

- Markdown-only processing (skips all attachments)
- Multiple file extension validation checks
- Recursion prevention (tracks files being processed)
- Cursor position preservation during edits
- Editor content validation before applying changes
- Compatible with Obsidian Sync and backup solutions

## User Interface

- Settings tab with visual keyword list
- Add/edit/delete keywords inline
- Command palette integration (7 commands)
- Preview modals with context display
- Statistics modal
- Import file selector modal

## Configuration Options

- First occurrence only toggle
- Case sensitive toggle
- Auto-create notes toggle
- New note folder setting
- New note template editor
- Auto-link on save toggle
- Per-keyword tag enable toggle

## Commands Available

1. Link keywords in current note
1. Preview keyword linking in current note
1. Link keywords in all notes
1. Preview keyword linking in all notes
1. View statistics
1. Export keywords to JSON
1. Import keywords from JSON