// --- 1. Configuration & Initialization ---
let editor, preview, fileInput, previewSection;

// Get elements after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    editor = document.getElementById('editor-area');
    preview = document.getElementById('preview-area');
    fileInput = document.getElementById('file-input');
    previewSection = document.getElementById('preview-area').closest('section');
});

// Embedded CSS for export (copied from styles.css)
const embeddedStyles = `/* Custom Scrollbar for Preview Pane */
.custom-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
.custom-scroll::-webkit-scrollbar-track { background: #f1f5f9; }
.custom-scroll::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 4px; }
.custom-scroll::-webkit-scrollbar-thumb:hover { background: #64748b; }

/* Editor Styles */
#editor-area {
    font-family: 'Courier New', Courier, monospace;
    line-height: 1.6;
    outline: none;
    tab-size: 4;
}

/* Hide scrollbar for editor pane but keep scroll functionality */
#editor-area::-webkit-scrollbar {
    display: none;
}
#editor-area {
    scrollbar-width: none;
    -ms-overflow-style: none;
}

/* Markdown Body Typography - replaces Tailwind prose plugin */
.markdown-body {
    line-height: 1.75;
    color: #1e293b;
    max-width: 45rem;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
    line-height: 1.25;
}

.markdown-body h1 {
    font-size: 2.25em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #e2e8f0;
    margin-top: 0;
}

.markdown-body h2 {
    font-size: 1.5em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid #e2e8f0;
}

.markdown-body h3 {
    font-size: 1.25em;
}

.markdown-body p {
    margin-top: 1em;
    margin-bottom: 1em;
}

.markdown-body a {
    color: #3b82f6;
    text-decoration: underline;
}

.markdown-body a:hover {
    color: #2563eb;
}

.markdown-body strong {
    font-weight: 600;
}

.markdown-body ul,
.markdown-body ol {
    padding-left: 2em;
    margin-top: 1em;
    margin-bottom: 1em;
}

.markdown-body li {
    margin-top: 0.5em;
    margin-bottom: 0.5em;
}

.markdown-body li>p {
    margin-top: 0.5em;
    margin-bottom: 0.5em;
}

.markdown-body blockquote {
    margin: 1.5em 0;
    padding: 0.5em 1.5em;
    border-left: 5px solid #e2e8f0;
    background-color: #f8fafc;
    color: #64748b;
    border-radius: 0 0.5rem 0.5rem 0;
}

.markdown-body blockquote p:last-child {
    margin-bottom: 0;
}

.markdown-body code {
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.875em;
}

.markdown-body :not(pre) > code {
    background-color: #f1f5f9;
    padding: 0.2em 0.4em;
    border-radius: 0.25rem;
    color: #d946ef;
}

.markdown-body pre {
    padding: 1.25rem !important;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin: 1.5em 0;
    background-color: #1e293b !important;
    border: 1px solid #334155;
}

.markdown-body pre code {
    color: #e2e8f0 !important;
    background: transparent !important;
    font-size: 0.875em;
    line-height: 1.6;
    padding: 0 !important;
}

.markdown-body table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5em 0;
    font-size: 0.9em;
}

.markdown-body th,
.markdown-body td {
    border: 1px solid #e2e8f0;
    padding: 0.5em 1em;
    text-align: left;
}

.markdown-body th {
    background-color: #f8fafc;
    font-weight: 600;
}

.markdown-body tr:nth-child(2n) {
    background-color: #f8fafc;
}

.markdown-body img {
    max-width: 100%;
    height: auto;
    border-radius: 0.5rem;
    margin: 1.5em 0;
}

.markdown-body hr {
    height: 0.25em;
    padding: 0;
    margin: 2em 0;
    background-color: #e2e8f0;
    border: 0;
}

.markdown-body input[type="checkbox"] {
    margin-right: 0.5em;
}

/* Tooltip for Buttons */
.tooltip {
    position: relative;
}
.tooltip:hover::after {
    content: attr(title);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #1f2937;
    color: #f3f4f6;
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    white-space: nowrap;
    z-index: 50;
    margin-bottom: 0.5rem;
}`;

