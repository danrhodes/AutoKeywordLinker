# AutoKeywordLinker
Automatically creates Obsidian backlinks for specified keywords with variations and preview mode
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
Keyword: Machine Learning
Target: Concepts/Machine Learning
Variations: ML, machine learning, neural networks

Any mention of "Machine Learning", "ML", "machine learning", or "neural networks" in your notes will automatically link to "Concepts/Machine Learning".

### 2. **Smart Linking Engine**

The plugin uses intelligent pattern matching to find keywords while avoiding false positives:

- **Word Boundary Detection**: Only matches whole words (won't match "the" in "theme")
- **Context Awareness**: Skips keywords already inside links, avoiding `[[ [[keyword]] ]]`
- **Code Block Protection**: Ignores keywords inside code blocks, inline code, or markdown links
- **Case Sensitivity Toggle**: Choose whether "keyword" should match "Keyword"

### 3. **Preview Mode**

Before making any changes, preview exactly what will be linked:

- **Visual Preview**: See each keyword that will be linked with surrounding context
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
