import requests
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "Mozilla/5.0"}
for u in [
    "https://lfb.mof.go.jp/kantou/content/pagekt_cnt_20260909001.html",
    "https://lfb.mof.go.jp/hokkaido/kokuyuu/pagehkhp017000068.html",
    "https://lfb.mof.go.jp/fukuoka/html/kokuyubaikyaku/index.html",
]:
    r = requests.get(u, headers=HEADERS, timeout=15)
    r.encoding = r.apparent_encoding
    soup = BeautifulSoup(r.text, "html.parser")
    pdfs = [(a.get_text(" ", strip=True), a["href"]) for a in soup.find_all("a", href=True) if ".pdf" in a["href"].lower()]
    print(u, "-> PDFs:", len(pdfs), "sample:", pdfs[:4])
