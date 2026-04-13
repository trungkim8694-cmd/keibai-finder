import asyncio
import os
import re
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeoutError

DUMP_DIR = "../.antigravity/research"
os.makedirs(DUMP_DIR, exist_ok=True)

async def main():
    print("Khởi động Playwright POC Crawler (Không dùng networkidle)...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            locale="ja-JP"
        )
        page = await context.new_page()

        try:
            print("1. Đang truy cập trang chủ BIT...")
            await page.goto("https://www.bit.courts.go.jp/app/top/pt001/h01", timeout=30000)
            
            # Đợi load xong giao diện cơ bản
            await page.locator("a:has-text('北海道')").first.wait_for(state="attached", timeout=15000)

            print("2. Bypass Click: Inject hàm JavaScript tranAreaMap('01','property') để chọn Hokkaido...")
            await asyncio.sleep(2)
            await page.evaluate("tranAreaMap('01','property');")
            
            print("3. Đang chờ chuyển tới trang Bộ lọc tìm kiếm Hokkaido...")
            # Chờ tiêu đề "北海道の物件を検索する" xuất hiện để chắc chắn đã sang trang
            await page.locator("h1:has-text('北海道の物件を検索する')").wait_for(state="attached", timeout=15000)
            
            print("4. Gọi showSearchCondition để lấy dữ liệu cấp Tòa Án (Sapporo - 91)...")
            await asyncio.sleep(2)
            await page.evaluate("showSearchCondition('91', '2', 'sapporo');")
            
            print("  Đang chờ tải danh sách Thành Phố (Municipalities)...")
            # Chờ các checkbox hiện lên trong otherMunicipalityIdArea
            await page.locator("#otherMunicipalityIdArea input[type='checkbox']").first.wait_for(state="attached", timeout=15000)
            
            print("5. Nhấn nút Chọn tất cả Thành phố...")
            await asyncio.sleep(1)
            await page.evaluate("document.getElementById('btnAllPlaceOn1').click();")
            
            print("6. Thực hiện lệnh Tìm Kiếm tranResultSearch('2')...")
            await asyncio.sleep(1)
            await page.evaluate("tranResultSearch('2');")
            
            print("7. Chờ DOM danh sách tài sản phản hồi...")
            detail_link_locator = page.locator("a[onclick*='tranPropertyDetail']")
            await detail_link_locator.first.wait_for(state="attached", timeout=15000)
            
            list_html = await page.content()
            with open(os.path.join(DUMP_DIR, "property_list_dump.html"), "w", encoding="utf-8") as f:
                f.write(list_html)
            print("  --> Đã lưu kết quả Danh sách vào property_list_dump.html")

            onclick_value = await detail_link_locator.first.get_attribute("onclick")
            match = re.search(r"tranPropertyDetail\([\"']([^\"']+)[\"'],\s*[\"']([^\"']+)[\"']", onclick_value)
            if match:
                sale_unit_id = match.group(1)
                court_id = match.group(2)
                print(f"8. Lấy được Sale_Unit_ID = {sale_unit_id}, Court_ID = {court_id}. Thực hiện Click để vào trang chi tiết...")
                await asyncio.sleep(2)
                await detail_link_locator.first.click()
                
                print("  Đang chờ tải trang Chi tiết tài sản...")
                await asyncio.sleep(5) # Trừ hao thời gian tải chi tiết
                
                detail_html = await page.content()
                with open(os.path.join(DUMP_DIR, "property_detail_dump.html"), "w", encoding="utf-8") as f:
                    f.write(detail_html)
                print("  --> BINGO! Đã dump được mã nguồn cho property_detail_dump.html.")
            else:
                print(" Không trích xuất được tham số ID.")

        except PlaywrightTimeoutError as e:
            print(f"❌ Xảy ra Timeout: {e}")
            dump = await page.content()
            with open(os.path.join(DUMP_DIR, "timeout_snapshot.html"), "w", encoding="utf-8") as f:
                f.write(dump)
            print("  --> Đã lưu timeout_snapshot.html cho việc debug UI trạng thái lỗi.")
        except Exception as e:
            print(f"❌ Lỗi Crawler: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
