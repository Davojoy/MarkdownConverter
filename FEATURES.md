# Rich Text Paste Feature - User Guide

## Feature Overview

The Markdown Converter now supports **pasting rich text directly into the editor**! When you copy formatted text from sources like:

- Microsoft Word
- Google Docs
- Web pages
- PDFs (if they allow copying)
- Any rich text editor

...and paste it into the left panel, the app will automatically convert it to clean markdown.

## How It Works

1. **Copy rich text** (with formatting like bold, italic, headings, lists, links, etc.)
2. **Paste** into the left editor panel (Ctrl+V or right-click → Paste)
3. The app detects HTML formatting and converts it to markdown automatically
4. The right preview panel renders the markdown instantly

## What Gets Converted

| Format | HTML Tag | Markdown Output |
|--------|----------|-----------------|
| Bold | `<b>`, `<strong>` | `**text**` |
| Italic | `<i>`, `<em>` | `*text*` |
| Underline | `<u>` | `<u>text</u>` (kept as HTML) |
| Strikethrough | `<s>`, `<strike>`, `<del>` | `~~text~~` |
| Headings | `<h1>`-`<h6>` | `#` to `######` |
| Lists (unordered/ordered) | `<ul>`, `<ol>`, `<li>` | `- item` |
| Links | `<a href="url">` | `[text](url)` |
| Images | `<img src="url" alt="text">` | `![text](url)` |
| Inline code | `<code>` | `` `code` `` |
| Code blocks | `<pre><code>` | ```` ``` ```` |
| Blockquotes | `<blockquote>` | `> quote` |
| Horizontal rule | `<hr>` | `---` |
| Tables | `<table>`, `<tr>`, `<td>` | Pipe tables |

## Examples

### Example 1: Paste from a web article

**Copied HTML:**
```html
<h2>Getting Started</h2>
<p>This is a <strong>guide</strong> to help you begin.</p>
<ul>
<li>First step</li>
<li>Second step</li>
</ul>
```

**Converted Markdown:**
```markdown
## Getting Started

This is a **guide** to help you begin.

- First step
- Second step
```

### Example 2: Paste from Word

**Copied content with multiple formats:**
- Heading
- Bold and italic text
- Numbered list
- Hyperlink

**Converted to clean markdown automatically**

## Notes

- The conversion happens **automatically** on paste - no button click needed
- The original "Convert Text" button is still available for converting plain text (indented code, URLs, etc.)
- Both methods update the preview and save to localStorage automatically
- If you want to paste as plain text (without conversion), paste into a plain text editor first or use Paste Special

## Technical Details

- Uses a smart HTML parser to extract structure and formatting
- Preserves code blocks without extra markdown formatting
- Handles nested elements correctly
- Converts with high fidelity while maintaining markdown best practices
