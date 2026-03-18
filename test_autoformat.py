#!/usr/bin/env python3
"""Test the autoFormatText function with various plain text inputs."""

import subprocess
import tempfile
import os

# Test cases for autoFormatText
test_cases = [
    {
        "name": "Plain text with indented code",
        "input": "Here is some plain text.\n\n    function test() {\n        console.log('hello');\n    }\n\nMore text.",
        "expected_contains": ["```", "function test()", "console.log"]
    },
    {
        "name": "Plain text with URLs",
        "input": "Check out https://example.com and www.google.com for more info.",
        "expected_contains": ["[https://example.com]", "[www.google.com](https://www.google.com)"]
    },
    {
        "name": "Plain text with list-like items",
        "input": "- Item one\n- Item two\n- Item three",
        "expected_contains": ["- Item one", "- Item two", "- Item three"]
    },
    {
        "name": "Plain text with code keywords",
        "input": "Use the return statement to exit a function. Let me show you var x = 5.",
        "expected_contains": ["`return`", "`var x = 5`"]
    },
    {
        "name": "Plain text with potential headers",
        "input": "Introduction\n\nThis is the introduction text that follows.",
        "expected_contains": ["## Introduction"]
    }
]

def run_js_test(test_input):
    """Run the autoFormatText function with given input."""
    # Use the full formatLine from script.js
    js_script = f'''
const editor = {{ value: `{test_input}` }};
const localStorage = {{ data: {{}} }};
localStorage.getItem = function(key) {{ return this.data[key] || null; }};
localStorage.setItem = function(key, value) {{ this.data[key] = value; }};
localStorage.removeItem = function(key) {{ delete this.data[key]; }};

function renderMarkdown() {{}}

function isHeaderCandidate(line) {{
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 100 || trimmed.length < 2) return false;
    const endsWithPunct = /[.!?]$/.test(trimmed);
    const hasMixedCase = /[A-Z]/.test(trimmed) && /[a-z]/.test(trimmed);
    return !endsWithPunct && (hasMixedCase || trimmed === trimmed.toUpperCase());
}}

function formatLine(line, index, allLines) {{
    const trimmed = line.trim();

    // Skip lines that already have markdown formatting
    if (trimmed.startsWith('#') || trimmed.startsWith('>') || trimmed.startsWith('```') ||
        trimmed.startsWith('-') || trimmed.startsWith('*') || /^\\d+\\./.test(trimmed)) {{
        return line;
    }}

    // Detect and format headers (only for lines that don't start with list markers)
    if (!trimmed.includes('`') && !trimmed.includes('[') && !trimmed.includes(']')) {{
        const isPotentialHeader = isHeaderCandidate(line);
        if (isPotentialHeader) {{
            const nextLine = index + 1 < allLines.length ? allLines[index + 1].trim() : '';
            if (!nextLine || nextLine === '' || nextLine.length < trimmed.length / 2) {{
                return `## ${{trimmed}}`;
            }}
        }}
    }}

    // Detect and format list items (convert numbered lists to bullet points)
    if (!trimmed.startsWith('-') && !trimmed.startsWith('*') && /^(\\d+\\.|\\(\\d\\))\\s+/.test(trimmed)) {{
        return trimmed.replace(/^(\\d+\\.|\\(\\d\\))\\s+/, '- ');
    }}

    // Detect and format URLs
    if (trimmed.includes('http') || trimmed.includes('www')) {{
        const urlPattern = /(https?:\\/\\/[^\\s]+|www\\.[^\\s]+)/g;
        if (!trimmed.includes('[') && !trimmed.includes(']')) {{
            return trimmed.replace(urlPattern, (url) => {{
                const cleanUrl = url.startsWith('www.') ? `https://${{url}}` : url;
                return `[${{url}}](${{cleanUrl}})`;
            }});
        }}
    }}

    // Wrap individual code keywords in backticks (sparingly)
    if (!trimmed.includes('`') && !trimmed.startsWith('```')) {{
        const codeKeywords = /\\b(let|const|var|function|return|if|else|for|while|class|import|export|from|def|func|new|this|try|catch|switch|case|break|continue|throw|async|await| => |public|private|protected|static|void|int|float|double|string|bool|printf|cout|cin)\\b/gi;
        if (codeKeywords.test(trimmed) && trimmed.length < 100) {{
            return line.replace(codeKeywords, (match) => `\\`${{match}}\\``);
        }}
    }}

    return line;
}}

function autoFormatText() {{
    let text = editor.value;
    const lines = text.split('\\n');
    let formattedLines = [];
    let inCodeBlock = false;
    let codeBlockBuffer = [];
    let codeIndent = 0;
    let blankLineCount = 0;

    function isCodeLine(line, indent) {{
        const trimmed = line.trim();
        if (!trimmed) return false;
        const codeKeywords = /^(let|const|var|def|func|function|class|interface|struct|import|export|from|if|else|for|while|return|try|catch|switch|case|break|continue|#include|#define|printf|cout|cin|int|float|double|string|bool|void|public|private|protected|static|final|new|this|super|=>|:|$)/i;
        return indent >= 4 || codeKeywords.test(trimmed) || trimmed.includes('{') || trimmed.includes('}') || trimmed.includes('()') || trimmed.includes(';');
    }}

    for (let i = 0; i < lines.length; i++) {{
        let line = lines[i];
        const trimmed = line.trim();
        const indent = line.length - line.trimLeft().length;

        if (!trimmed) {{
            blankLineCount++;
            if (inCodeBlock && codeBlockBuffer.length > 0) {{
                formattedLines.push('```');
                formattedLines.push(...codeBlockBuffer);
                formattedLines.push('```');
                formattedLines.push('');
                inCodeBlock = false;
                codeBlockBuffer = [];
            }} else if (blankLineCount === 1) {{
                formattedLines.push('');
            }}
            continue;
        }}

        blankLineCount = 0;

        if (!inCodeBlock && indent >= 4) {{
            inCodeBlock = true;
            codeIndent = indent;
            codeBlockBuffer = [line];
        }} else if (inCodeBlock) {{
            if (indent >= codeIndent || isCodeLine(line, indent)) {{
                codeBlockBuffer.push(line);
            }} else {{
                if (codeBlockBuffer.length > 0) {{
                    formattedLines.push('```');
                    formattedLines.push(...codeBlockBuffer);
                    formattedLines.push('```');
                }}
                inCodeBlock = false;
                codeBlockBuffer = [];
                formattedLines.push(formatLine(line, i, lines));
            }}
        }} else {{
            formattedLines.push(formatLine(line, i, lines));
        }}
    }}

    if (inCodeBlock && codeBlockBuffer.length > 0) {{
        formattedLines.push('```');
        formattedLines.push(...codeBlockBuffer);
        formattedLines.push('```');
    }}

    let finalLines = [];
    let consecutiveBlanks = 0;
    for (const line of formattedLines) {{
        if (line === '') {{
            consecutiveBlanks++;
            if (consecutiveBlanks <= 2) finalLines.push(line);
        }} else {{
            consecutiveBlanks = 0;
            finalLines.push(line);
        }}
    }}

    editor.value = finalLines.join('\\n');
    return editor.value;
}}

const result = autoFormatText();
console.log(result);
'''

    result = subprocess.run(
        ['node', '-e', js_script],
        capture_output=True,
        text=True,
        cwd='.'
    )
    return result.stdout.strip()

def main():
    print("Testing autoFormatText function\n")
    print("="*60)

    all_passed = True
    for test in test_cases:
        print(f"\nTest: {test['name']}")
        print(f"Input:\n{test['input']}")
        result = run_js_test(test['input'])
        print(f"Output:\n{result}")

        passed = True
        for expected in test['expected_contains']:
            if expected not in result:
                print(f"  X Missing: {expected}")
                passed = False
                all_passed = False
            else:
                print(f"  OK Found: {expected}")

        if passed:
            print("  OK Test passed")
        else:
            print("  FAIL Test failed")

    print("\n" + "="*60)
    if all_passed:
        print("OK All tests passed!")
    else:
        print("FAIL Some tests failed")

    return 0 if all_passed else 1

if __name__ == "__main__":
    exit(main())
