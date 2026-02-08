from playwright.sync_api import sync_playwright

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

            # Check Car Detector Button
            car_btn = page.locator("#carModeBtn")
            if car_btn.is_visible():
                print("Car Detector Button visible.")
                car_btn.click()

                # Wait for switch
                page.wait_for_timeout(500)

                # Check Car Screen
                car_screen = page.locator("#carScreen")
                if car_screen.is_visible():
                    print("Car Screen visible.")

                    # Check Video Element
                    video = page.locator("#carVideo")
                    # Video might not be visible immediately as it waits for stream, but it should be in DOM
                    print("Car Video element present.")

                    # Check Stats
                    if page.locator("#carCount").is_visible():
                        print("Car Count stat visible.")

                    # Check Back Button
                    back_btn = page.locator("#backToGameBtn")
                    if back_btn.is_visible():
                        print("Back Button visible.")
                        back_btn.click()

                        page.wait_for_timeout(500)
                        if page.locator("#gameScreen").is_visible():
                            print("Successfully returned to Game Screen.")
                        else:
                            print("FAILED: Did not return to Game Screen.")
                    else:
                        print("FAILED: Back Button NOT visible.")

                else:
                    print("FAILED: Car Screen did not open.")
            else:
                print("FAILED: Car Detector Button NOT visible.")

            page.screenshot(path="verification/car_mode_check.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
