import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("https://www.bit.courts.go.jp/app/top/pt001/h01")
        # Click on Tohoku map or something, or we can just use the page.goto to the property if it allows it? Actually it needs session.
        # We can just run advanced crawler on ONE property and print the HTML!
        await browser.close()
asyncio.run(run())
