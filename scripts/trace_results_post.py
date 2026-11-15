import asyncio
from playwright.async_api import async_playwright

async def trace():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        async def on_request(request):
            if 'h03' in request.url or 'h08' in request.url:
                print('Intercepted URL:', request.url)
                print('Post data:', request.post_data)
                
        page.on('request', on_request)
        
        await page.goto('https://www.bit.courts.go.jp/app/top/pt001/h01')
        await page.wait_for_timeout(1000)
        async with page.expect_navigation():
            await page.evaluate("tranArea('result','');")
        async with page.expect_navigation():
            await page.evaluate("transProperty('01');")
        async with page.expect_navigation():
            await page.evaluate("showSearchCondition('91', '1', 'sapporo');")
        await page.wait_for_timeout(2000)
        async with page.expect_navigation():
            await page.evaluate("submitAllPeroidForm();")
        print('Page title after submit:', await page.title())
        await browser.close()

asyncio.run(trace())
