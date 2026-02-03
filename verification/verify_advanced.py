from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:8080/index.html")

            # Manually trigger Game instantiation if not already there
            page.evaluate("""
                if (!window.gameInstance) {
                    document.getElementById('faceAuthScreen').style.display = 'none';
                    document.getElementById('gameScreen').style.display = 'block';
                    window.gameInstance = new AdvancedGestureGame();
                }
            """)

            # Check Settings Button
            settings_btn = page.locator("#settingsBtn")
            if settings_btn.is_visible():
                print("Settings Button visible.")
                settings_btn.click()

                # Wait for modal animation
                page.wait_for_timeout(1000)

                # Check Modal
                modal = page.locator("#settingsModal")
                if modal.is_visible():
                    print("Settings Modal opened successfully.")

                    # Check Voice Select
                    if page.locator("#voiceSelect").is_visible():
                        print("Voice Selector present.")

                    # Check Hand Style Select
                    if page.locator("#handStyleSelect").is_visible():
                        print("Hand Style Selector present.")

                    # Test Style Selection
                    page.select_option("#handStyleSelect", "cyber")
                    print("Selected Cyber style.")

                else:
                    print("FAILED: Settings Modal did not open.")
            else:
                print("FAILED: Settings Button NOT visible.")

            page.screenshot(path="verification/advanced_features_check.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
