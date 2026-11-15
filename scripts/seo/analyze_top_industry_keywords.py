import os
import sys
import json
import psycopg2
from dotenv import load_dotenv

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv(r'c:\dev\keibaiKoubai\web\.env')
DATABASE_URL = os.environ.get("DATABASE_URL")

# Đọc danh mục từ khóa từ web/src/lib/keibaiTrendEngine.ts
ts_file = r'c:\dev\keibaiKoubai\web\src\lib\keibaiTrendEngine.ts'
with open(ts_file, 'r', encoding='utf-8') as f:
    ts_content = f.read()

import re
# Trích xuất các objects trong KEIBAI_TREND_DATABASE
items = re.findall(r'{\s*id:\s*[\'"]([^\'"]+)[\'"],\s*keyword:\s*[\'"]([^\'"]+)[\'"],\s*category:\s*[\'"]([^\'"]+)[\'"],\s*categoryLabel:\s*[\'"]([^\'"]+)[\'"],\s*monthlySearchVolume:\s*(\d+),\s*growthMoM:\s*([\d\.]+),\s*trendLevel:\s*[\'"]([^\'"]+)[\'"],\s*difficulty:\s*(\d+),\s*cpcYen:\s*(\d+),\s*intent:\s*[\'"]([^\'"]+)[\'"],', ts_content)

print(f"Tổng số từ khóa trong cơ sở dữ liệu xu hướng: {len(items)}")

records = []
for it in items:
    records.append({
        "id": it[0],
        "keyword": it[1],
        "category": it[2],
        "category_label": it[3],
        "volume": int(it[4]),
        "growth": float(it[5]),
        "level": it[6],
        "difficulty": int(it[7]),
        "cpc": int(it[8]),
        "intent": it[9]
    })

# Sắp xếp theo Volume giảm dần
by_volume = sorted(records, key=lambda x: x["volume"], reverse=True)
print("\n=== TOP 10 TỪ KHÓA CÓ SEARCH VOLUME LỚN NHẤT NGÀNH BĐS ĐẤU GIÁ ===")
for r in by_volume:
    print(f"• 「{r['keyword']}」 | Volume: {r['volume']:,}/tháng | Growth: +{r['growth']}% | Intent: {r['intent']} | Độ khó: {r['difficulty']}/100 | CPC: ¥{r['cpc']}")

# Sắp xếp theo Tăng trưởng (Growth)
by_growth = sorted(records, key=lambda x: x["growth"], reverse=True)
print("\n=== TOP TỪ KHÓA TĂNG TRƯỞNG NÓNG NHẤT (BREAKOUT GROWTH) ===")
for r in by_growth[:5]:
    print(f"🔥 「{r['keyword']}」 | Tăng trưởng: +{r['growth']}% MoM | Volume: {r['volume']:,}/tháng | Phân loại: {r['category_label']}")

# Sắp xếp theo CPC / Commercial Value
by_cpc = sorted(records, key=lambda x: x["cpc"], reverse=True)
print("\n=== TOP TỪ KHÓA CÓ GIÁ TRỊ THƯƠNG MẠI CAO NHẤT (CPC YÊN) ===")
for r in by_cpc[:5]:
    print(f"💰 「{r['keyword']}」 | Giá trị thầu CPC: ¥{r['cpc']} | Volume: {r['volume']:,}/tháng | Intent: {r['intent']}")

