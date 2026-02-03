from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            page.goto("http://localhost:8080/index.html")

            # Simulate authentication success
            page.evaluate("document.getElementById('faceAuthScreen').style.display = 'none';")
            page.evaluate("document.getElementById('gameScreen').style.display = 'block';")

            # Now check elements
            high_score = page.locator("#highScore")
            if high_score.is_visible():
                print("High Score element visible.")
            else:
                print("High Score element NOT visible.")

            timer = page.locator("#timer")
            if timer.is_visible():
                print("Timer element visible.")
            else:
                print("Timer element NOT visible.")

            # Check for Game Over Modal (hidden)
            modal = page.locator("#gameOverModal")
            if modal.count() > 0:
                print("Game Over Modal present.")

            # Trigger Game Over manually to check modal
            page.evaluate("document.getElementById('gameOverModal').style.display = 'flex';")
            page.screenshot(path="verification/ui_check.png")
            print("Screenshot taken.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
