#!/usr/bin/env python3
"""Direct test of htmlToMarkdown function via Playwright."""

import sys
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'playwright'])
    subprocess.check_call([sys.executable, '-m', 'playwright', 'install', 'chromium'])
    from playwright.sync_api import sync_playwright

def test_html_to_markdown():
    html_path = Path(__file__).parent / "index.html"
    file_url = f"file:///{html_path.resolve().as_posix()}"

    tests = [
        ("Bold", "<p>Hello <b>world</b></p>"),
        ("List", "<ul><li>Item 1</li><li>Item 2</li></ul>"),
        ("Link", "<p>Visit <a href='https://test.com'>test</a></p>"),
        ("Code", "<p><code>test()</code></p><pre><code>code block</code></pre>"),
    ]

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(file_url, wait_until="networkidle")
        page.wait_for_timeout(1000)

        # Check if htmlToMarkdown exists
        func_exists = page.evaluate("() => typeof htmlToMarkdown")
        print(f"htmlToMarkdown exists: {func_exists}\n")

        for name, html in tests:
            try:
                result = page.evaluate("(html) => { return htmlToMarkdown(html); }", html)
                print(f"{name}: {repr(result)}")
            except Exception as e:
                print(f"{name}: ERROR - {e}")

        browser.close()

if __name__ == "__main__":
    test_html_to_markdown()
