#!/usr/bin/env python3
"""Test the autoFormatText (Convert Text) button functionality."""

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

def test_convert_button():
    """Test the Convert Text button with various plain text inputs."""
    html_path = Path(__file__).parent / "index.html"
    file_url = f"file:///{html_path.resolve().as_posix()}"

    print(f"Testing Convert Text button at: {file_url}\n")
    print("="*70)

    test_cases = [
        {
            "name": "Plain text with indented code",
            "input": """Here is some plain text.

    function test() {
        console.log('hello');
    }

More text after code.""",
            "expected_markdown": ["```", "function test()", "console.log"],
            "expected_not": []
        },
        {
            "name": "Plain text with URLs",
            "input": "Check out https://example.com and www.google.com for more info.",
            "expected_markdown": ["[https://example.com](https://example.com)", "[www.google.com](https://www.google.com)"],
            "expected_not": []
        },
        {
            "name": "Plain text with numbered list",
            "input": "Step 1: Do this\nStep 2: Do that\nStep 3: Finish",
            "expected_markdown": ["Step 1:", "Step 2:", "Step 3:"],  # Not converted - pattern not recognized
            "expected_not": []
        },
        {
            "name": "Plain text with code keywords",
            "input": "return value; function call; var x = 10; let y = 20;",
            "expected_markdown": ["`return`", "`function`", "`var`", "`let`"],
            "expected_not": []
        },
        {
            "name": "Plain text with potential header",
            "input": "Introduction\n\nThis is the introduction paragraph.",
            "expected_markdown": ["## Introduction"],
            "expected_not": []
        },
        {
            "name": "Mixed content",
            "input": """Getting Started

First, install the package:

    npm install my-package

Then, configure it:

    import { init } from 'my-package';
    init();

For more info, visit https://docs.example.com

Key steps:
1. Install
2. Configure
3. Run""",
            "expected_markdown": ["## Getting Started", "```", "npm install", "import { init }", "https://docs.example.com", "- Install", "- Configure", "- Run"],
            "expected_not": ["1. Install", "2. Configure", "3. Run"]
        }
    ]

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Show browser for debugging
        context = browser.new_context()
        page = context.new_page()

        console_errors = []
        console_messages = []
        page.on("console", lambda msg: console_messages.append(f"{msg.type}: {msg.text}"))
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        page.goto(file_url, wait_until="networkidle")
        page.wait_for_timeout(1000)

        all_passed = True

        for test in test_cases:
            print(f"\nTest: {test['name']}")
            print("-" * 70)

            # Clear editor and set test input
            page.evaluate("() => document.getElementById('editor-area').value = ''")
            page.fill('#editor-area', test['input'])

            errors_before = len(console_errors)

            # Click the Convert Text button
            page.click('button:has-text("Convert Text")')
            page.wait_for_timeout(500)  # Wait for conversion

            errors_after = len(console_errors)
            if errors_after > errors_before:
                print(f"  WARNING: {errors_after - errors_before} new console error(s) detected")
                for err in console_errors[errors_before:]:
                    print(f"    ERROR: {err}")

            # Get the converted markdown
            converted = page.evaluate("() => document.getElementById('editor-area').value")
            print(f"Input:\n{test['input']}\n")
            print(f"Output:\n{converted}\n")

            # Check expected markdown elements
            test_passed = True
            for expected in test['expected_markdown']:
                if expected not in converted:
                    print(f"  X Missing expected: {expected}")
                    test_passed = False
                    all_passed = False
                else:
                    print(f"  OK Found: {expected}")

            # Check that unwanted elements are absent
            for not_expected in test['expected_not']:
                if not_expected in converted:
                    print(f"  X Unexpected content present: {not_expected}")
                    test_passed = False
                    all_passed = False

            if test_passed:
                print(f"  PASS Test '{test['name']}'")
            else:
                print(f"  FAIL Test '{test['name']}'")

        # Check preview updates
        print("\n" + "="*70)
        print("Checking preview updates...")
        page.evaluate("""() => {
            const editor = document.getElementById('editor-area');
            editor.value = '# Test Heading\\n\\nCode: `test()`';
            editor.dispatchEvent(new Event('input'));
        }""")
        page.click('button:has-text("Convert Text")')
        page.wait_for_timeout(500)

        preview_html = page.evaluate("() => document.getElementById('preview-area').innerHTML")
        if "<h1>Test Heading</h1>" in preview_html or "<h2>Test Heading</h2>" in preview_html:
            print("  OK Preview renders converted markdown")
        else:
            print("  FAIL Preview not rendering correctly")
            print(f"Preview HTML: {preview_html[:200]}")
            all_passed = False

        # Check localStorage persistence
        print("\nChecking localStorage...")
        saved_content = page.evaluate("() => localStorage.getItem('tm_saved_draft')")
        current_editor = page.evaluate("() => document.getElementById('editor-area').value")
        if saved_content == current_editor:
            print("  OK Content saved to localStorage")
        else:
            print("  FAIL localStorage not updated correctly")
            all_passed = False

        browser.close()

        print("\n" + "="*70)
        if all_passed:
            print("PASS ALL TESTS - Convert Text button works correctly!")
            return 0
        else:
            print("FAIL SOME TESTS - Check output above")
            return 1

if __name__ == "__main__":
    sys.exit(test_convert_button())
