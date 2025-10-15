# Auto Keyword Linker for Obsidian
v2.0.2

Automatically convert keywords into wiki-style links throughout your Obsidian vault. This plugin helps you build a richly interconnected knowledge graph by intelligently linking keywords to their target notes, creating a web of backlinks that reveals hidden connections in your notes.

## 🌟 Overview

Auto Keyword Linker streamlines the process of creating and maintaining links in your Obsidian vault. Instead of manually typing `[[brackets]]` around every mention of a person, place, concept, or project, simply define your keywords once and let the plugin handle the rest. The plugin intelligently finds and links keywords while respecting existing links, code blocks, and other markdown formatting.

## 🎯 Key Benefits

### Automated Graph Building

One of the most powerful features of this plugin is its ability to **automatically build your knowledge graph through backlinks**. Every time a keyword is linked, Obsidian creates a bidirectional connection between notes:

- **Automatic Backlinks**: When a keyword is linked in your meeting notes, the target note automatically shows a backlink to that meeting
- **Discover Hidden Connections**: Your graph view reveals relationships you might not have noticed manually
- **Effortless Network Effects**: As you write naturally, your vault becomes increasingly interconnected without extra effort
- **Rich Context**: Each note's backlinks section shows every mention across your vault, providing comprehensive context
<img width="305" height="355" alt="image" src="https://github.com/user-attachments/assets/04e46ea2-533f-486a-8e94-68055eae8f55" />

### Time Savings

- **No More Repetitive Linking**: Stop manually adding brackets around the same keywords hundreds of times
- **Bulk Operations**: Link keywords across your entire vault in seconds instead of hours
- **Consistent Linking**: Never forget to link an important term again

### Flexibility

- **Keyword Variations**: Handle different spellings, nicknames, or abbreviations automatically (e.g., "ML", "machine learning", "Machine Learning" all link to the same note)
- **Preview Before Apply**: See exactly what will change before committing
- **Granular Control**: Link keywords in a single note or across your entire vault

## ✨ Features

### 1. **Keyword Management with Variations**

Define keywords and their variations in an intuitive interface. Each keyword consists of:

- **Keyword**: The primary search term (e.g., "Machine Learning")
- **Target Note**: The note to link to (e.g., "Concepts/Machine Learning")
- **Variations**: Alternative spellings or abbreviations (e.g., "ML, machine learning, neural networks")

**How it works**: When you define variations, all forms automatically link to the same target note. This is perfect for:
- People with nicknames or multiple name formats
- Projects with acronyms
- Concepts with alternative terminology
- Companies with abbreviated names

**Example Configuration**:
```
Keyword: Machine Learning
Target: Concepts/Machine Learning
Variations: ML, machine learning, neural networks
```

Any mention of "Machine Learning", "ML", "machine learning", or "neural networks" in your notes will automatically link to "Concepts/Machine Learning".

### 2. **🆕 Automatic Tag Management**

**NEW**: Each keyword can now automatically add tags to both the source note (where the keyword appears) and the target note (where it links to). This creates a powerful dual system of linking and tagging for enhanced discoverability.

**How it works**:
- Enable "Enable tags" for any keyword in the settings
- When that keyword is linked, a tag is automatically added to the end of both notes
- Tags are sanitized (spaces become hyphens, special characters removed)
- Debounced to prevent conflicts during auto-save (1-second delay)

**Example**:
```
Keyword: Project Momentum
Target: Projects/Momentum Initiative
Enable Tags: ✓

Result:
- Source note gets tag: #project-momentum
- Target note gets tag: #project-momentum
- Both notes are now discoverable via tag search
```

**Benefits**:
- **Dual Discovery**: Find notes by both backlinks AND tags
- **Category Building**: Tags automatically group related notes
- **Flexible Navigation**: Use Obsidian's tag pane alongside graph view
- **No Duplicates**: Plugin checks for existing tags before adding
- **Clean Placement**: Tags are added to the end of notes in a consistent format

**Tag Format**:
- Added at the end of notes after double line break
- Multiple tags from different keywords are combined on one line
- Example: `#machine-learning #neural-networks #deep-learning`