// Scroll Synchronization
let isScrolling = false;

function syncScroll(source, target) {
    if (isScrolling) return;
    isScrolling = true;
    target.scrollTop = source.scrollTop;
    target.scrollLeft = source.scrollLeft;
    setTimeout(() => { isScrolling = false; }, 0);
}

// Panel Resizer
let isResizing = false;

// Configure Marked.js with Syntax Highlighting
marked.setOptions({
    highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    },
    langPrefix: 'hljs language-'
});

// --- 2. Core Logic ---

function renderMarkdown() {
    const md = editor.value;
    const html = marked.parse(md);
    preview.innerHTML = html;

    // Re-highlight after DOM update
    preview.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
}

// --- 3. Export Functions ---

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function exportMarkdown() {
    downloadFile(editor.value, 'document.md', 'text/markdown');
}

function exportHTML() {
    // Get the entire preview area with its classes and content
    const previewElement = document.getElementById('preview-area');
    const content = previewElement.outerHTML;

    // Create a complete HTML document that matches the preview styling
    const htmlString = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Markdown</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
    <style>${embeddedStyles}</style>
</head>
<body class="bg-white text-gray-800 overflow-y-auto custom-scroll">
    ${content}
</body>
</html>`;

    downloadFile(htmlString, 'document.html', 'text/html');
}

function exportPDF() {
    const element = document.getElementById('preview-area');
    // Temporary style adjustment for print
    const originalStyles = element.getAttribute('style');

    const opt = {
        margin:       [10, 10, 10, 10], // t,r,b,l
        filename:     'document.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Ensure the content is fully styled before capturing
    html2pdf().set(opt).from(element).save().then(() => {});
}

// --- 4. Rich Text Paste Conversion ---

/**
 * Convert HTML string to Markdown
 * Handles common rich text formatting from Word, Google Docs, web pages
 */
function htmlToMarkdown(html) {
    // Create a temporary DOM element to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    let markdown = '';
    let inList = false;
    let listType = '';

    // Process all child nodes recursively
    function processNode(node, depth = 0) {
        let result = '';

        if (node.nodeType === Node.TEXT_NODE) {
            result += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            const children = Array.from(node.childNodes).map(child => processNode(child, depth)).join('');

            switch (tagName) {
                case 'p':
                case 'div':
                case 'article':
                case 'section':
                    result += children + '\n\n';
                    break;

                case 'br':
                    result += '\n';
                    break;

                case 'h1':
                    result += `# ${children}\n\n`;
                    break;
                case 'h2':
                    result += `## ${children}\n\n`;
                    break;
                case 'h3':
                    result += `### ${children}\n\n`;
                    break;
                case 'h4':
                    result += `#### ${children}\n\n`;
                    break;
                case 'h5':
                    result += `##### ${children}\n\n`;
                    break;
                case 'h6':
                    result += `###### ${children}\n\n`;
                    break;

                case 'strong':
                case 'b':
                    result += `**${children}**`;
                    break;

                case 'em':
                case 'i':
                    result += `*${children}*`;
                    break;

                case 'u':
                    result += `<u>${children}</u>`; // Markdown doesn't have underline, keep HTML or use HTML
                    break;

                case 's':
                case 'strike':
                case 'del':
                    result += `~~${children}~~`;
                    break;

                case 'code':
                    result += `\`${children}\``;
                    break;

                case 'pre':
                    // Detect language from class
                    let lang = '';
                    if (node.className) {
                        const match = node.className.match(/language-(\w+)/);
                        if (match) lang = match[1];
                    }
                    // Get raw text content (don't process children as markdown)
                    let codeText = '';
                    for (let child of node.childNodes) {
                        if (child.nodeType === Node.TEXT_NODE) {
                            codeText += child.textContent;
                        } else if (child.nodeType === Node.ELEMENT_NODE) {
                            codeText += child.textContent;
                        }
                    }
                    result += `\`\`\`${lang}\n${codeText.trim()}\n\`\`\`\n\n`;
                    break;

                case 'blockquote':
                    const lines = children.split('\n').filter(line => line.trim());
                    result += lines.map(line => `> ${line}`).join('\n') + '\n\n';
                    break;

                case 'ul':
                    result += children;
                    if (!children.endsWith('\n\n')) result += '\n';
                    break;

                case 'ol':
                    result += children;
                    if (!children.endsWith('\n\n')) result += '\n';
                    break;

                case 'li':
                    // Determine list marker based on parent
                    const parent = node.parentElement;
                    if (parent && parent.tagName.toLowerCase() === 'ol') {
                        // For ordered lists, we'll use number + period, but actual numbers are complex
                        result += `- ${children}\n`;
                    } else {
                        result += `- ${children}\n`;
                    }
                    break;

                case 'a':
                    const href = node.getAttribute('href') || '';
                    const linkText = children || href;
                    if (href) {
                        result += `[${linkText}](${href})`;
                    } else {
                        result += children;
                    }
                    break;

                case 'img':
                    const src = node.getAttribute('src') || '';
                    const alt = node.getAttribute('alt') || '';
                    if (src) {
                        result += `![${alt}](${src})`;
                    }
                    break;

                case 'hr':
                    result += '---\n\n';
                    break;

                case 'table':
                    result += children;
                    break;

                case 'thead':
                case 'tbody':
                case 'tfoot':
                    result += children;
                    break;

                case 'tr':
                    const cells = Array.from(node.children).map(cell => {
                        const cellContent = processNode(cell).trim();
                        return `| ${cellContent} `;
                    }).join('');
                    result += cells + '|\n';
                    break;

                case 'th':
                case 'td':
                    result += children;
                    break;

                case 'span':
                case 'font':
                case 'label':
                default:
                    result += children;
                    break;
            }
        }
        return result;
    }

    // Process all top-level nodes
    const nodes = temp.childNodes;
    for (let node of nodes) {
        markdown += processNode(node);
    }

    // Clean up excessive whitespace while preserving structure
    markdown = markdown.replace(/[ \t]+$/gm, ''); // Trim trailing spaces
    markdown = markdown.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines

    return markdown.trim();
}

