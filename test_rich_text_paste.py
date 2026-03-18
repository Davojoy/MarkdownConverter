#!/usr/bin/env python3
"""Test the rich text paste functionality - HTML to Markdown conversion."""

import sys
import os
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Installing Playwright...")
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'playwright'])
    subprocess.check_call([sys.executable, '-m', 'playwright', 'install', 'chromium'])
    from playwright.sync_api import sync_playwright

def test_rich_text_paste():
    """Test pasting rich text (HTML) and converting to markdown."""
    html_path = Path(__file__).parent / "index.html"
    file_url = f"file:///{html_path.resolve().as_posix()}"

    print(f"Testing Rich Text Paste at: {file_url}\n")
    print("="*70)

    # Test cases with HTML content that would be pasted from Word/Google Docs
    test_cases = [
        {
            "name": "Bold, italic, and underline",
            "html": "<p>This is <b>bold</b>, <i>italic</i>, and <u>underline</u> text.</p>",
            "expected_markdowns": [
                "This is **bold**, *italic*, and <u>underline</u> text."
            ],
            "expected_not": ["<b>", "<i>"]  # <u> kept as HTML since markdown lacks underline
        },
        {
            "name": "Headings (H1-H3)",
            "html": "<h1>Main Title</h1><h2>Section Header</h2><h3>Subsection</h3>",
            "expected_markdowns": [
                "# Main Title",
                "## Section Header",
                "### Subsection"
            ],
            "expected_not": ["<h1>", "<h2>", "<h3>"]
        },
        {
            "name": "Unordered list",
            "html": "<ul><li>First item</li><li>Second item</li><li>Third item</li></ul>",
            "expected_markdowns": [
                "- First item",
                "- Second item",
                "- Third item"
            ],
            "expected_not": ["<ul>", "<li>"]
        },
        {
            "name": "Ordered list",
            "html": "<ol><li>Step one</li><li>Step two</li><li>Step three</li></ol>",
            "expected_markdowns": [
                "- Step one",
                "- Step two",
                "- Step three"
            ],
            "expected_not": ["<ol>", "<li>1."]
        },
        {
            "name": "Links and images",
            "html": '<p>Visit <a href="https://example.com">Example Site</a> and see <img src="image.jpg" alt="My Image"></p>',
            "expected_markdowns": [
                "[Example Site](https://example.com)",
                "![My Image](image.jpg)"
            ],
            "expected_not": ["<a href", "<img src"]
        },
        {
            "name": "Code blocks and inline code",
            "html": "<p>Use <code>console.log()</code> for debugging.</p><pre><code>function test() {\n  return true;\n}</code></pre>",
            "expected_markdowns": [
                "`console.log()`",
                "```\nfunction test() {\n  return true;\n}\n```"
            ],
            "expected_not": ["<code>", "<pre>"]
        },
        {
            "name": "Blockquote",
            "html": "<blockquote>This is an important quote from documentation.</blockquote>",
            "expected_markdowns": [
                "> This is an important quote from documentation."
            ],
            "expected_not": ["<blockquote>"]
        },
        {
            "name": "Mixed rich text (Word-like)",
            "html": """<h2>Getting Started Guide</h2>
<p>Welcome to the <strong>Ultimate Guide</strong>. This will teach you everything.</p>
<ul>
<li>First, install the package</li>
<li>Second, configure it</li>
<li>Third, start coding!</li>
</ul>
<blockquote>Pro tip: Save your work frequently.</blockquote>
<p>For more details, see <a href="https://docs.example.com">the documentation</a>.</p>""",
            "expected_markdowns": [
                "## Getting Started Guide",
                "**Ultimate Guide**",
                "- First, install the package",
                "- Second, configure it",
                "- Third, start coding!",
                "> Pro tip: Save your work frequently.",
                "[the documentation](https://docs.example.com)"
            ],
            "expected_not": ["<h2>", "<strong>", "<ul>", "<blockquote>", "<a href"]
        }
    ]

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        page.goto(file_url, wait_until="networkidle")
        page.wait_for_timeout(1000)

        all_passed = True

        for test in test_cases:
            print(f"\nTest: {test['name']}")
            print("-" * 70)

            # Clear editor
            page.evaluate("() => document.getElementById('editor-area').value = ''")

            # Directly call handlePaste with mock event
            page.evaluate("(html) => {"
                         "const editor = document.getElementById('editor-area');"
                         "const mockEvent = {"
                         "  clipboardData: {"
                         "    getData: (type) => {"
                         "      if (type === 'text/html') return html;"
                         "      if (type === 'text/plain') return 'plain text fallback';"
                         "      return '';"
                         "    }"
                         "  },"
                         "  target: editor,"
                         "  preventDefault: () => {}"
                         "};"
                         "handlePaste(mockEvent);"
                         "}", test['html'])

            page.wait_for_timeout(200)

            # Get the converted markdown from editor
            converted = page.evaluate("() => document.getElementById('editor-area').value")
            print(f"Input HTML: {test['html'][:80]}...")
            print(f"Output Markdown:\n{converted[:200]}\n")

            test_passed = True

            # Check expected markdown elements
            for expected in test['expected_markdowns']:
                if expected not in converted:
                    print(f"  X Missing expected: {expected}")
                    test_passed = False
                    all_passed = False
                else:
                    print(f"  OK Found: {expected}")

            # Check unwanted elements are absent
            for not_expected in test['expected_not']:
                if not_expected in converted:
                    print(f"  X Unexpected content present: {not_expected}")
                    test_passed = False
                    all_passed = False

            if test_passed:
                print(f"  PASS Test '{test['name']}'")
            else:
                print(f"  FAIL Test '{test['name']}'")

        # Check console for errors
        if console_errors:
            print(f"\nWARNING: {len(console_errors)} JavaScript errors:")
            for err in console_errors[:5]:
                print(f"  - {err}")
            all_passed = False

        browser.close()

        print("\n" + "="*70)
        if all_passed:
            print("ALL TESTS PASSED - Rich text paste conversion works!")
            return 0
        else:
            print("SOME TESTS FAILED")
            return 1

if __name__ == "__main__":
    sys.exit(test_rich_text_paste())
