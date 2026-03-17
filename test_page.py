#!/usr/bin/env python3
"""
Playwright Test Script for Markdown Converter
Tests the index.html file using Playwright
"""

import asyncio
from pathlib import Path
from playwright.async_api import async_playwright, Error as PlaywrightError

async def test_markdown_converter():
    """Test the markdown converter HTML file"""

    # Get the absolute path to the HTML file
    html_file = Path(r"c:\Users\Admin\Documents\Full-Stack-Development\Website for Companies\MarkdownConverter\index.html")

    if not html_file.exists():
        print(f"ERROR: HTML file not found at {html_file}")
        return

    file_url = f"file:///{html_file.as_posix()}"
    screenshot_path = html_file.parent / "markdown-converter-screenshot.png"

    print(f"Testing: {html_file.name}")
    print(f"File URL: {file_url}")
    print(f"Expected screenshot: {screenshot_path}")
    print("-" * 60)

    findings = {
        "console_errors": [],
        "page_loaded": False,
        "editor_exists": False,
        "preview_exists": False,
        "side_by_side": False,
        "markdown_rendered": False,
        "screenshot_taken": False,
        "screenshot_path": str(screenshot_path)
    }

    try:
        async with async_playwright() as p:
            # Launch Chromium in headless mode
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            page = await context.new_page()

            # Listen for console messages
            console_messages = []
            page.on("console", lambda msg: console_messages.append({
                "type": msg.type,
                "text": msg.text,
                "location": f"{msg.location.get('url', '')}:{msg.location.get('lineNumber', '')}"
            }))

            # Listen for page errors
            page.on("pageerror", lambda error: console_messages.append({
                "type": "error",
                "text": str(error),
                "location": "pageerror"
            }))

            print(f"Navigating to {file_url}...")

            # Navigate to the local HTML file
            try:
                response = await page.goto(file_url, wait_until="networkidle", timeout=30000)
                findings["page_loaded"] = response is not None and response.ok
                print(f"Page loaded: {findings['page_loaded']}")
            except PlaywrightError as e:
                print(f"Failed to load page: {e}")
                findings["page_loaded"] = False

            # Wait a bit for JavaScript to execute and content to render
            await page.wait_for_timeout(2000)

            # Check for console errors
            errors = [msg for msg in console_messages if msg["type"] in ["error", "warning"]]
            findings["console_errors"] = errors

            if errors:
                print("\nConsole messages found:")
                for err in errors:
                    print(f"  [{err['type']}] {err['text']}")
                    if err.get('location'):
                        print(f"    Location: {err['location']}")
            else:
                print("\nNo console errors detected")

            # Check if editor exists (textarea with id="editor-area")
            editor_element = await page.query_selector("#editor-area")
            findings["editor_exists"] = editor_element is not None
            print(f"Editor element found: {findings['editor_exists']}")

            # Check if preview area exists (div with id="preview-area")
            preview_element = await page.query_selector("#preview-area")
            findings["preview_exists"] = preview_element is not None
            print(f"Preview area found: {findings['preview_exists']}")

            # Check if editor and preview are side by side (flex layout)
            if findings["editor_exists"] and findings["preview_exists"]:
                # Get layout information
                main_container = await page.query_selector("main")
                if main_container:
                    display = await main_container.evaluate("el => getComputedStyle(el).display")
                    flex_direction = await main_container.evaluate("el => getComputedStyle(el).flexDirection")
                    findings["side_by_side"] = display == "flex" and flex_direction == "row"
                    print(f"Layout - Display: {display}, Flex Direction: {flex_direction}")
                    print(f"Editor and preview are side by side: {findings['side_by_side']}")
                else:
                    print("WARNING: Could not find main container")

            # Check if markdown is rendering correctly
            if findings["preview_exists"]:
                # Check if preview area has content (beyond the placeholder)
                preview_content = await page.evaluate("document.getElementById('preview-area').innerText")
                findings["markdown_rendered"] = (
                    preview_content is not None
                    and len(preview_content.strip()) > 0
                    and "Preview will appear here" not in preview_content
                )
                print(f"Markdown rendered: {findings['markdown_rendered']}")
                if findings["markdown_rendered"]:
                    print(f"Preview content preview: {preview_content[:100]}...")

            # Take screenshot
            try:
                await page.screenshot(path=screenshot_path, full_page=True, timeout=10000)
                findings["screenshot_taken"] = True
                print(f"\nScreenshot saved to: {screenshot_path}")
            except Exception as e:
                print(f"Failed to take screenshot: {e}")
                findings["screenshot_taken"] = False

            await browser.close()

    except Exception as e:
        print(f"ERROR: Test failed with exception: {e}")
        import traceback
        traceback.print_exc()

    # Print summary
    print("\n" + "=" * 60)
    print("FINDINGS SUMMARY")
    print("=" * 60)
    print(f"1. Console errors: {'YES - ' + str(len(findings['console_errors'])) + ' errors' if findings['console_errors'] else 'NO'}")
    print(f"2. Page loaded successfully: {'YES' if findings['page_loaded'] else 'NO'}")
    print(f"3. Preview pane displays: {'YES' if findings['preview_exists'] else 'NO'}")
    print(f"4. Editor and preview side by side: {'YES' if findings['side_by_side'] else 'NO'}")
    print(f"5. Markdown rendering correctly: {'YES' if findings['markdown_rendered'] else 'NO'}")
    print(f"6. Screenshot taken: {'YES' if findings['screenshot_taken'] else 'NO'}")

    if findings['console_errors']:
        print("\nConsole Errors Detail:")
        for i, err in enumerate(findings['console_errors'], 1):
            print(f"  {i}. [{err['type']}] {err['text']}")

    print(f"\nScreenshot saved at: {findings['screenshot_path'] if findings['screenshot_taken'] else 'N/A'}")
    print("=" * 60)

    return findings

if __name__ == "__main__":
    try:
        results = asyncio.run(test_markdown_converter())
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"Fatal error: {e}")
        import traceback
        traceback.print_exc()
