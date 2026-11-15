import asyncio
import os
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

async def inspect_bit_form():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        print("Navigating to BIT...")
        await page.goto("https://www.bit.courts.go.jp/app/top/pt001/h01")
        await page.wait_for_load_state('domcontentloaded')
        await page.wait_for_function('typeof tranArea !== "undefined"', timeout=15000)
        
        async with page.expect_navigation():
            await page.evaluate("tranArea('result','');")
        async with page.expect_navigation():
            await page.evaluate("transProperty('01');")
            
        print("Calling showSearchCondition...")
        await page.evaluate("showSearchCondition('91', '1', 'sapporo');")
        await page.wait_for_timeout(3000)
        
        html = await page.content()
        soup = BeautifulSoup(html, 'html.parser')
        
        # Look for select tags, form inputs, buttons
        selects = soup.find_all('select')
        print(f"Found {len(selects)} select elements:")
        for s in selects:
            print(f"  Select id={s.get('id')} name={s.get('name')}")
            for opt in s.find_all('option'):
                print(f"    Option value='{opt.get('value')}': {opt.get_text(strip=True)}")
                
        buttons = soup.find_all(['button', 'input', 'a'], class_=lambda c: c and ('btn' in c or 'button' in c))
        print(f"Found {len(buttons)} button elements:")
        for b in buttons[:10]:
            print(f"  Tag={b.name} id={b.get('id')} text={b.get_text(strip=True)} onclick={b.get('onclick')}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(inspect_bit_form())
