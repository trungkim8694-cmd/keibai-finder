from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        page.goto("https://www.koubai.nta.go.jp/auctionx/public/hp001.php")
        print("At hp001.php")
        page.click('a.icon01_text[href="hp001_01.php?doc=1"]')
        page.wait_for_load_state('networkidle')
        print("At doc=1")
        if page.locator('a#do_search_submit').count() > 0:
            print("doc=1 Has search button")
            page.click('a#do_search_submit')
            page.wait_for_load_state('networkidle')
            print("doc=1 Submit OK")
        else:
            print("doc=1 HAS NO SEARCH BUTTON!")
            print(page.locator('body').inner_text()[:300])
    except Exception as e:
        print("doc=1 Error:", e)

    try:
        page.goto("https://www.koubai.nta.go.jp/auctionx/public/hp001.php")
        print("At hp001.php")
        page.click('a.icon01_text[href="hp001_01.php?doc=2"]')
        page.wait_for_load_state('networkidle')
        print("At doc=2")
        if page.locator('a#do_search_submit').count() > 0:
            print("doc=2 Has search button")
        else:
            print("doc=2 HAS NO SEARCH BUTTON!")
            print(page.locator('body').inner_text()[:300])
    except Exception as e:
        print("doc=2 Error:", e)
    browser.close()
