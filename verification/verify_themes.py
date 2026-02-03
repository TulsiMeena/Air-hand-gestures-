from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:8080/index.html")

            # Make sure game screen is visible
            page.evaluate("document.getElementById('faceAuthScreen').style.display = 'none';")
            page.evaluate("document.getElementById('gameScreen').style.display = 'block';")

            # Switch to Nature Theme
            page.select_option("#themeSelect", "theme-nature")

            # Check body class
            body_class = page.evaluate("document.body.className")
            if "theme-nature" in body_class:
                print("Theme switching works: theme-nature applied.")
            else:
                print(f"Theme switching FAILED. Body class: {body_class}")

            # Check for Magic Gesture Button
            magic_btn = page.locator("#recordGestureBtn")
            if magic_btn.is_visible():
                print("Magic Gesture Button visible.")
            else:
                print("Magic Gesture Button NOT visible.")

            page.screenshot(path="verification/theme_check.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