### 3. **🆕 Import/Export Keywords**

**NEW**: Easily backup, share, or migrate your keyword configurations using JSON import/export.

**Export Keywords**:
- Command: "Export keywords to JSON"
- Creates a timestamped JSON file in your vault root
- Example filename: `auto-keyword-linker-export-2025-01-15.json`
- Contains all keywords, targets, variations, and tag settings

**Import Keywords**:
- Command: "Import keywords from JSON"
- Opens a modal showing all JSON files in your vault
- **Smart Merging**: Automatically handles conflicts
  - New keywords are added
  - Existing keywords merge variations (no duplicates)
  - Preserves your current keyword settings
- Import summary shows what was added/merged

**Use Cases**:
- **Backup**: Export before major changes to your keyword list
- **Sharing**: Share keyword configurations with team members
- **Migration**: Move keywords between vaults
- **Version Control**: Track keyword configuration changes over time

**Example Workflow**:
```
1. Configure keywords in Vault A
2. Export to JSON
3. Copy JSON to Vault B
4. Import in Vault B
5. Keywords now synchronized across vaults
```

### 4. **🆕 Statistics and Analytics**

**NEW**: Track your linking activity and keyword usage with built-in statistics.

**Command**: "View statistics"

**Metrics Tracked**:
- **Total Links Created**: Cumulative count of all keyword links created
- **Total Notes Processed**: Number of notes that have been processed
- **Total Keywords Configured**: Current number of active keywords
- **Last Run Date**: Timestamp of most recent linking operation
- **Keyword Breakdown**: List of all configured keywords with their variations and settings

**Viewing Statistics**:
- Open command palette (Ctrl/Cmd + P)
- Run "Auto Keyword Linker: View statistics"
- Modal displays comprehensive statistics and keyword overview

**Benefits**:
- **Progress Tracking**: See how your knowledge graph grows over time
- **Configuration Review**: Quick overview of all configured keywords
- **Activity Monitoring**: Understand when and how often you're using the plugin

### 5. **Smart Linking Engine**

The plugin uses intelligent pattern matching to find keywords while avoiding false positives:

