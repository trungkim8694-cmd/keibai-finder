from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("https://www.koubai.nta.go.jp/auctionx/public/hp001.php")
    links = page.locator('a[href*="hp001_01.php"]').all_inner_texts()
    hrefs = page.evaluate("Array.from(document.querySelectorAll('a[href*=\"hp001_01.php\"]')).map(a => a.href)")
    
    print("Available links:")
    for t, h in zip(links, hrefs):
        print(f"Text: '{t}' -> Href: '{h}'")
    browser.close()
