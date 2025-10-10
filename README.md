# Auto Keyword Linker for Obsidian

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

### 2. **Smart Linking Engine**

The plugin uses intelligent pattern matching to find keywords while avoiding false positives:

- **Word Boundary Detection**: Only matches whole words (won't match "the" in "theme")
- **Context Awareness**: Skips keywords already inside links, avoiding `[[ [[keyword]] ]]`
- **Code Block Protection**: Ignores keywords inside code blocks, inline code, or markdown links
- **Case Sensitivity Toggle**: Choose whether "keyword" should match "Keyword"

### 3. **Preview Mode**

Before making any changes, preview exactly what will be linked:

- **Visual Preview**: See each keyword that will be linked with the surrounding context
- **Change Statistics**: Know how many links will be created in how many notes
- **Safe Exploration**: Preview shows what *would* happen without modifying files
- **Bulk Preview**: When processing all notes, see a comprehensive summary before applying

**Available Commands**:
- "Preview keyword linking in current note" - See changes for the active note
- "Preview keyword linking in all notes" - See changes across your entire vault

### 4. **Flexible Execution Options**

Choose how and when to apply keyword linking:

#### Manual Commands

- **Link keywords in current note**: Process only the note you're currently viewing
- **Link keywords in all notes**: Process every markdown file in your vault
- **Preview commands**: Preview changes before applying (available for both single and all notes)

#### Auto-Link on Save

Enable automatic linking whenever you save a note. Perfect for maintaining links as you work without interrupting your flow.

**How it works**: 
1. You write your notes naturally
2. When you save (Ctrl+S / Cmd+S), the plugin automatically links any keywords
3. Your graph grows organically as you work

**Note**: Requires plugin reload after enabling/disabling.

### 5. **First Occurrence Only Mode**

Control how many times each keyword is linked per note:

- **Enabled**: Links only the first mention of each keyword (recommended for readability)
- **Disabled**: Links every occurrence of each keyword

**Why this matters**: Linking only the first occurrence keeps your notes readable while still creating the crucial backlink for your graph. The backlink is created regardless of how many times you link the term.

### 6. **Automatic Note Creation**

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

### 7. **Case Sensitivity Control**

Choose how strictly keywords should match:

- **Case Sensitive**: "Keyword" only matches "Keyword" (not "keyword" or "KEYWORD")
- **Case Insensitive** (default): "Keyword" matches any capitalisation

### 8. **Safe File Processing**

The plugin includes multiple safety features:

- **Markdown Only**: Only processes `.md` files, ignoring attachments (.pdf, .docx, .png, etc.)
- **Existing Link Protection**: Never modifies text already inside wiki links
- **Code Preservation**: Respects code blocks and inline code
- **Backup Friendly**: All changes are applied through Obsidian's API, compatible with sync and backup solutions

## 🚀 Use Cases

### Personal Knowledge Management

**Scenario**: You maintain notes about people, projects, and concepts.

**Setup**:
```
Keyword: John Smith
Target: People/John Smith
Variations: John, JS, J. Smith

Keyword: Project Alpha
Target: Projects/Project Alpha
Variations: Alpha, Proj Alpha, PA
```

**Result**: Every time you mention "John Smith", "John", or "JS" in meeting notes, journal entries, or project documentation, it automatically links to his dedicated note. Your graph view shows all connections between John, projects, and other people.

### Research and Academia

**Scenario**: You're researching a topic with many technical terms and author names.

**Setup**:
```
Keyword: Neural Networks
Target: Concepts/Neural Networks
Variations: NN, neural net, artificial neural networks

Keyword: Geoffrey Hinton
Target: Researchers/Geoffrey Hinton
Variations: Hinton, G. Hinton, G.E. Hinton
```

**Result**: Technical terms and researcher names are consistently linked throughout your literature notes, creating a web of connections between papers, concepts, and authors.

### Project Management

**Scenario**: You track multiple projects with team members and deliverables.

**Setup**:
```
Keyword: Website Redesign
Target: Projects/Website Redesign 2025
Variations: redesign, new website, site redesign

Keyword: Sarah Johnson
Target: Team/Sarah Johnson
Variations: Sarah, SJ, S. Johnson
```

**Result**: Project names and team members are automatically linked in status updates, meeting notes, and task lists. Your graph reveals project dependencies and team collaboration patterns.

### Zettelkasten Method

**Scenario**: You're building a Zettelkasten with permanent notes, literature notes, and index notes.

**Setup**:
```
Keyword: Atomic Notes
Target: MOC/Atomic Notes Principle
Variations: atomic note, atomicity in notes

Keyword: Evergreen Notes
Target: MOC/Evergreen Notes
Variations: evergreen, evergreen content
```

**Result**: Core concepts are consistently linked across all your notes, strengthening the conceptual web that makes Zettelkasten powerful.

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
3. Plugin automatically links: "Discussed [[Neural Networks]] in the meeting"

Result: Dense, comprehensive graph that reveals true knowledge structure
```

### Graph Benefits in Practice

**Discovering Patterns**: 
- See which concepts appear together in your notes
- Identify which projects share team members
- Understand concept relationships through co-occurrence

**Contextual Navigation**:
- Click on a keyword in the graph to see all related notes
- Use backlinks to find every discussion involving a person or topic
- Navigate your knowledge by following connection threads

**Knowledge Emergence**:
- Patterns become visible that weren't apparent when writing individual notes
- Related ideas cluster together in the graph view
- Your vault becomes a true "second brain" with organic structure

## 🎨 Interface

### Settings Panel

Access settings through: Settings → Plugin Options → Auto Keyword Linker

**Keywords & Variations Section**:
- Visual list of all keywords
- Add new keywords with the "+ Add Keyword" button
- Edit any keyword, target, or variations inline
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

<img width="886" height="315" alt="image" src="https://github.com/user-attachments/assets/08d1aee9-485c-4c1e-ad54-4794bd73c760" />

### Preview Modal

When using preview commands, a modal displays:
- **File name**: Which note(s) will be affected
- **Link count**: How many links will be created
- **Change list**: Each keyword with its target and surrounding context
- **Action buttons**: Apply changes or cancel

## ⚙️ Configuration Example

Here's a complete example configuration for a personal vault:

```javascript
Keywords:
1. Keyword: Alice Johnson
   Target: People/Alice Johnson
   Variations: Alice, A.J., AJ

2. Keyword: Project Momentum
   Target: Projects/Momentum Initiative
   Variations: Momentum, Proj Momentum, momentum project

3. Keyword: Machine Learning
   Target: Concepts/Machine Learning
   Variations: ML, machine learning, machine-learning

Settings:
- First occurrence only: Enabled
- Case sensitive: Disabled
- Auto-create notes: Enabled
- New note folder: "People"
- Auto-link on save: Enabled
```

With this setup:
- Writing "met with Alice about Momentum" automatically becomes "met with [[People/Alice Johnson|Alice]] about [[Projects/Momentum Initiative|Momentum]]"
- The "People/Alice Johnson" note shows backlinks to every mention across your vault
- The graph view displays connections between people, projects, and concepts
- New person notes are automatically created in the "People" folder when first mentioned

## 🛡️ Safety Features

### File Type Protection
- **Markdown Only**: Processes only `.md` files
- **Attachment Safety**: Completely ignores `.pdf`, `.docx`, `.png`, `.jpg`, and all other attachments
- **Multiple Checks**: Validates file extension at multiple points to prevent errors

### Content Protection
- **Existing Links**: Never modifies text already inside `[[wiki links]]`
- **Code Blocks**: Preserves code fences (```) and inline code (`)
- **Markdown Links**: Respects `[text](url)` style links
- **Image Links**: Doesn't interfere with `![[image.png]]` embeds

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

### Variations Strategy

**When to Use Variations**:
- Multiple name formats: "Dr. Jane Smith", "Jane Smith", "J. Smith", "Jane"
- Acronyms: "Machine Learning" → "ML"
- Nicknames: "Robert" → "Bob", "Rob"
- Alternative spellings: "Organisation" → "Organisation"

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

### Maintenance

- **Regular Review**: Periodically review your keywords list and remove outdated entries
- **Add as You Go**: When you notice yourself typing the same term repeatedly, add it as a keyword
- **Graph Analysis**: Use Obsidian's graph view to identify important nodes that should become keywords
- **Backlink Audit**: Check backlinks on key notes to ensure all important connections are being made

## 🔧 Technical Details

### How It Works

1. **Keyword Map Building**: Creates a map of all keywords (including variations) pointing to target notes
2. **Priority Sorting**: Sorts keywords by length (longest first) to avoid partial matches
3. **Pattern Matching**: Uses regex with word boundaries to find exact matches
4. **Context Checking**: Verifies each match isn't inside existing links or code
5. **Safe Replacement**: Applies replacements in reverse order to preserve text positions
6. **File Modification**: Uses Obsidian's API to safely modify files

### Performance

- **Efficient Processing**: Uses optimised regex patterns and early-exit logic
- **Batch Operations**: Processes multiple files efficiently for bulk operations
- **Memory Safe**: Processes files one at a time to manage memory usage
- **Non-Blocking**: Operations are asynchronous and don't freeze the UI

### Compatibility

- **Obsidian Version**: Requires Obsidian v0.15.0 or higher
- **Plugin API**: Uses official Obsidian API (no private APIs)
- **Sync Compatible**: Works with Obsidian Sync, iCloud, and other sync solutions
- **Cross-Platform**: Works on Windows, macOS, Linux, iOS, and Android

## 🤝 Contributing

Contributions are welcome! Areas for potential improvement:

- Additional template variables
- More sophisticated pattern matching options
- Batch keyword import/export
- Integration with other plugins
- Performance optimisations

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

Enable "Auto-link on save" and forget about linking entirely. Just write naturally and save when you're done. Your graph builds itself.

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

---

**Built with ❤️ for the Obsidian community**

Transform your note-taking workflow and watch your knowledge graph grow organically. Install Auto Keyword Linker today and experience the power of automated, intelligent linking.