// Paste event listener for rich text conversion
function handlePaste(e) {
    // Get pasted data
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    // Check if HTML is available
    const htmlData = clipboardData.getData('text/html');
    const textData = clipboardData.getData('text/plain');

    // If HTML data exists and is substantially different from plain text
    // Use a smaller threshold to allow conversion of short formatted snippets
    if (htmlData && (htmlData.length > textData.length + 10 || /<(b|i|strong|em|h[1-6]|ul|ol|li|a|code|pre|blockquote|p)/i.test(htmlData))) {
        e.preventDefault(); // Prevent default paste

        // Convert HTML to Markdown
        const markdown = htmlToMarkdown(htmlData);

        // Insert at cursor position or replace selection
        const textarea = e.target;
        const startPos = textarea.selectionStart;
        const endPos = textarea.selectionEnd;
        const before = textarea.value.substring(0, startPos);
        const after = textarea.value.substring(endPos);

        // Set new value
        textarea.value = before + markdown + after;
        textarea.selectionStart = textarea.selectionEnd = startPos + markdown.length;

        // Trigger update
        renderMarkdown();
        localStorage.setItem('tm_saved_draft', textarea.value);
    }
    // Otherwise, let the default paste behavior happen for plain text
}

// --- 5. Text Conversion (The "Converter" Feature) ---

// Helper: Check if line is a header candidate (capitalized short lines)
function isHeaderCandidate(line) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 100 || trimmed.length < 2) return false;
    // Check if it's all caps or Title Case and doesn't end with punctuation
    const endsWithPunct = /[.!?]$/.test(trimmed);
    const hasMixedCase = /[A-Z]/.test(trimmed) && /[a-z]/.test(trimmed);
    return !endsWithPunct && (hasMixedCase || trimmed === trimmed.toUpperCase());
}

