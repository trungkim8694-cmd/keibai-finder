import asyncio
import os
import re
import json
import psycopg2
import requests
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from dotenv import load_dotenv
import traceback

PDF_DIR = "/Users/kimtrung/keibai-finder/web/public/pdfs"
os.makedirs(PDF_DIR, exist_ok=True)
load_dotenv("/Users/kimtrung/keibai-finder/web/.env")

db_url = os.environ.get("DATABASE_URL").replace("?schema=public", "")
gemini_key = os.environ.get("GEMINI_API_KEY")

def update_db_retry(sale_unit_id, pdf_url, raw_data, pdf_images, thumbnail_url):
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    raw_data_json = json.dumps(raw_data, ensure_ascii=False)
    query = """UPDATE "Property" SET pdf_url=%s, raw_display_data=%s::jsonb, images=%s, "thumbnailUrl"=COALESCE(%s, "thumbnailUrl"), updated_at=NOW() WHERE sale_unit_id = %s"""
    cur.execute(query, (pdf_url, raw_data_json, pdf_images, thumbnail_url, sale_unit_id))
    conn.commit()
    cur.close()
    conn.close()

async def retry_missing():
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    # Find properties where raw_display_data is empty or length 0
    cur.execute('SELECT sale_unit_id FROM "Property" WHERE raw_display_data IS NULL OR jsonb_array_length(raw_display_data::jsonb) = 0')
    missing_ids = [r[0] for r in cur.fetchall()]
    cur.close()
    conn.close()
    
    if not missing_ids:
        print("No missing raw_display_data records found.")
        return
        
    print(f"Found {len(missing_ids)} records to retry: {missing_ids}")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(locale="ja-JP", accept_downloads=True)
        page = await context.new_page()

        print("Navigating to BIT...")
        await page.goto("https://www.bit.courts.go.jp/app/top/pt001/h01", timeout=30000)
        await page.locator("a:has-text('北海道')").first.wait_for(state="attached", timeout=15000)
        await page.evaluate("tranAreaMap('01','property');")
        await page.locator("h1:has-text('北海道の物件を検索する')").wait_for(state="attached", timeout=15000)
        await asyncio.sleep(2)
        await page.evaluate("showSearchCondition('91', '2', 'sapporo');")
        await page.locator("#otherMunicipalityIdArea input[type='checkbox']").first.wait_for(state="attached", timeout=15000)
        await asyncio.sleep(1)
        await page.evaluate("document.getElementById('btnAllPlaceOn1').click();")
        async with page.expect_navigation():
            await page.evaluate("tranResultSearch('2');")

        for sale_unit_id in missing_ids:
            print(f"Retrying property {sale_unit_id}...")
            try:
                # We inject the generic parameters for Sapporo court and add a dummy event to prevent TypeError.
                script = f"window.event = {{preventDefault: function(){{}}, stopPropagation: function(){{}}}}; try {{ tranPropertyDetail('{sale_unit_id}', 'O3_01_01_02_02', '0100010001', 'sapporo', '1'); }} catch (e) {{ console.log(e); }}"
                async with context.expect_page(timeout=15000) as new_page_info:
                    await page.evaluate(script)
                new_page = await new_page_info.value
                await new_page.wait_for_load_state()
                detail_html = await new_page.content()
                soup = BeautifulSoup(detail_html, 'html.parser')

                raw_data = []
                summary_data = {}
                summary_images = []
                
                price_cont = soup.select_one('.bit__syousai_text_kakaku_container')
                if price_cont:
                    base_price = price_cont.select_one('.bit__syousai_text_kakaku')
                    if base_price:
                        summary_data["売却基準価額"] = base_price.get_text(strip=True)
                    for p_tag in price_cont.select('p.bit__text_small'):
                        val_p = p_tag.find_next_sibling('p')
                        if val_p:
                            summary_data[p_tag.get_text(strip=True)] = val_p.get_text(strip=True)
                            
                for img in soup.select('img.bit__image'):
                    src = img.get('src')
                    if src:
                        if src.startswith('/'): src = "https://www.bit.courts.go.jp" + src
                        summary_images.append(src)

                div_tables = soup.select('div.table')
                for idx, dt in enumerate(div_tables):
                    parent_fc = dt.find_parent('div', class_='form-contents')
                    heading = ""
                    if parent_fc:
                        p_title = parent_fc.find('p', class_='bit__text_big')
                        if p_title: heading = p_title.get_text(strip=True)
                    if not heading:
                        prev_header = dt.find_previous(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
                        heading = prev_header.get_text(strip=True) if prev_header else f'Section {idx}'
                    
                    ths = dt.select('div[class*="_th"]')
                    tds = dt.select('div[class*="_td"]')
                    is_summary = ("期間入札" in heading or "入札" in heading or "Section" in heading)
                    
                    if is_summary:
                        for k in range(len(ths)):
                            key = ths[k].get_text(strip=True)
                            if key: summary_data[key] = tds[k].get_text(separator=" ", strip=True) if k < len(tds) else ''
                    else:
                        asset_type = "Unknown"
                        if "土地" in heading: asset_type = "土地"
                        elif "建物" in heading: asset_type = "建物"
                        data_dict = {}
                        for k in range(len(ths)):
                            key = ths[k].get_text(strip=True)
                            if key: data_dict[key] = tds[k].get_text(separator=" ", strip=True) if k < len(tds) else ''
                                
                        images = []
                        context_node = dt.find_parent('div', class_='mb-3') or parent_fc
                        if context_node:
                            for img in context_node.find_all('img'):
                                src = img.get('src')
                                if not src or "icon" in src.lower() or "logo" in src.lower(): continue
                                if src.startswith('/'): src = "https://www.bit.courts.go.jp" + src
                                elif src.startswith('.'): src = "https://www.bit.courts.go.jp" + src.replace('../', '/')
                                images.append(src)
                        
                        if data_dict or images:
                            raw_data.append({"asset_title": heading, "asset_type": asset_type, "data": data_dict, "images": images})

                if summary_data or summary_images:
                    raw_data.insert(0, {"asset_title": "Summary", "asset_type": "Summary", "data": summary_data, "images": summary_images})
                
                if len(raw_data) == 0:
                     print(f"  Warning: No data table found for {sale_unit_id}. Possibly invalid property ID.")
                     await new_page.close()
                     continue

                pdf_url = None
                pdf_link = soup.select_one('#threeSetPDF, a:contains("3点セットダウンロード")')
                if pdf_link:
                    pdf_action = pdf_link.get('onclick') or pdf_link.get('href')
                    if pdf_action:
                        m = re.search(r"'(.*?pdf)'", str(pdf_action))
                        if m:
                            pdf_path = m.group(1)
                            if pdf_path.startswith('/'): pdf_url = "https://www.bit.courts.go.jp" + pdf_path
                            elif pdf_path.startswith('.'): pdf_url = "https://www.bit.courts.go.jp" + pdf_path.replace('../', '/')
                            else: pdf_url = "https://www.bit.courts.go.jp/app/top/pt001/" + pdf_path

                pdf_images = []
                if pdf_url:
                    try:
                        import fitz
                        print(f"  Detected PDF, downloading...")
                        async with new_page.expect_download(timeout=30000) as download_info:
                            await new_page.evaluate("document.getElementById('threeSetPDF').click();")
                        download = await download_info.value
                        pdf_path_full = os.path.join(PDF_DIR, f"{sale_unit_id}.pdf")
                        await download.save_as(pdf_path_full)
                        
                        try:
                            doc = fitz.open(pdf_path_full)
                            prop_img_dir = f"/Users/kimtrung/keibai-finder/web/public/property_images/{sale_unit_id}"
                            os.makedirs(prop_img_dir, exist_ok=True)
                            
                            for page_idx in range(len(doc)):
                                page = doc[page_idx]
                                image_list = page.get_images(full=True)
                                for img_idx, img in enumerate(image_list):
                                    base_image = doc.extract_image(img[0])
                                    image_bytes = base_image["image"]
                                    
                                    bpc = base_image.get("bpc", 8)
                                    cs = base_image.get("colorspace", 3)
                                    ext = base_image.get("ext", "").lower()
                                    is_photo = (bpc > 1 and cs >= 3) or ext in ['jpeg', 'jpg']
                                    
                                    if is_photo and (len(image_bytes) > 50 * 1024 or (base_image["width"] > 300 and base_image["height"] > 300)):
                                        image_filename = f"{sale_unit_id}_p{page_idx}_i{img_idx}.{ext}"
                                        with open(os.path.join(prop_img_dir, image_filename), "wb") as f:
                                            f.write(image_bytes)
                                        pdf_images.append(f"/property_images/{sale_unit_id}/{image_filename}")
                            doc.close()
                        except Exception as e:
                            print(f"  PDF extraction failed: {e}")
                    except Exception as e:
                        print(f"  PDF download failed: {e}")
                
                thumbnail_url = summary_images[0] if summary_images else (pdf_images[0] if pdf_images else None)
                update_db_retry(sale_unit_id, pdf_url, raw_data, pdf_images, thumbnail_url)
                print(f"  Successfully recovered {sale_unit_id}.")
                await new_page.close()

            except Exception as e:
                print(f"  ERROR processing {sale_unit_id}: {e}\n{traceback.format_exc()}")
                try:
                    await new_page.close()
                except:
                    pass
                continue

        await browser.close()
        print("Retry script finished.")

if __name__ == "__main__":
    asyncio.run(retry_missing())
