# Auto Keyword Linker for Obsidian

Automatically convert keywords into wiki-style links throughout your Obsidian vault. This plugin helps you build a richly interconnected knowledge graph by intelligently linking keywords to their target notes, creating a web of backlinks that reveals hidden connections in your notes.

If my plugins have helped streamline your workflow, consider buying me a coffee! It supports ongoing development, bug fixes, and new features. ☕

[![Buy Me A Coffee](https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png)](https://www.buymeacoffee.com/danrhodes)

## 🌟 Overview

Auto Keyword Linker streamlines the process of creating and maintaining links in your Obsidian vault. Instead of manually typing `[[brackets]]` around every mention of a person, place, concept, or project, simply define your keywords once and let the plugin handle the rest. The plugin intelligently finds and links keywords while respecting existing links, code blocks, and other markdown formatting.

## 🎯 Key Benefits

### Automated Graph Building

One of the most powerful features of this plugin is its ability to **automatically build your knowledge graph through backlinks**. Every time a keyword is linked, Obsidian creates a bidirectional connection between notes:

- **Automatic Backlinks**: When a keyword is linked in your meeting notes, the target note automatically shows a backlink to that meeting
- **Discover Hidden Connections**: Your graph view reveals relationships you might not have noticed manually
- **Effortless Network Effects**: As you write naturally, your vault becomes increasingly interconnected without extra effort
- **Rich Context**: Each note's backlinks section shows every mention across your vault, providing comprehensive context

### Time Savings

- **No More Repetitive Linking**: Stop manually adding brackets around the same keywords hundreds of times
- **Bulk Operations**: Link keywords across your entire vault in seconds instead of hours
- **Consistent Linking**: Never forget to link an important term again
- **🆕 AI-Powered Suggestions**: Automatically discover potential keywords from your existing notes

### Flexibility

- **Keyword Variations**: Handle different spellings, nicknames, or abbreviations automatically (e.g., "ML", "machine learning", "Machine Learning" all link to the same note)
- **Preview Before Apply**: See exactly what will change before committing
- **Granular Control**: Link keywords in a single note or across your entire vault

- **🆕 Scoped Linking**: Restrict keywords to specific folders for context-aware linking
- **Vault Wide**: Links the keyword anywhere in your vault
- **Same folder only**: Links keywords ONLY to target notes in the same folder as the current note being processed.
- **Source in specific folder**: Links keywords ONLY when the current note (source) is in a specified folder. A folder must be set.
- **Target in specific folder**: Links keywords ONLY to target notes in a specified folder. A folder must be set.

- **🆕 Relative Links**: Option to create relative path links instead of absolute paths
- **🆕 Block References**: Link directly to specific blocks within notes

## ✨ Features

### 1. **🆕 Smart Keyword Suggestion System**

**NEW**: Let the plugin analyze your vault and suggest potential keywords automatically.

**How it works**:
- Command: "Suggest keywords from notes"
- Scans all markdown files in your vault
- Extracts common phrases and terms (2-3 words)
- Filters out common stop words
- Shows frequency count for each suggestion
- Preview which notes contain each suggested keyword
- Select suggestions to add as new keywords or variations

**Interactive Suggestion Modal**:
- **Search**: Filter suggestions in real-time
- **Sort Options**: 
  - By frequency (most common first)
  - By phrase length (longest first)
  - Alphabetically
- **Bulk Actions**:
  - Select All
  - Deselect All
  - Toggle Selection
- **Smart Assignment**: Choose whether to add as new keyword or variation of existing

**Benefits**:
- **Discover Hidden Patterns**: Find commonly-used terms you didn't realize were important
- **Build Keywords Faster**: No need to manually think of every term
- **Data-Driven Decisions**: Frequency counts show which terms matter most
- **Reduced Manual Work**: Let AI do the heavy lifting of keyword discovery

**Example Workflow**:
```
1. Run "Suggest keywords from notes"
2. Plugin analyzes vault, finds "machine learning" appears 47 times across 12 notes
3. Review suggestions, see preview of affected notes
4. Select interesting suggestions
5. Choose whether to add as new keyword or variation
6. Keywords automatically configured
```

### 2. **🆕 Advanced Link Scoping**

**NEW**: Control where keywords are linked with granular scope settings.

**Link Scope Options**:
- **Vault-wide** (default): Link this keyword everywhere in your vault
- **Folder-specific**: Only link this keyword within a specific folder and its subfolders

**How it works**:
- Configure scope per keyword in settings
- Choose "Folder-specific" and select the folder path
- Plugin only processes keywords when they appear in the specified scope
- Other occurrences outside the scope are ignored

**Use Cases**:
- **Context-Sensitive Terms**: "Sprint" means different things in fitness notes vs. project notes
- **Department-Specific Jargon**: Technical terms only relevant in specific project folders
- **Ambiguous Keywords**: Words with multiple meanings depending on context
- **Team Boundaries**: Separate keyword sets for different teams/departments

**Example Configuration**:
```
Keyword: Sprint
Target: Projects/Agile/Sprint Planning
Scope: Folder-specific
Scope Folder: Projects/
→ Only links "Sprint" in the Projects folder

Keyword: Sprint
Target: Fitness/Running/Sprint Training
Scope: Folder-specific
Scope Folder: Health/
→ Only links "Sprint" in the Health folder
```

**Benefits**:
- **Avoid False Positives**: Prevent linking when keyword has different meaning
- **Organized Workspaces**: Keep different domains of knowledge separate
- **Reduced Noise**: Target notes only show relevant backlinks
- **Flexible Configuration**: Mix vault-wide and scoped keywords

#### 🆕 Picking the right target from context

Scoping works when meanings live in different folders. When they share a folder, or even a note, you can give the same keyword text to several keywords, each with a different target. The plugin then reads the text around each mention and links it to the target that fits.

**Example: "Mercury" the planet vs. "Mercury" the element**

1. **Create a target note for each meaning** and write a line or two in it. The words in these notes are how the plugin tells the meanings apart:

   `Mercury (Planet).md`
   ```
   The smallest planet, closest to the Sun. Its orbit takes 88 days and its surface is covered in craters. NASA's MESSENGER probe mapped it.
   ```

   `Mercury (Element).md`
   ```
   A toxic chemical element - a heavy liquid metal once used in thermometers.
   ```

2. **Add two keywords with the same text**: in **Settings → Auto Keyword Linker → Keywords**, click **+ Add keyword** twice:

   | Keyword | Target note |
   |---|---|
   | Mercury | Mercury (Planet) |
   | Mercury | Mercury (Element) |

   Both cards now show a **Shared** badge.

3. **Add context hints** (optional, recommended). Open each Mercury card and fill in the **Context hints** field that appears on shared keywords, with comma-separated words or phrases that point to that meaning:

   | Keyword → Target | Context hints |
   |---|---|
   | Mercury → Mercury (Planet) | `orbit, sun, craters, NASA, telescope` |
   | Mercury → Mercury (Element) | `toxic, thermometer, metal, chemical` |

   Hints count most. They also work when the target notes are still empty.

4. **Write as normal.** This note:

   ```
   We watched Mercury cross the Sun; its orbit is fast and the craters are visible.

   Later we read how Mercury in old thermometers is toxic.
   ```

   is linked as:

   ```
   We watched [[Mercury (Planet)|Mercury]] cross the Sun; its orbit is fast and the craters are visible.

   Later we read how [[Mercury (Element)|Mercury]] in old thermometers is toxic.
   ```

   Each paragraph is decided on its own, so one note can use both meanings.

5. **Check the reasoning (optional).** Run **Preview keyword linking in current note**. Each shared keyword shows why it went where it did, e.g. *Chosen from context (words: sun, orbit, crater) over Mercury (Element)*.

**What the plugin looks at**, strongest first:
- **Context hints** in the same paragraph (or, counting less, elsewhere in the note)
- **Links** the note already has to the target, or to notes the target links to or is linked from
- **Words shared** with the target note's name, aliases, headings, tags, frontmatter and body text. Plurals match ("thermometers" = "thermometer"), and words that every candidate has are ignored
- **Shared tags** and **same folder**

**When context is unclear.** If nothing clearly points one way (e.g. "I thought about Mercury today"), **General → When context is unclear** decides: link to the first keyword's target (default), or leave the mention unlinked.

**Tips**
- **Mentions keep going to the first target?** The plugin probably has nothing to compare against. Add context hints, or put some text in the target notes, and check that each keyword's target note actually exists.
- **Fixing a wrong link:** text that's already linked isn't relinked. Turn the wrong link back into plain text and save, and the plugin decides again. A link that only shows the keyword, like `[[Mercury (Planet)|Mercury]]`, is never used as evidence, so one wrong link won't pull later mentions the same way.
- **Aliases count:** if `Mercury (Planet)` has the frontmatter alias "Mercury" and a keyword "Mercury" points at the element, the plugin picks between them in the same way.
- **Scopes and required tags apply first:** a target ruled out for a note by its link scope or required tag doesn't compete there. Two scoped "Sprint" keywords simply use whichever is in scope.
- **Turning it off:** switch off **General → Pick target from context** to go back to "first keyword wins".

### 3. **🆕 Relative Link Support**

**NEW**: Create relative path links instead of absolute paths for better portability.

**How it works**:
- Enable "Use relative links" for any keyword
- Links are created relative to the source note's location
- Results in cleaner, more portable vault structure

**Comparison**:
```
Absolute Link (default):
[[Projects/Website Redesign]]

Relative Link (when enabled):
[[../Projects/Website Redesign]]
```

**Benefits**:
- **Better Portability**: Easier to move folders around
- **Cleaner Paths**: Less visual clutter in reading mode
- **Vault Organization**: More flexible folder structure changes
- **Cross-Platform**: Some sync solutions prefer relative paths

**When to Use**:
- Vaults with complex folder hierarchies
- Notes that might be reorganized frequently
- Projects shared across different systems
- When folder structure is more important than flat linking

### 4. **🆕 Block Reference Linking**

**NEW**: Link directly to specific blocks, headings, or sections within target notes.

**How it works**:
- Add block reference in keyword configuration (e.g., `#^block-id` or `#heading`)
- Links automatically include the block reference
- Clicking link jumps directly to that section

**Supported Reference Types**:
- **Block IDs**: `#^unique-block-id`
- **Headings**: `#Heading Name`
- **Nested Headings**: `#Parent Heading > Nested Heading`

**Example Configuration**:
```
Keyword: API Documentation
Target: Development/API Guide
Block Reference: #Authentication
→ Creates: [[Development/API Guide#Authentication]]

Keyword: Meeting Protocol
Target: Procedures/Meetings
Block Reference: #^meeting-checklist
→ Creates: [[Procedures/Meetings#^meeting-checklist]]
```

**Benefits**:
- **Precise Navigation**: Jump to exact relevant section
- **Better Context**: Readers land on the right information immediately
- **Living Documentation**: Link to specific procedures or checklists
- **Reduced Confusion**: No need to search through long target notes

### 5. **Keyword Management with Variations**

Define keywords and their variations in an intuitive interface. Each keyword consists of:

- **Keyword**: The primary search term (e.g., "Machine Learning")
- **Target Note**: The note to link to (e.g., "Concepts/Machine Learning")
- **Variations**: Alternative spellings or abbreviations (e.g., "ML, machine learning, neural networks")
- **🆕 Link Scope**: Where this keyword should be linked (vault-wide or folder-specific)
- **🆕 Relative Links**: Option to use relative paths
- **🆕 Block Reference**: Optional block/heading reference

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
Link Scope: Vault-wide
Use Relative Links: No
Block Reference: #Overview
Enable Tags: Yes
```

Any mention of "Machine Learning", "ML", "machine learning", or "neural networks" in your notes will automatically link to "Concepts/Machine Learning#Overview".

### 6. **Automatic Tag Management**

Each keyword can now automatically add tags to both the source note (where the keyword appears) and the target note (where it links to). This creates a powerful dual system of linking and tagging for enhanced discoverability.

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

### 7. **Import/Export Keywords**

Easily backup, share, or migrate your keyword configurations using JSON import/export.

**Export Keywords**:
- Command: "Export keywords to JSON"
- Creates a timestamped JSON file in your vault root
- Example filename: `auto-keyword-linker-export-2025-01-15.json`
- Contains all keywords, targets, variations, scoping, and tag settings

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
- **🆕 Suggestions Export**: Export suggested keywords for team review

**Example Workflow**:
```
1. Configure keywords in Vault A
2. Export to JSON
3. Copy JSON to Vault B
4. Import in Vault B
5. Keywords now synchronized across vaults
```

### 8. **Statistics and Analytics**

Track your linking activity and keyword usage with built-in statistics.

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

### 9. **Smart Linking Engine**

The plugin uses intelligent pattern matching to find keywords while avoiding false positives:

- **Word Boundary Detection**: Only matches whole words (won't match "the" in "theme")
- **Context Awareness**: Skips keywords already inside links, avoiding `[[ [[keyword]] ]]`
- **Code Block Protection**: Ignores keywords inside code blocks, inline code, or markdown links
- **Hashtag Protection**: Skips keywords preceded by # to avoid interfering with existing tags
- **URL Detection**: Comprehensive URL pattern matching prevents linking keywords in web addresses
- **Alias Protection**: Doesn't modify the alias portion of links `[[target|alias]]`
- **Image Embed Protection**: Skips keywords in image embeds `![[image]]`
- **YAML Frontmatter**: Ignores keywords in frontmatter metadata
- **Case Sensitivity Toggle**: Choose whether "keyword" should match "Keyword"

### 10. **Preview Mode**

Before making any changes, preview exactly what will be linked:

- **Visual Preview**: See each keyword that will be linked with the surrounding context
- **Change Statistics**: Know how many links will be created in how many notes
- **Safe Exploration**: Preview shows what *would* happen without modifying files
- **Bulk Preview**: When processing all notes, see a comprehensive summary before applying

**Available Commands**:
- "Preview keyword linking in current note" - See changes for the active note
- "Preview keyword linking in all notes" - See changes across your entire vault

### 11. **Flexible Execution Options**

Choose how and when to apply keyword linking:

#### Manual Commands

- **Link keywords in current note**: Process only the note you're currently viewing
- **Link keywords in all notes**: Process every markdown file in your vault
- **🆕 Suggest keywords from notes**: Analyze vault and suggest new keywords

#### Automatic Processing

- **Auto-link on save**: Enable to automatically link keywords every time you save a note
  - Runs in background without interrupting workflow
  - Maintains cursor position
  - Debounced tag addition prevents conflicts
  - Recursion prevention for safety

### 12. **Automatic Note Creation**

When a target note doesn't exist, the plugin can automatically create it:

- **Vault-wide duplicate checking**: Searches entire vault before creating
- **Custom folder location**: Place new notes in specified folder
- **Template support**: Use customizable templates for new notes
- **Template variables**:
  - `{{keyword}}`: Inserts the keyword text
  - `{{date}}`: Inserts current date in YYYY-MM-DD format

**Example Template**:
```
# {{keyword}}

Created: {{date}}
Type: Auto-created note

## Overview

[Add description here]

## Related Concepts

## References
```

### 13. **🆕 Keyword Relationships and Related Sections**

The plugin already knows which keyword targets you link in which notes. It uses that to find pairs that keep appearing together, such as a project and the person who runs it. It can then keep a **Related** list in each target note, so the connection shows in the note, in backlinks and in the graph.

**How "together" is measured**:
- **Same paragraph** (or the same top-level bullet, nested bullets included) counts fully
- **Same note, different paragraph** counts less
- **Hub notes count less**: a daily note or index that links many targets adds less to each pair than a focused note
- **Strength** compares a pair's score with how often the rarer target appears. "Sarah appears in 30 notes and 23 of them also mention Atlas" ranks above two popular notes that overlap by chance

Only links count (not unlinked mentions), and the scan uses Obsidian's metadata cache, so it's quick even on large vaults.

**Example: a project and its lead**

Your meeting notes often link `[[Project Atlas]]` and `[[Sarah]]` in the same paragraph, but neither note links to the other.

1. **See the relationships**: run **Show keyword relationships** (command palette, or **Settings → Tools**). You get a list of pairs, strongest first:

   ```
   Project Atlas ↔ Sarah     23 notes together (14 same paragraph)   Not linked    [Show notes] [Link] [Dismiss]
   Kubernetes ↔ Helm         11 notes together (9 same paragraph)    Linked        [Show notes] [Dismiss]
   ```

   - **Show notes** lists where the pair appears together
   - **Link** adds each note to the other's Related section straight away
   - **Dismiss** hides the pair from the report and from Related sections (use **Restore dismissed** to bring pairs back)
   - Untick **Not linked yet only** to see every pair, or change **Min notes together**

2. **Turn on Related sections**: on the `Project Atlas` keyword (or on its group), switch on **Related section**.

3. **Update**: run **Update related sections**. A preview shows the before and after for every note that will change. Click **Update** and `Project Atlas.md` gets:

   ```markdown
   <!-- akl-related:start -->
   ## Related
   - [[Sarah]]
   - [[Weekly Sync]]
   <!-- akl-related:end -->
   ```

   Run it again whenever you like. Only notes whose list actually changed are rewritten.

**What goes in a Related section**:
- The strongest partners that appear together in at least **Min notes together** notes (default 3), up to **Max entries** (default 8)
- Not notes the target already links to in its own text, since those are already connected
- Not dismissed pairs
- Always any pair you linked with the report's **Link** button, on both notes, even if the toggle is off for them
- Entries are sorted alphabetically, so the block only changes when the list itself changes

**Safety**:
- Only the text between `<!-- akl-related:start -->` and `<!-- akl-related:end -->` is ever changed. The markers are invisible in reading view
- A new section goes at the end of the note, before the plugin's own tag line
- Links inside Related sections are ignored when measuring relationships, so the sections never feed their own results
- Turning the toggle off and updating removes the section, along with the blank line before it, and leaves the rest of the note untouched
- Sections are only written when you run the command, never on save, which keeps sync quiet

## 📋 Available Commands

The plugin's commands in Obsidian's command palette include:

1. **Link keywords in current note** - Apply linking to active note
2. **Preview keyword linking in current note** - Preview changes for active note
3. **Link keywords in all notes** - Apply linking across entire vault
4. **Preview keyword linking in all notes** - Preview changes for all notes
5. **View statistics** - Display linking statistics and keyword overview
6. **Export keywords to JSON** - Backup keyword configuration
7. **Import keywords from JSON** - Import keyword configuration
8. **🆕 Suggest keywords from notes** - Analyze vault and suggest keywords
9. **🆕 Show keyword relationships** - Report of keyword targets that keep appearing together
10. **🆕 Update related sections** - Preview and write the Related sections of opted-in target notes

## ⚙️ Settings

### General Settings

- **Auto-link on save**: Automatically link keywords when saving notes
- **Case sensitive**: Require exact case match for keywords
- **First occurrence only**: Link only the first occurrence of each keyword per note
- **Auto-create notes**: Automatically create target notes that don't exist
- **🆕 Pick target from context**: When keywords share text but link to different notes, choose the target for each mention from its surroundings
- **🆕 When context is unclear**: Link to the first keyword's target, or leave the mention unlinked

### 🆕 Related Sections Settings

- **Minimum notes together**: How many notes two targets must share before they're listed (default 3)
- **Maximum entries**: Most related notes listed in one note (default 8)
- **Section heading**: Heading inside the block (default `## Related`, empty for none)

### Note Creation Settings

- **New note folder**: Folder where auto-created notes are placed
- **New note template**: Template with variables for auto-created notes

### Keyword Configuration

Each keyword can be configured with:
- **Keyword**: Main search term
- **Target**: Note to link to
- **Variations**: Alternative forms (comma-separated)
- **Enable Tags**: Auto-add tags to source and target notes
- **🆕 Link Scope**: Vault-wide or folder-specific
- **🆕 Scope Folder**: Folder path for scoped linking
- **🆕 Use Relative Links**: Create relative path links
- **🆕 Block Reference**: Optional block/heading reference
- **🆕 Context Hints**: Words that point to this target, shown when another keyword shares its text
- **🆕 Related Section**: Keep a Related list in the target note (also available per group)

## 🚀 Getting Started

### Installation - using BRAT during the Obsidian Code Review period

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "BRAT"
4. Click Install, then Enable
5. Open BRAT settings and enter the URL to install the plugin https://github.com/danrhodes/AutoKeywordLinker

### Basic Setup

1. **Configure Your First Keywords**
   - Open Settings > Auto Keyword Linker
   - Add keywords with their target notes
   - Add variations for flexibility

2. **🆕 Or Use Keyword Suggestions**
   - Run command "Suggest keywords from notes"
   - Review suggestions with frequency counts
   - Select and add relevant keywords

3. **Preview First**
   - Run "Preview keyword linking in current note"
   - Review what will be linked
   - Adjust settings if needed

4. **Apply Linking**
   - Run "Link keywords in current note"
   - Check the results
   - View statistics to track progress

5. **Enable Auto-Linking** (Optional)
   - Toggle "Auto-link on save" in settings
   - Write naturally, save when done
   - Keywords link automatically

### Advanced Setup

#### Setting Up Scoped Keywords

For context-sensitive terms:
```
1. Identify ambiguous keywords (e.g., "Sprint", "Module", "Release")
2. Add keyword with folder-specific scope
3. Duplicate keyword with different target and scope for other context
4. Both coexist without conflict
```

#### Configuring Block References

For precise linking:
```
1. Open target note
2. Add block ID after paragraph: ^block-id
3. Or note the heading name
4. Add block reference in keyword config: #^block-id or #Heading
5. Links now jump to exact location
```

#### Using Keyword Suggestions

```
1. Run "Suggest keywords from notes"
2. Sort by frequency to find most common terms
3. Search to filter suggestions
4. Preview which notes contain each term
5. Select interesting suggestions
6. Choose: Add as new keyword OR Add as variation
7. Bulk process for efficiency
```

## 💼 Use Cases

### Personal Knowledge Management

Track people, concepts, and projects across your personal notes:

**Keywords Setup**:
- People: Family members, friends, colleagues
- Concepts: Learning topics, methodologies, philosophies
- Projects: Home projects, hobbies, goals
- **🆕 Use Suggestions**: Discover frequently-mentioned topics you didn't realize were important

**Workflow**:
1. 🆕 Run keyword suggestions weekly to discover new patterns
2. Configure keywords with tags enabled
3. Enable auto-link on save
4. Write daily notes naturally
5. Graph builds automatically with backlinks and tags
6. Use tag search for alternative discovery

### Team Documentation

Maintain consistent linking in shared vaults:

**Keywords Setup**:
- Team members (with nicknames/variations)
- Projects and initiatives
- Technical terms and acronyms
- Processes and procedures
- **🆕 Folder-scoped**: Different departments use same terms differently

**Workflow**:
1. One person configures initial keywords
2. Export to JSON
3. Team members import
4. Individuals add their own
5. Export and merge regularly
6. **🆕 Use scoped keywords**: Avoid cross-department confusion

### Academic Research

Link concepts, authors, and papers:

**Keywords Setup**:
- Key concepts and terminology
- Author names (with variations)
- Paper titles and abbreviations
- Research methodologies
- **🆕 Block references**: Link to specific sections of literature notes

**Workflow**:
1. Create literature note template
2. Configure concepts as keywords
3. Enable block references for methods sections
4. Write research notes
5. Links and tags added automatically
6. Graph reveals conceptual connections

### Project Management

Track projects, tasks, and stakeholders:

**Keywords Setup**:
- Project names and codes
- Stakeholder names
- Milestones and deliverables
- **🆕 Scoped to Projects folder**: Avoid linking in personal notes

**Workflow**:
1. Configure project keywords with folder scope
2. Create project folder structure
3. Enable auto-link on save
4. Write meeting notes, status updates
5. Backlinks show project history
6. Tags group related project notes

### Content Creation

Build interconnected content libraries:

**Keywords Setup**:
- Topics and themes
- Characters or subjects
- Series or collections
- **🆕 Relative links**: Better for moving content

**Workflow**:
1. Plan content structure
2. Configure keywords with relative links
3. Write drafts
4. Preview before publishing
5. Export content with working links

## 💡 Best Practices

### Keyword Configuration

- **Start Small**: Begin with 10-15 high-value keywords
- **Be Specific**: Avoid overly generic terms like "the", "it", "work"
- **Use Variations**: Capture abbreviations, plurals, alternative spellings
- **🆕 Smart Scoping**: Use folder-specific scope for ambiguous terms
- **🆕 Block References**: Add for long target notes with multiple sections
- **🆕 Discover with AI**: Use keyword suggestions to find what you actually write about

### Folder Organization

Consider organizing by type:
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

### Backup and Migration

- **Regular Exports**: Export keywords monthly as backup
- **Pre-bulk Operations**: Always export before running "Link keywords in all notes"
- **Cross-vault Sync**: Use import/export to maintain consistency across vaults
- **Version Control**: Keep timestamped exports to track configuration evolution
- **Team Sharing**: Export and share keyword configs with collaborators

### Maintenance

- **Regular Review**: Periodically review your keywords list and remove outdated entries
- **Add as You Go**: When you notice yourself typing the same term repeatedly, add it as a keyword
- **🆕 Use Suggestions**: Run keyword suggestions monthly to discover emerging patterns
- **Graph Analysis**: Use Obsidian's graph view to identify important nodes that should become keywords
- **Backlink Audit**: Check backlinks on key notes to ensure all important connections are being made
- **Statistics Check**: Review statistics monthly to track growth and identify heavily-linked keywords
- **Tag Cleanup**: Periodically review tags to ensure consistency and remove obsolete ones
- **🆕 Scope Review**: Audit scoped keywords to ensure contexts are still relevant

## 🔧 Technical Details

### How It Works

1. **Keyword Map Building**: Creates a map of all keywords (including variations) with scope, target, and settings
2. **🆕 Scope Filtering**: Filters keywords based on current note's folder path
3. **Priority Sorting**: Sorts keywords by length (longest first) to avoid partial matches
4. **Pattern Matching**: Uses regex with word boundaries to find exact matches
5. **Context Checking**: Verifies each match isn't inside existing links, code, URLs, or hashtags
6. **Safe Replacement**: Applies replacements in reverse order to preserve text positions
7. **🆕 Link Generation**: Creates appropriate link format (absolute, relative, with block ref)
8. **Tag Collection**: Collects tags to add during linking process
9. **Debounced Tag Addition**: Adds tags after 1-second delay when using auto-link on save
10. **File Modification**: Uses Obsidian's API to safely modify files
11. **Statistics Update**: Tracks and updates linking statistics
12. **Cursor Restoration**: Intelligently maintains cursor position through modifications

### Performance

- **Efficient Processing**: Uses optimized regex patterns and early-exit logic
- **Batch Operations**: Processes multiple files efficiently for bulk operations
- **Memory Safe**: Processes files one at a time to manage memory usage
- **Non-Blocking**: Operations are asynchronous and don't freeze the UI
- **Debounced Tags**: Reduces unnecessary file operations during rapid saves
- **Smart Caching**: Tracks processing state to prevent redundant operations
- **🆕 Scope Optimization**: Only processes relevant keywords for each note
- **🆕 Settings Sync**: Automatically syncs settings across devices every 15 seconds

### Compatibility

- **Obsidian Version**: Requires Obsidian v0.15.0 or higher
- **Plugin API**: Uses official Obsidian API (no private APIs)
- **Sync Compatible**: Works with Obsidian Sync, iCloud, and other sync solutions
- **Cross-Platform**: Works on Windows, macOS, Linux, iOS, and Android
- **JSON Standard**: Import/export uses standard JSON format for maximum compatibility
- **🆕 Relative Links**: Supports both absolute and relative path linking

## 🤝 Contributing

Contributions are welcome! Areas for potential improvement:

- Additional template variables
- More sophisticated pattern matching options
- CSV import/export in addition to JSON
- Integration with other plugins
- Performance optimizations
- Tag customization options (prefix, suffix, format)
- Scheduled/automatic linking operations
- **🆕 AI-powered variation suggestions**
- **🆕 Batch scope editing**
- **🆕 Link format templates**

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

### Tip 6: Strategic Tag Usage

Don't enable tags for every keyword. Focus on:
- High-level categories (people, projects, concepts)
- Topics you search for frequently
- Keywords that benefit from both link and tag discovery

### Tip 7: Export Before Major Changes

Always export your keywords before:
- Bulk processing your entire vault
- Making significant changes to keyword list
- Testing new variations or patterns
- Sharing your vault with others

### Tip 8: Monitor Statistics

Review statistics monthly to:
- Track knowledge graph growth
- Identify your most-linked keywords
- Understand your linking patterns
- Justify the plugin's value to yourself or team

### Tip 9: Import from Team Members

If working in a shared vault:
1. Each person configures their keywords
2. Export configurations
3. One person imports all configs (smart merge handles duplicates)
4. Export the merged config
5. Everyone imports the final version

### Tip 10: Use Tags for Alternative Discovery

When you can't remember which note mentioned something:
1. Search by link/backlink (traditional method)
2. Search by tag (new alternative method)
3. Use both for comprehensive results
4. Tag pane shows all tagged notes at a glance

### 🆕 Tip 11: Leverage Keyword Suggestions

Monthly workflow:
1. Run "Suggest keywords from notes"
2. Sort by frequency
3. Identify emerging themes/patterns
4. Add top suggestions as keywords
5. Your linking becomes more comprehensive over time

### 🆕 Tip 12: Use Scoping for Ambiguous Terms

When a word has multiple meanings:
1. Create separate keywords with same name
2. Set different scopes (folder-specific)
3. Configure different targets
4. Context determines which link is created

### 🆕 Tip 13: Block References for Long Guides

For reference documents:
1. Add headings or block IDs to key sections
2. Configure keywords with block references
3. Links jump directly to relevant section
4. Reduces friction in daily workflow

### 🆕 Tip 14: Relative Links for Portable Vaults

If you frequently reorganize:
1. Enable "Use relative links" for relevant keywords
2. Folder moves don't break links as easily
3. Better for vaults shared across different systems

---

## 🆕 What's New in This Version

### Major Features
- **🆕 Picking the Right Target from Context**: Give several keywords the same text, and each mention links to the target its paragraph fits
- **🆕 Keyword Relationships and Related Sections**: Find keyword targets that keep appearing together, and keep an auto-updated Related list in target notes
- **AI-Powered Keyword Suggestions**: Automatically discover keywords from your notes with frequency analysis
- **Link Scoping System**: Control where keywords link with vault-wide or folder-specific scoping
- **Relative Link Support**: Option to create relative path links instead of absolute paths
- **Block Reference Linking**: Link directly to specific blocks or headings within notes
- **Tag Management System**: Automatically add tags to source and target notes
- **Import/Export**: Backup and share keyword configurations via JSON
- **Statistics Tracking**: Monitor linking activity and keyword usage
- **Enhanced Auto-Save**: Improved cursor management and debounced tag addition

### Improvements
- **Settings Sync**: Automatic background syncing of settings across devices (15-second intervals)
- **Hashtag Protection**: Skips keywords that are already tags
- **Recursion Prevention**: Prevents infinite loops during auto-save
- **Better Cursor Handling**: Maintains cursor position through all modifications
- **Smart Tag Timing**: 1-second debounce prevents save conflicts
- **Stop Word Filtering**: Intelligent filtering of common words in suggestions
- **Interactive UI**: Search, sort, and bulk select in suggestion modal

### Bug Fixes
- Fixed attachment processing issues
- Improved URL detection patterns
- Enhanced frontmatter handling
- Better alias portion detection in links

---

**Built with ❤️ for the Obsidian community**

Transform your note-taking workflow and watch your knowledge graph grow organically. Install Auto Keyword Linker today and experience the power of automated, intelligent linking with AI-powered suggestions, advanced scoping, tag management, and comprehensive statistics tracking.
