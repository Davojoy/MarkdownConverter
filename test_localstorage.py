#!/usr/bin/env python3
"""
Test script to verify localStorage functionality in the Markdown Converter.
This uses Playwright to automate browser testing.
"""

import subprocess
import sys
import time

def check_playwright_installed():
    """Check if playwright is installed."""
    try:
        import playwright.sync_api
        return True
    except ImportError:
        return False

def install_playwright():
    """Install playwright and browsers."""
    print("Installing Playwright...")
    subprocess.run([sys.executable, "-m", "pip", "install", "playwright"], check=True)
    subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=True)

def test_localstorage():
    """Test localStorage functionality."""
    from playwright.sync_api import sync_playwright

    print("\n" + "="*60)
    print("Testing localStorage functionality...")
    print("="*60 + "\n")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Get the absolute file path
        import os
        file_path = os.path.abspath("index.html")

        # Navigate to the local HTML file
        page.goto(f"file:///{file_path}")

        # Test 1: Verify default content loads
        print("Test 1: Checking if default content is loaded...")
        editor_content = page.evaluate("() => document.getElementById('editor-area').value")
        if "Tech-MD Studio" in editor_content:
            print("[PASS] Default content loaded successfully")
        else:
            print("[FAIL] Default content NOT found")
            return False

        # Test 2: Type something and verify it saves to localStorage
        print("\nTest 2: Typing new content and checking localStorage...")
        test_text = "# TEST CONTENT\n\nThis is a test to verify localStorage works."
        page.evaluate(f"() => document.getElementById('editor-area').value = `{test_text}`")
        page.evaluate("() => document.getElementById('editor-area').dispatchEvent(new Event('input'))")

        # Give it a moment to save
        time.sleep(0.5)

        # Check localStorage
        saved_content = page.evaluate("() => localStorage.getItem('tm_saved_draft')")
        if test_text in saved_content:
            print("[PASS] Content saved to localStorage")
        else:
            print("[FAIL] Content NOT saved to localStorage")
            return False

        # Test 3: Reload page and verify content persists
        print("\nTest 3: Reloading page to verify persistence...")
        page.reload()
        time.sleep(1)

        editor_content_after_reload = page.evaluate("() => document.getElementById('editor-area').value")
        if test_text in editor_content_after_reload:
            print("[PASS] Content persisted after reload")
        else:
            print("[FAIL] Content did NOT persist after reload")
            print(f"Expected: {test_text[:50]}...")
            print(f"Got: {editor_content_after_reload[:50]}...")
            return False

        # Test 4: Clear localStorage and verify
        print("\nTest 4: Testing clear functionality...")
        page.evaluate("() => localStorage.removeItem('tm_saved_draft')")
        page.reload()
        time.sleep(1)

        editor_after_clear = page.evaluate("() => document.getElementById('editor-area').value")
        if "Tech-MD Studio" in editor_after_clear and test_text not in editor_after_clear:
            print("[PASS] Clear works correctly")
        else:
            print("[FAIL] Clear did NOT work correctly")
            return False

        browser.close()

        print("\n" + "="*60)
        print("ALL TESTS PASSED!")
        print("="*60 + "\n")
        return True

def main():
    print("\nLocalStorage Test Suite")
    print("----------------------")

    if not check_playwright_installed():
        print("Playwright not installed.")
        response = input("Would you like to install it now? (y/n): ")
        if response.lower() == 'y':
            install_playwright()
        else:
            print("\nPlease install manually: pip install playwright && playwright install chromium")
            return

    try:
        success = test_localstorage()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n[ERROR] Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