- **Word Boundary Detection**: Only matches whole words (won't match "the" in "theme")
- **Context Awareness**: Skips keywords already inside links, avoiding `[[ [[keyword]] ]]`
- **Code Block Protection**: Ignores keywords inside code blocks, inline code, or markdown links
- **🆕 Hashtag Protection**: Skips keywords preceded by # to avoid interfering with existing tags
- **URL Detection**: Comprehensive URL pattern matching prevents linking keywords in web addresses
- **Alias Protection**: Doesn't modify the alias portion of links `[[target|alias]]`
- **Case Sensitivity Toggle**: Choose whether "keyword" should match "Keyword"

### 6. **Preview Mode**

Before making any changes, preview exactly what will be linked:

- **Visual Preview**: See each keyword that will be linked with the surrounding context
- **Change Statistics**: Know how many links will be created in how many notes
- **Safe Exploration**: Preview shows what *would* happen without modifying files
- **Bulk Preview**: When processing all notes, see a comprehensive summary before applying

**Available Commands**:
- "Preview keyword linking in current note" - See changes for the active note
- "Preview keyword linking in all notes" - See changes across your entire vault

### 7. **Flexible Execution Options**

Choose how and when to apply keyword linking:

#### Manual Commands

- **Link keywords in current note**: Process only the note you're currently viewing
- **Link keywords in all notes**: Process every markdown file in your vault
- **Preview commands**: Preview changes before applying (available for both single and all notes)
- **🆕 View statistics**: See linking activity and keyword overview
- **🆕 Export keywords to JSON**: Backup your keyword configuration
- **🆕 Import keywords from JSON**: Import keyword configurations

#### Auto-Link on Save

Enable automatic linking whenever you save a note. Perfect for maintaining links as you work without interrupting your flow.

**How it works**: 
1. You write your notes naturally
2. When you save (Ctrl+S / Cmd+S), the plugin automatically links any keywords
3. 🆕 Tags are added after a 1-second delay to prevent conflicts
4. 🆕 Cursor position is intelligently preserved during linking
5. Your graph grows organically as you work

**🆕 Enhanced Features**:
- **Recursion Prevention**: Tracks which files are being processed to avoid infinite loops
- **Smarter Tag Timing**: Tags are debounced and added separately to prevent edit conflicts
- **Improved Cursor Management**: Cursor stays in the correct position even when tags are added
- **Attachment Protection**: Multiple safety checks ensure only markdown files are processed

**Note**: Requires plugin reload after enabling/disabling.

### 8. **First Occurrence Only Mode**

Control how many times each keyword is linked per note:

- **Enabled**: Links only the first mention of each keyword (recommended for readability)
- **Disabled**: Links every occurrence of each keyword

**Why this matters**: Linking only the first occurrence keeps your notes readable while still creating the crucial backlink for your graph. The backlink is created regardless of how many times you link the term.

### 9. **Automatic Note Creation**

Never worry about linking to notes that don't exist yet:

- **Auto-Create**: Automatically creates target notes if they don't exist when linking
- **Vault-Wide Search**: Checks your entire vault before creating duplicates
- **Customizable Location**: Specify a folder for new notes (or use vault root)
- **Template Support**: Define a template for newly created notes

**Template Variables**:
- `{{keyword}}`: Replaced with the keyword/note name
- `{{date}}`: Replaced with today's date (YYYY-MM-DD format)

**Example Template**:
```markdown
# {{keyword}}

Created: {{date}}

## Overview

## Related Notes
```

### 10. **Case Sensitivity Control**

Choose how strictly keywords should match:

- **Case Sensitive**: "Keyword" only matches "Keyword" (not "keyword" or "KEYWORD")
- **Case Insensitive** (default): "Keyword" matches any capitalisation

### 11. **Safe File Processing**

The plugin includes multiple safety features:

- **Markdown Only**: Only processes `.md` files, ignoring attachments (.pdf, .docx, .png, etc.)
- **Existing Link Protection**: Never modifies text already inside wiki links
- **Code Preservation**: Respects code blocks and inline code
- **Frontmatter Safety**: Skips YAML frontmatter entirely
- **🆕 Recursion Guards**: Prevents processing the same file multiple times simultaneously
- **Backup Friendly**: All changes are applied through Obsidian's API, compatible with sync and backup solutions

## 🚀 Use Cases

### Personal Knowledge Management

**Scenario**: You maintain notes about people, projects, and concepts.

**Setup**:
```
Keyword: John Smith
Target: People/John Smith
Variations: John, JS, J. Smith
Enable Tags: ✓

Keyword: Project Alpha
Target: Projects/Project Alpha
Variations: Alpha, Proj Alpha, PA
Enable Tags: ✓
```

**Result**: Every time you mention "John Smith", "John", or "JS" in meeting notes, journal entries, or project documentation, it automatically:
- Links to his dedicated note
- Adds #john-smith tag to both notes
- Your graph view shows all connections between John, projects, and other people
- Tag search reveals all John-related notes instantly

### Research and Academia

**Scenario**: You're researching a topic with many technical terms and author names.

**Setup**:
```
Keyword: Neural Networks
Target: Concepts/Neural Networks
Variations: NN, neural net, artificial neural networks
Enable Tags: ✓

Keyword: Geoffrey Hinton
Target: Researchers/Geoffrey Hinton
Variations: Hinton, G. Hinton, G.E. Hinton
Enable Tags: ✓
```

**Result**: 
- Technical terms and researcher names are consistently linked throughout your literature notes
- Tags create topic clusters (#neural-networks, #geoffrey-hinton)
- Both link-based and tag-based navigation available
- Export your keyword list to share with research team

### Project Management

**Scenario**: You track multiple projects with team members and deliverables.

**Setup**:
```
Keyword: Website Redesign
Target: Projects/Website Redesign 2025
Variations: redesign, new website, site redesign
Enable Tags: ✓

Keyword: Sarah Johnson
Target: Team/Sarah Johnson
Variations: Sarah, SJ, S. Johnson
Enable Tags: ✓
```

**Result**: 
- Project names and team members are automatically linked in status updates
- Tags organize notes by project and person
- Statistics show how many notes reference each project
- Your graph reveals project dependencies and team collaboration patterns

### Zettelkasten Method

**Scenario**: You're building a Zettelkasten with permanent notes, literature notes, and index notes.

**Setup**:
```
Keyword: Atomic Notes
Target: MOC/Atomic Notes Principle
Variations: atomic note, atomicity in notes
Enable Tags: ✓

Keyword: Evergreen Notes
Target: MOC/Evergreen Notes
Variations: evergreen, evergreen content
Enable Tags: ✓
```

**Result**: 
- Core concepts are consistently linked across all your notes
- Tags provide an additional layer of conceptual organization
- Export/import allows sharing methodology with other Zettelkasten practitioners
- Statistics track your knowledge accumulation over time

## 📊 Graph Building Benefits

### Why Backlinks Matter

In Obsidian, every link creates two connections:
1. **Forward Link**: From the current note to the target
2. **Backlink**: From the target back to the current note

Auto Keyword Linker leverages this to build your graph automatically:

### Before Auto Keyword Linker
```
Your workflow:
1. Write: "Discussed neural networks in the meeting"
2. Manually edit: "Discussed [[Neural Networks]] in the meeting"
3. Repeat for every mention in every note
4. Often forget or skip linking due to tedium

Result: Sparse graph with missing connections
```

### After Auto Keyword Linker
```
Your workflow:
1. Write naturally: "Discussed neural networks in the meeting"
2. Save (or run command)
3. Plugin automatically:
   - Links: "Discussed [[Neural Networks]] in the meeting"
   - Adds tags: #neural-networks to both notes
   - Updates statistics

Result: Dense, comprehensive graph with dual discovery methods
```

### Graph Benefits in Practice

**Discovering Patterns**: 
- See which concepts appear together in your notes
- Identify which projects share team members
- Understand concept relationships through co-occurrence
- 🆕 Use tag cloud to visualize topic frequency

**Contextual Navigation**:
- Click on a keyword in the graph to see all related notes
- Use backlinks to find every discussion involving a person or topic
- Navigate your knowledge by following connection threads
- 🆕 Search by tags for alternative discovery paths

**Knowledge Emergence**:
- Patterns become visible that weren't apparent when writing individual notes
- Related ideas cluster together in the graph view
- 🆕 Tags create thematic groupings alongside link-based structure
- Your vault becomes a true "second brain" with organic structure

## 🎨 Interface

### Settings Panel

Access settings through: Settings → Plugin Options → Auto Keyword Linker

**Keywords & Variations Section**:
- Visual list of all keywords
- Add new keywords with the "+ Add Keyword" button
- Edit any keyword, target, or variations inline
- 🆕 Toggle "Enable tags" checkbox for each keyword
- Delete unwanted keywords with the "Delete" button

<img width="937" height="324" alt="image" src="https://github.com/user-attachments/assets/33cab387-b82c-43cd-bf18-7aa384aa8a66" />

**General Settings Section**:
- Toggle switches for all behavioural options
- Text input for folder paths and templates
- Helpful descriptions for each setting
<img width="977" height="537" alt="image" src="https://github.com/user-attachments/assets/a0135476-5b17-4b47-bbe0-057a5579705c" />

### Command Palette

Access all features through Obsidian's command palette (Ctrl/Cmd + P):
- `Auto Keyword Linker: Link keywords in current note`
- `Auto Keyword Linker: Preview keyword linking in current note`
- `Auto Keyword Linker: Link keywords in all notes`
- `Auto Keyword Linker: Preview keyword linking in all notes`
- 🆕 `Auto Keyword Linker: View statistics`
- 🆕 `Auto Keyword Linker: Export keywords to JSON`
- 🆕 `Auto Keyword Linker: Import keywords from JSON`

<img width="886" height="315" alt="image" src="https://github.com/user-attachments/assets/08d1aee9-485c-4c1e-ad54-4794bd73c760" />

### Preview Modal

When using preview commands, a modal displays:
- **File name**: Which note(s) will be affected
- **Link count**: How many links will be created
- **Change list**: Each keyword with its target and surrounding context
- **Action buttons**: Apply changes or cancel

### 🆕 Statistics Modal

View comprehensive statistics about your linking activity:
- **Total Links Created**: All-time count
- **Total Notes Processed**: Number of processed notes
- **Total Keywords Configured**: Current keyword count
- **Last Run Date**: Timestamp of last operation
- **Keyword Breakdown**: Complete list with variations and tag status

### 🆕 Import Modal

Select JSON files from your vault to import:
- **File Selector**: Dropdown of all JSON files
- **Smart Merging**: Automatically handles duplicates
- **Import Summary**: Shows what was added/merged
- **Safe Import**: Adds to existing keywords without overwriting

## ⚙️ Configuration Example

Here's a complete example configuration for a personal vault:

```javascript
Keywords:
1. Keyword: Alice Johnson
   Target: People/Alice Johnson
   Variations: Alice, A.J., AJ
   Enable Tags: ✓

2. Keyword: Project Momentum
   Target: Projects/Momentum Initiative
   Variations: Momentum, Proj Momentum, momentum project
   Enable Tags: ✓

3. Keyword: Machine Learning
   Target: Concepts/Machine Learning
   Variations: ML, machine learning, machine-learning
   Enable Tags: ✓

Settings:
- First occurrence only: Enabled
- Case sensitive: Disabled
- Auto-create notes: Enabled
- New note folder: "People"
- Auto-link on save: Enabled
```

With this setup:
- Writing "met with Alice about Momentum" automatically becomes "met with [[People/Alice Johnson|Alice]] about [[Projects/Momentum Initiative|Momentum]]"
- Tags are added: #alice-johnson and #project-momentum
- The "People/Alice Johnson" note shows backlinks to every mention across your vault
- Tag search reveals all Alice-related or Momentum-related notes
- The graph view displays connections between people, projects, and concepts
- New person notes are automatically created in the "People" folder when first mentioned
- Statistics track your knowledge graph growth

## 🛡️ Safety Features

### File Type Protection
- **Markdown Only**: Processes only `.md` files
- **Attachment Safety**: Completely ignores `.pdf`, `.docx`, `.png`, `.jpg`, and all other attachments
- **Multiple Checks**: Validates file extension at multiple points to prevent errors
- 🆕 **Recursion Prevention**: Tracks currently-processing files to avoid infinite loops

### Content Protection
- **Existing Links**: Never modifies text already inside `[[wiki links]]`
- **Code Blocks**: Preserves code fences (```) and inline code (`)
- **Markdown Links**: Respects `[text](url)` style links
- **Image Links**: Doesn't interfere with `![[image.png]]` embeds
- **Frontmatter Safety**: Completely skips YAML frontmatter
- **Alias Protection**: Doesn't modify alias portions of links
- 🆕 **Hashtag Protection**: Skips keywords that are already tags (preceded by #)
- 🆕 **URL Protection**: Enhanced detection prevents linking keywords in web addresses

### 🆕 Tag Protection
- **Duplicate Prevention**: Checks for existing tags before adding
- **Clean Placement**: Tags added consistently at note end
- **Debounced Addition**: 1-second delay prevents conflicts during rapid saves
- **Smart Formatting**: Multiple tags combined on single line
- **Cursor Preservation**: Cursor position maintained when tags are added

### Duplicate Prevention
- **Vault-Wide Search**: Checks entire vault before creating new notes
- **Smart Linking**: Links to existing notes regardless of location
- **No Duplicates**: Won't create "Note.md" if it exists anywhere in your vault

## 📈 Best Practices

### Starting Out

1. **Start Small**: Begin with 5-10 important keywords (key people, projects, concepts)
2. **Test with Preview**: Use preview mode to understand how the plugin works
3. **Single Note First**: Test on one note before processing your entire vault
4. **Review Settings**: Ensure "First occurrence only" is enabled for readability
5. 🆕 **Export Baseline**: Export your initial keyword configuration as a backup

### Keyword Selection

**Good Candidates**:
- People's names (colleagues, authors, historical figures)
- Project names
- Core concepts in your field
- Company or organisation names
- Recurring topics or themes

**Avoid**:
- Common words ("the", "and", "is")
- Words that appear in many contexts ("project", "meeting", "work")
- Single letters (unless used as known abbreviations)

### 🆕 Tag Strategy

**When to Enable Tags**:
- **High-value keywords**: People, projects, core concepts
- **Discovery needs**: Topics you search for frequently
- **Category building**: When you want thematic groupings
- **Multi-vault workflows**: Tags sync better across different tools

**When to Skip Tags**:
- **Very common keywords**: Would create tag clutter
- **Temporary topics**: Short-lived projects or one-off mentions
- **Link-only workflows**: If you primarily use graph view navigation

### Variations Strategy

**When to Use Variations**:
- Multiple name formats: "Dr. Jane Smith", "Jane Smith", "J. Smith", "Jane"
- Acronyms: "Machine Learning" → "ML"
- Nicknames: "Robert" → "Bob", "Rob"
- Alternative spellings: "Organisation" → "Organization"

**Keep it Reasonable**:
- Don't add variations that might cause false matches
- Be specific enough to avoid linking unrelated terms
- Test variations with preview mode before bulk application

### Folder Organisation

Organise your vault with dedicated folders for different note types:

```
/People
  - Alice Johnson.md
  - Bob Smith.md
/Projects
  - Website Redesign.md
  - Product Launch.md
/Concepts
  - Neural Networks.md
  - Agile Methodology.md
/Daily Notes
  - 2025-01-15.md
  - 2025-01-16.md
```

Set "New note folder" based on the type of keywords you're adding. For person keywords, use "People"; for project keywords, use "Projects".

### 🆕 Backup and Migration

- **Regular Exports**: Export keywords monthly as backup
- **Pre-bulk Operations**: Always export before running "Link keywords in all notes"
- **Cross-vault Sync**: Use import/export to maintain consistency across vaults
- **Version Control**: Keep timestamped exports to track configuration evolution
- **Team Sharing**: Export and share keyword configs with collaborators

### Maintenance

- **Regular Review**: Periodically review your keywords list and remove outdated entries
- **Add as You Go**: When you notice yourself typing the same term repeatedly, add it as a keyword
- **Graph Analysis**: Use Obsidian's graph view to identify important nodes that should become keywords
- **Backlink Audit**: Check backlinks on key notes to ensure all important connections are being made
- 🆕 **Statistics Check**: Review statistics monthly to track growth and identify heavily-linked keywords
- 🆕 **Tag Cleanup**: Periodically review tags to ensure consistency and remove obsolete ones

## 🔧 Technical Details

### How It Works

1. **Keyword Map Building**: Creates a map of all keywords (including variations) pointing to target notes with tag settings
2. **Priority Sorting**: Sorts keywords by length (longest first) to avoid partial matches
3. **Pattern Matching**: Uses regex with word boundaries to find exact matches
4. **Context Checking**: Verifies each match isn't inside existing links, code, URLs, or hashtags
5. **Safe Replacement**: Applies replacements in reverse order to preserve text positions
6. 🆕 **Tag Collection**: Collects tags to add during linking process
7. 🆕 **Debounced Tag Addition**: Adds tags after 1-second delay when using auto-link on save
8. **File Modification**: Uses Obsidian's API to safely modify files
9. 🆕 **Statistics Update**: Tracks and updates linking statistics
10. 🆕 **Cursor Restoration**: Intelligently maintains cursor position through modifications

### Performance

- **Efficient Processing**: Uses optimised regex patterns and early-exit logic
- **Batch Operations**: Processes multiple files efficiently for bulk operations
- **Memory Safe**: Processes files one at a time to manage memory usage
- **Non-Blocking**: Operations are asynchronous and don't freeze the UI
- 🆕 **Debounced Tags**: Reduces unnecessary file operations during rapid saves
- 🆕 **Smart Caching**: Tracks processing state to prevent redundant operations

### Compatibility

- **Obsidian Version**: Requires Obsidian v0.15.0 or higher
- **Plugin API**: Uses official Obsidian API (no private APIs)
- **Sync Compatible**: Works with Obsidian Sync, iCloud, and other sync solutions
- **Cross-Platform**: Works on Windows, macOS, Linux, iOS, and Android
- 🆕 **JSON Standard**: Import/export uses standard JSON format for maximum compatibility

## 🤝 Contributing

Contributions are welcome! Areas for potential improvement:

- Additional template variables
- More sophisticated pattern matching options
- 🆕 CSV import/export in addition to JSON
- Integration with other plugins
- Performance optimisations
- 🆕 Tag customization options (prefix, suffix, format)
- 🆕 Scheduled/automatic linking operations

## 📝 License

Community - Free to use and enjoy.

## 🐛 Bug Reports and Feature Requests

If you encounter issues or have ideas for improvements, please:

1. Check existing issues to avoid duplicates
2. Provide clear reproduction steps for bugs
3. Explain the use case for feature requests
4. Include your Obsidian version and OS

## 💡 Tips and Tricks

### Tip 1: Use Auto-Link on Save for Seamless Workflow

Enable "Auto-link on save" and forget about linking entirely. Just write naturally and save when you're done. Your graph builds itself, and tags are added automatically.

### Tip 2: Preview First, Apply Later

When processing all notes for the first time, always use preview mode. This helps you catch:
- Keywords that are too generic
- Unexpected matches
- Missing variations

### Tip 3: Combine with Templates

Use Obsidian's template plugin alongside Auto Keyword Linker. Create templates for meeting notes, daily notes, etc., then let Auto Keyword Linker handle the linking when you fill them out.

### Tip 4: Regular Bulk Processing

Even with auto-link on save, periodically run "Link keywords in all notes" to catch any notes you edited outside Obsidian or before adding new keywords.

### Tip 5: Use Descriptive Target Names

Instead of linking to "Note.md", link to "People/Alice Johnson.md" or "Projects/Website Redesign.md". This makes your backlinks and graph more informative.

### 🆕 Tip 6: Strategic Tag Usage

Don't enable tags for every keyword. Focus on:
- High-level categories (people, projects, concepts)
- Topics you search for frequently
- Keywords that benefit from both link and tag discovery

### 🆕 Tip 7: Export Before Major Changes

Always export your keywords before:
- Bulk processing your entire vault
- Making significant changes to keyword list
- Testing new variations or patterns
- Sharing your vault with others

### 🆕 Tip 8: Monitor Statistics

Review statistics monthly to:
- Track knowledge graph growth
- Identify your most-linked keywords
- Understand your linking patterns
- Justify the plugin's value to yourself or team

### 🆕 Tip 9: Import from Team Members

If working in a shared vault:
1. Each person configures their keywords
2. Export configurations
3. One person imports all configs (smart merge handles duplicates)
4. Export the merged config
5. Everyone imports the final version

### 🆕 Tip 10: Use Tags for Alternative Discovery

When you can't remember which note mentioned something:
1. Search by link/backlink (traditional method)
2. Search by tag (new alternative method)
3. Use both for comprehensive results
4. Tag pane shows all tagged notes at a glance

---

## 🆕 What's New in This Version

### Major Features
- **Tag Management System**: Automatically add tags to source and target notes
- **Import/Export**: Backup and share keyword configurations via JSON
- **Statistics Tracking**: Monitor linking activity and keyword usage
- **Enhanced Auto-Save**: Improved cursor management and debounced tag addition

### Improvements
- **Hashtag Protection**: Skips keywords that are already tags
- **Recursion Prevention**: Prevents infinite loops during auto-save
- **Better Cursor Handling**: Maintains cursor position through all modifications
- **Smart Tag Timing**: 1-second debounce prevents save conflicts

### Bug Fixes
- Fixed attachment processing issues
- Improved URL detection patterns
- Enhanced frontmatter handling
- Better alias portion detection in links

---

**Built with ❤️ for the Obsidian community**

Transform your note-taking workflow and watch your knowledge graph grow organically. Install Auto Keyword Linker today and experience the power of automated, intelligent linking with the added benefit of automatic tag management and comprehensive statistics tracking.
