import requests
from bs4 import BeautifulSoup

s = requests.Session()
s.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
})

s.get('https://www.bit.courts.go.jp/app/top/pt001/h01')
s.post('https://www.bit.courts.go.jp/app/area/pk001/h01', data={'tabId': 'result'})
s.post('https://www.bit.courts.go.jp/app/area/pk001/h02', data={'blockCls': '01', 'tabId': 'result'})
s.post('https://www.bit.courts.go.jp/app/peroidsearch/ps007/h02', data={
    'peroidSaleCls': '4', 'saleClsList': '1,2,3,4', 'courtId': '', 'saleType': '1',
    'peroidSearchFlg': '', 'blockCls': '01', 'blockName': '北海道', 'prefecturesId': '91',
    'mapShowFlag': '', 'mapSelectedAreaName': 'sapporo', 'searchType': '', 'tabId': 'result'
})

h03_payload = [
    ('peroidCourtId', '38111'),
    ('peroidSaleCls', '1'), ('peroidSaleCls', '2'), ('peroidSaleCls', '3'), ('peroidSaleCls', '4'),
    ('error', ''), ('saleScdId', ''), ('fiscalYear', '000805'), ('codeCls', '2'), ('caseNo', ''),
    ('saleClsList', '1,2,3,4'), ('courtId', '38111'), ('saleType', '1'), ('peroidSearchFlg', ''),
    ('blockCls', '01'), ('blockName', '北海道'), ('prefecturesId', '91'), ('mapShowFlag', '1'),
    ('mapSelectedAreaName', 'sapporo'), ('searchType', '1'), ('tabId', 'result')
]

r4 = s.post('https://www.bit.courts.go.jp/app/peroidsearch/ps007/h03', data=h03_payload)
soup4 = BeautifulSoup(r4.text, 'html.parser')

for s_tag in soup4.find_all('script'):
    if 'getData' in s_tag.text:
        idx = s_tag.text.find('function getData')
        print('getData function:\n', s_tag.text[idx:idx+500])
