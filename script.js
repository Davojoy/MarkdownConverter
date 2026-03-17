// --- 1. Configuration & Initialization ---
const editor = document.getElementById('editor-area');
const preview = document.getElementById('preview-area');
const fileInput = document.getElementById('file-input');
const previewSection = document.getElementById('preview-area').closest('section');

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

editor.addEventListener('scroll', () => syncScroll(editor, previewSection));
previewSection.addEventListener('scroll', () => syncScroll(previewSection, editor));

// Configure Marked.js with Syntax Highlighting
marked.setOptions({
    highlight: function(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language }).value;
    },
    langPrefix: 'hljs language-'
});

// Load Default Text
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

// Try to load from LocalStorage
const savedContent = localStorage.getItem('tm_saved_draft');
editor.value = savedContent || defaultText;
renderMarkdown();

// Listen for changes
editor.addEventListener('input', () => {
    renderMarkdown();
    localStorage.setItem('tm_saved_draft', editor.value);
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

// --- 3. Import Functionality ---

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        editor.value = event.target.result;
        renderMarkdown();
    };
    reader.readAsText(file);
});

// --- 4. Export Functions ---

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

// --- 5. Text Conversion (The "Converter" Feature) ---

function autoFormatText() {
    let text = editor.value;

    // Helper: Detect Code Blocks
    // This is a simplistic heuristic based on indentation
    const lines = text.split('\n');
    let formattedLines = [];
    let inBlock = false;

    // 1. Simple Heuristic: Indentations become code blocks (basic attempt)
    // Note: Real NLP conversion requires complex logic. We'll do structural improvements.

    // Add Headers for short centered lines? (Too risky for code docs)

    // Better Approach: Wrap long isolated code-like lines
    for(let i=0; i<lines.length; i++) {
        let line = lines[i].trim();

        // Detect Potential Code (starts with variable, loop, function keywords loosely)
        if(line.match(/^(let|const|var|def|func|class|\$|#)/i)) {
            line = "> " + line; // Quote style for pseudo-code explanation
        }

        // Detect Links
        if(line.includes('http') || line.includes('www')) {
           line = `[Link](${line})`;
        }

        formattedLines.push(lines[i]);
    }

    editor.value = formattedLines.join('\n');
    renderMarkdown();
}

// Clear localStorage and reset to default
function clearLocalStorage() {
    if(confirm('Are you sure you want to clear the saved draft? This cannot be undone.')) {
        localStorage.removeItem('tm_saved_draft');
        editor.value = defaultText;
        renderMarkdown();
    }
}
