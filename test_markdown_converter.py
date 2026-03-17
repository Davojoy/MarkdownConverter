#!/usr/bin/env python3
"""Test the index.html page with Playwright."""

import sys
import os
from pathlib import Path

# Add Playwright path
playwright_path = Path(os.getenv('APPDATA', '')) / 'Python' / 'Python311' / 'site-packages'
if playwright_path.exists():
    sys.path.insert(0, str(playwright_path))

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Installing Playwright...")
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'playwright'])
    subprocess.check_call([sys.executable, '-m', 'playwright', 'install', 'chromium'])
    from playwright.sync_api import sync_playwright

def test_page():
    """Test the markdown converter page."""
    html_path = Path(__file__).parent / "index.html"
    file_url = f"file:///{html_path.resolve().as_posix()}"

    print(f"Testing page: {file_url}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Capture console messages
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

        # Navigate to page
        page.goto(file_url, wait_until="networkidle")

        # Wait a bit for JavaScript to execute
        page.wait_for_timeout(1000)

        # Take screenshot
        screenshot_path = Path(__file__).parent / "test-screenshot.png"
        page.screenshot(path=str(screenshot_path), full_page=True)
        print(f"Screenshot saved: {screenshot_path}")

        # Check if editor has content
        editor_content = page.evaluate("() => document.getElementById('editor-area').value")
        print(f"\nEditor content length: {len(editor_content)} characters")

        # Check preview area
        preview_html = page.evaluate("() => document.getElementById('preview-area').innerHTML")
        print(f"Preview HTML length: {len(preview_html)} characters")

        # Check for markdown elements
        has_headings = page.evaluate("() => document.querySelectorAll('#preview-area h1, #preview-area h2, #preview-area h3').length")
        has_code_blocks = page.evaluate("() => document.querySelectorAll('#preview-area pre').length")
        has_lists = page.evaluate("() => document.querySelectorAll('#preview-area ul, #preview-area ol').length")

        print(f"\nRendered elements:")
        print(f"  - Headings (h1-h3): {has_headings}")
        print(f"  - Code blocks: {has_code_blocks}")
        print(f"  - Lists: {has_lists}")

        # Report console errors
        if console_errors:
            print(f"\nConsole errors ({len(console_errors)}):")
            for err in console_errors:
                print(f"  - {err}")
        else:
            print("\n✓ No console errors!")

        # Test that both panes are visible
        editor_visible = page.evaluate("() => document.getElementById('editor-area').offsetParent !== null")
        preview_visible = page.evaluate("() => document.getElementById('preview-area').offsetParent !== null")
        print(f"\nVisibility:")
        print(f"  - Editor pane: {editor_visible}")
        print(f"  - Preview pane: {preview_visible}")

        # Check CSS loaded
        computed_editor = page.evaluate("() => getComputedStyle(document.getElementById('editor-area')).fontFamily")
        computed_preview = page.evaluate("() => getComputedStyle(document.getElementById('preview-area')).fontFamily")
        print(f"\nFont families:")
        print(f"  - Editor: {computed_editor[:50]}...")
        print(f"  - Preview: {computed_preview[:50]}...")

        browser.close()

        # Summary
        all_good = (
            len(console_errors) == 0 and
            has_headings > 0 and
            has_code_blocks > 0 and
            editor_visible and preview_visible
        )

        print("\n" + "="*50)
        if all_good:
            print("✓ All tests passed! Page is working correctly.")
            return 0
        else:
            print("✗ Some tests failed. Check output above.")
            return 1

if __name__ == "__main__":
    sys.exit(test_page())