function autoFormatText() {
    let text = editor.value;
    const lines = text.split('\n');
    let formattedLines = [];
    let inCodeBlock = false;
    let codeBlockBuffer = [];
    let codeIndent = 0;
    let blankLineCount = 0;

    // Helper: Check if line is likely a code line (indentation or keywords)
    function isCodeLine(line, indent) {
        const trimmed = line.trim();
        if (!trimmed) return false;
        const codeKeywords = /^(let|const|var|def|func|function|class|interface|struct|import|export|from|if|else|for|while|return|try|catch|switch|case|break|continue|#include|#define|printf|cout|cin|int|float|double|string|bool|void|public|private|protected|static|final|new|this|super|=>|:|\$)/i;
        return indent >= 4 || codeKeywords.test(trimmed) || trimmed.includes('{') || trimmed.includes('}') || trimmed.includes('()') || trimmed.includes(';');
    }

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const trimmed = line.trim();
        const indent = line.length - line.trimLeft().length;

        // Handle blank lines - separate code blocks, reset counters
        if (!trimmed) {
            blankLineCount++;

            // Close code block if we have buffered code and a blank line
            if (inCodeBlock && codeBlockBuffer.length > 0) {
                formattedLines.push('```');
                formattedLines.push(...codeBlockBuffer);
                formattedLines.push('```');
                formattedLines.push('');
                inCodeBlock = false;
                codeBlockBuffer = [];
            } else if (blankLineCount === 1) {
                formattedLines.push('');
            }
            continue;
        }

        blankLineCount = 0;

        // Detect start of code block
        if (!inCodeBlock && indent >= 4) {
            inCodeBlock = true;
            codeIndent = indent;
            codeBlockBuffer = [line];
        }
        // Continue code block
        else if (inCodeBlock) {
            // Check if this line maintains code block indentation
            if (indent >= codeIndent || isCodeLine(line, indent)) {
                codeBlockBuffer.push(line);
            } else {
                // Close code block
                if (codeBlockBuffer.length > 0) {
                    formattedLines.push('```');
                    formattedLines.push(...codeBlockBuffer);
                    formattedLines.push('```');
                }
                inCodeBlock = false;
                codeBlockBuffer = [];

                // Process the current line normally
                formattedLines.push(formatLine(line, i, lines));
            }
        }
        // Regular text line
        else {
            formattedLines.push(formatLine(line, i, lines));
        }
    }

    // Close any remaining code block
    if (inCodeBlock && codeBlockBuffer.length > 0) {
        formattedLines.push('```');
        formattedLines.push(...codeBlockBuffer);
        formattedLines.push('```');
    }

    // Remove excessive blank lines (more than 2 consecutive)
    let finalLines = [];
    let consecutiveBlanks = 0;
    for (const line of formattedLines) {
        if (line === '') {
            consecutiveBlanks++;
            if (consecutiveBlanks <= 2) {
                finalLines.push(line);
            }
        } else {
            consecutiveBlanks = 0;
            finalLines.push(line);
        }
    }

    editor.value = finalLines.join('\n');
    renderMarkdown();
    localStorage.setItem('tm_saved_draft', editor.value);
}

