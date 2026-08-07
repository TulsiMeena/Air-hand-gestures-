import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1280, 'height': 1080})
        await page.goto('http://localhost:8080')
        await page.wait_for_timeout(1000)

        # Make the install button visible (it's hidden by default until beforeinstallprompt)
        await page.evaluate('document.querySelectorAll(".install-btn").forEach(btn => btn.style.display = "inline-block")')
        await page.screenshot(path='verification/pwa_auth_full.png', full_page=True)

        # Switch to game screen
        await page.evaluate('document.getElementById("faceAuthScreen").style.display = "none"')
        await page.wait_for_timeout(1000)

        await page.screenshot(path='verification/pwa_game_full.png', full_page=True)
        await browser.close()

asyncio.run(main())
