// Simple Node.js test for htmlToMarkdown function

// Copy the htmlToMarkdown function here
function htmlToMarkdown(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;

    let markdown = '';

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
                    result += `<u>${children}</u>`;
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
                    let lang = '';
                    if (node.className) {
                        const match = node.className.match(/language-(\w+)/);
                        if (match) lang = match[1];
                    }
                    result += `\`\`\`${lang}\n${children}\`\`\`\n\n`;
                    break;
                case 'blockquote':
                    const lines = children.split('\n').filter(line => line.trim());
                    result += lines.map(line => `> ${line}`).join('\n') + '\n\n';
                    break;
                case 'ul':
                case 'ol':
                    result += children;
                    if (!children.endsWith('\n\n')) result += '\n';
                    break;
                case 'li':
                    result += `- ${children}\n`;
                    break;
                case 'a':
                    const href = node.getAttribute('href') || '';
                    const linkText = children || href;
                    if (href) result += `[${linkText}](${href})`;
                    else result += children;
                    break;
                case 'img':
                    const src = node.getAttribute('src') || '';
                    const alt = node.getAttribute('alt') || '';
                    if (src) result += `![${alt}](${src})`;
                    break;
                case 'hr':
                    result += '---\n\n';
                    break;
                default:
                    result += children;
            }
        }
        return result;
    }

    const nodes = temp.childNodes;
    for (let node of nodes) {
        markdown += processNode(node);
    }

    markdown = markdown.replace(/[ \t]+$/gm, '');
    markdown = markdown.replace(/\n{3,}/g, '\n\n');
    return markdown.trim();
}

// Test cases
const tests = [
    {
        name: "Bold, italic, underline",
        html: '<p>This is <b>bold</b>, <i>italic</i>, and <u>underline</u> text.</p>',
        expected: 'This is **bold**, *italic*, and <u>underline</u> text.'
    },
    {
        name: "Headings",
        html: '<h1>Main</h1><h2>Section</h2><h3>Subsection</h3>',
        expected: '# Main\n\n## Section\n\n### Subsection'
    },
    {
        name: "Unordered list",
        html: '<ul><li>Item 1</li><li>Item 2</li></ul>',
        expected: '- Item 1\n- Item 2\n'
    },
    {
        name: "Ordered list",
        html: '<ol><li>Step 1</li><li>Step 2</li></ol>',
        expected: '- Step 1\n- Step 2\n'
    },
    {
        name: "Links",
        html: '<p>Visit <a href="https://example.com">Example</a></p>',
        expected: 'Visit [Example](https://example.com).'
    },
    {
        name: "Code",
        html: '<p>Use <code>test()</code> function</p><pre><code>code block</code></pre>',
        expected: 'Use `test()` function\n\n```\ncode block\n```\n'
    },
    {
        name: "Blockquote",
        html: '<blockquote>Important quote</blockquote>',
        expected: '> Important quote\n'
    }
];

// Run tests
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.Node = dom.window.Node;

let passed = 0;
let failed = 0;

for (const test of tests) {
    const result = htmlToMarkdown(test.html);
    const success = result === test.expected;

    if (success) {
        console.log(`✓ ${test.name}`);
        passed++;
    } else {
        console.log(`✗ ${test.name}`);
        console.log(`  Expected: ${JSON.stringify(test.expected)}`);
        console.log(`  Got: ${JSON.stringify(result)}`);
        failed++;
    }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