// Helper to format individual lines
function formatLine(line, index, allLines) {
    const trimmed = line.trim();

    // Skip lines that already have markdown formatting (headings, blockquotes, code blocks, lists)
    if (trimmed.startsWith('#') || trimmed.startsWith('>') || trimmed.startsWith('```') ||
        trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return line;
    }

    // FIRST: Detect and format list items (convert numbered lists to bullet points)
    // This must come BEFORE header detection to avoid "1. Item" becoming a header
    if (/^(\d+\.|\(\d+\))\s+/.test(trimmed)) {
        return trimmed.replace(/^(\d+\.|\(\d+\))\s+/, '- ');
    }

    // Detect and format URLs
    if (trimmed.includes('http') || trimmed.includes('www')) {
        const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
        if (!trimmed.includes('[') && !trimmed.includes(']') && !trimmed.startsWith('*')) {
            return trimmed.replace(urlPattern, (url) => {
                const cleanUrl = url.startsWith('www.') ? `https://${url}` : url;
                return `[${url}](${cleanUrl})`;
            });
        }
    }

    // Detect and format headers (only for lines that aren't lists/URLs/code)
    if (!trimmed.includes('`') && !trimmed.includes('[') && !trimmed.includes(']')) {
        const isPotentialHeader = isHeaderCandidate(line);
        if (isPotentialHeader) {
            const nextLine = index + 1 < allLines.length ? allLines[index + 1].trim() : '';
            if (!nextLine || nextLine === '' || nextLine.length < trimmed.length / 2) {
                return `## ${trimmed}`;
            }
        }
    }

    // Wrap individual code keywords in backticks (sparingly)
    if (!trimmed.includes('`') && !trimmed.startsWith('```')) {
        const codeKeywords = /\b(let|const|var|function|return|if|else|for|while|class|import|export|from|def|func|new|this|try|catch|switch|case|break|continue|throw|async|await| => |public|private|protected|static|void|int|float|double|string|bool|printf|cout|cin)\b/gi;
        if (codeKeywords.test(trimmed) && trimmed.length < 100) {
            // Only wrap the keyword itself, not the whole line
            return line.replace(codeKeywords, (match) => `\`${match}\``);
        }
    }

    return line;
}

// Default text
const defaultText = `# Tech-MD Studio

Welcome to your **machine-code markdown** environment.

## Features

- [x] Import Files
- [x] Syntax Highlighting
- [ ] Auto-Format Support

### Sample Code

\`\`\`javascript
function optimizeSystem(input) {
  console.log("Processing data stream...");
  return input.map(i => i * 2);
}
\`\`\`

Happy Coding!`;

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    editor = document.getElementById('editor-area');
    preview = document.getElementById('preview-area');
    fileInput = document.getElementById('file-input');
    previewSection = document.getElementById('preview-area').closest('section');

    const resizer = document.getElementById('resizer');
    const editorPane = document.getElementById('editor-pane');
    const previewPane = document.getElementById('preview-pane');

    // Load from localStorage or use default
    const savedContent = localStorage.getItem('tm_saved_draft');
    editor.value = savedContent || defaultText;
    renderMarkdown();

    // Set up scroll synchronization
    editor.addEventListener('scroll', () => syncScroll(editor, previewSection));
    previewSection.addEventListener('scroll', () => syncScroll(previewSection, editor));

    // Set up paste event listener for rich text to markdown conversion
    editor.addEventListener('paste', handlePaste);

    // Set up panel resizer
    resizer.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevent text selection and default drag behavior
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const container = document.querySelector('main');
        const containerRect = container.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const resizerRect = resizer.getBoundingClientRect();
        const resizerWidth = resizerRect.width;

        // Calculate desired editor width based on mouse position relative to container
        let newEditorWidth = e.clientX - containerRect.left;

        // Clamp to minimum sizes (200px each) and ensure preview has room
        const minEditorWidth = 200;
        const minPreviewWidth = 200;
        const minAllowedEditor = minEditorWidth;
        const maxAllowedEditor = containerWidth - resizerWidth - minPreviewWidth;

        newEditorWidth = Math.max(minAllowedEditor, Math.min(newEditorWidth, maxAllowedEditor));

        // Apply the new width
        editorPane.style.flex = '0 0 auto';
        editorPane.style.width = `${newEditorWidth}px`;
        previewPane.style.flex = '1 1 0%';
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });

    // Listen for input changes and save to localStorage
    editor.addEventListener('input', () => {
        renderMarkdown();
        localStorage.setItem('tm_saved_draft', editor.value);
    });

    // Set up file input handler
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            editor.value = event.target.result;
            renderMarkdown();
            localStorage.setItem('tm_saved_draft', editor.value);
        };
        reader.readAsText(file);
    });
});

// Clear localStorage and reset to default
function clearLocalStorage() {
    if(confirm('Are you sure you want to clear the saved draft? This cannot be undone.')) {
        localStorage.removeItem('tm_saved_draft');
        editor.value = defaultText;
        renderMarkdown();
    }
}
