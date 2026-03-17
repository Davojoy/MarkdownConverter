// --- 1. Configuration & Initialization ---
const editor = document.getElementById('editor-area');
const preview = document.getElementById('preview-area');
const fileInput = document.getElementById('file-input');
const previewSection = document.getElementById('preview-area').closest('section');

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
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = preview.innerHTML;

    // Basic wrapper for valid HTML
    const htmlString = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Document</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
<style>body{padding:40px;font-family:system-ui} pre{border-radius:8px;}</style></head>
<body>${tempDiv.innerHTML}</body></html>`;

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
