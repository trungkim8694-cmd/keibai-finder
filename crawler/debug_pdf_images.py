"""
Debug v2: Dùng đúng flow scraper để download PDF từ BIT và phân tích ảnh
"""
import os, sys, fitz
from PIL import Image, ImageStat
import io
from playwright.sync_api import sync_playwright

sys.path.insert(0, '../crawler')

SAVE_DEBUG_DIR = "/tmp/bit_debug"
TARGET_ID = "00000025269"
os.makedirs(SAVE_DEBUG_DIR, exist_ok=True)

def analyze_pdf(pdf_path):
    print(f"\n{'='*60}")
    print(f"Phân tích PDF: {os.path.basename(pdf_path)}")
    doc = fitz.open(pdf_path)
    print(f"Tổng số trang: {len(doc)}")
    
    total_xobjects = 0
    for page_idx in range(min(20, len(doc))):
        page = doc[page_idx]
        images = page.get_images(full=True)
        total_xobjects += len(images)
        
        if images:
            print(f"\n  [Page {page_idx}] {len(images)} image XObjects:")
            for img_idx, img in enumerate(images):
                try:
                    base = doc.extract_image(img[0])
                    w, h = base['width'], base['height']
                    size_kb = len(base['image']) // 1024
                    ext = base.get('ext', '?')
                    
                    pil = Image.open(io.BytesIO(base['image']))
                    if pil.mode != 'RGB': pil = pil.convert('RGB')
                    stat = ImageStat.Stat(pil)
                    brightness = sum(stat.mean) / 3.0
                    std_dev = sum(stat.stddev) / 3.0
                    
                    sample = pil.resize((80, 80))
                    pixels = list(sample.getdata())
                    colorful = sum(1 for r,g,b in pixels if max(r,g,b) - min(r,g,b) > 20)
                    colorful_ratio = colorful / len(pixels)
                    
                    print(f"    img[{img_idx}] {w}x{h} {size_kb}KB ext={ext} | bright={brightness:.0f} colorful={colorful_ratio:.3f}")
                    
                    # Save for visual inspection
                    out = os.path.join(SAVE_DEBUG_DIR, f"xobj_p{page_idx}_i{img_idx}.{ext}")
                    with open(out, 'wb') as f:
                        f.write(base['image'])
                        
                except Exception as e:
                    print(f"    img[{img_idx}] ERROR: {e}")
    
    if total_xobjects == 0:
        print(f"\n⚠️  KHÔNG có image XObject nào trong {len(doc)} trang!")
        print("   → Ảnh có thể là 'inline image' hoặc 'soft-mask'. Thử render từng trang...")
        
        for page_idx in range(min(20, len(doc))):
            page = doc[page_idx]
            mat = fitz.Matrix(2, 2)
            pix = page.get_pixmap(matrix=mat)
            img_data = pix.tobytes("png")
            
            pil = Image.open(io.BytesIO(img_data))
            if pil.mode != 'RGB': pil = pil.convert('RGB')
            stat = ImageStat.Stat(pil)
            brightness = sum(stat.mean) / 3.0
            
            sample = pil.resize((80, 80))
            pixels = list(sample.getdata())
            colorful = sum(1 for r,g,b in pixels if max(r,g,b) - min(r,g,b) > 20)
            colorful_ratio = colorful / len(pixels)
            
            render_path = os.path.join(SAVE_DEBUG_DIR, f"render_p{page_idx:02d}.jpg")
            pil.save(render_path, "JPEG", quality=75)
            print(f"  Page {page_idx:2d}: {pix.width}x{pix.height} | bright={brightness:.0f} colorful={colorful_ratio:.3f}")
    
    print(f"\nTotal XObjects: {total_xobjects}")
    doc.close()


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    
    print("Navigating to BIT listing page...")
    page.goto("https://www.bit.courts.go.jp/app/datalist/index")
    page.wait_for_load_state('networkidle')
    
    # Go directly to detail page via URL pattern
    print(f"Going to detail: {TARGET_ID}")
    page.goto(f"https://www.bit.courts.go.jp/app/datalist/detail/index?id={TARGET_ID}")
    page.wait_for_load_state('networkidle')
    
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(page.content(), 'html.parser')
    
    # Find 3点セット PDF link - exact same way as scrape_detail_to_db.py
    three_set_a = soup.find(id='threeSetPDF')
    print(f"3点セット button found: {three_set_a is not None}")
    if three_set_a:
        print(f"  href={three_set_a.get('href','N/A')}")
        print(f"  onclick={three_set_a.get('onclick','N/A')}")
    
    # Check all download links
    print("\nAll PDF links found:")
    for a in soup.find_all('a', href=True):
        if 'pdf' in a.get('href','').lower() or 'pdf' in str(a).lower()[:100]:
            print(f"  id={a.get('id','?')} href={a['href'][:80]}")
    
    # Try clicking the 3点セット button and intercept download
    print("\nAttempting to get PDF via popup click...")
    
    # Setup download interception
    pdf_path_final = f"/tmp/{TARGET_ID}_debug.pdf"
    
    with context.expect_page() as new_page_info:
        try:
            page.click('#threeSetPDF', timeout=3000)
        except:
            print("Click failed, trying alternative...")
    
    try:
        new_pg = new_page_info.value
        new_pg.wait_for_load_state()
        pdf_url = new_pg.url
        print(f"PDF URL: {pdf_url}")
        
        import requests
        resp = requests.get(pdf_url, timeout=30)
        with open(pdf_path_final, 'wb') as f:
            f.write(resp.content)
        print(f"Downloaded: {len(resp.content)//1024}KB")
        new_pg.close()
        
        analyze_pdf(pdf_path_final)
    except Exception as e:
        print(f"Error: {e}")
        
        # Fallback: try getting PDF via requests with session cookies
        cookies = context.cookies()
        cookie_str = '; '.join([f"{c['name']}={c['value']}" for c in cookies])
        
        # Try common BIT PDF URL patterns
        import requests
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Cookie': cookie_str,
            'Referer': f'https://www.bit.courts.go.jp/app/datalist/detail/index?id={TARGET_ID}'
        })
        
        pdf_urls_to_try = [
            f"https://www.bit.courts.go.jp/app/datalist/pdfdownload/index?id={TARGET_ID}&type=3set",
            f"https://www.bit.courts.go.jp/app/pdf/3set/{TARGET_ID}.pdf",
        ]
        for pdf_url in pdf_urls_to_try:
            try:
                r = session.get(pdf_url, timeout=15)
                if r.status_code == 200 and b'%PDF' in r.content[:10]:
                    with open(pdf_path_final, 'wb') as f:
                        f.write(r.content)
                    print(f"Got PDF from {pdf_url}")
                    analyze_pdf(pdf_path_final)
                    break
            except Exception as e2:
                print(f"  {pdf_url} → {e2}")
    
    browser.close()

print(f"\n✅ Debug files: {SAVE_DEBUG_DIR}")
print(f"Run: open {SAVE_DEBUG_DIR}")
