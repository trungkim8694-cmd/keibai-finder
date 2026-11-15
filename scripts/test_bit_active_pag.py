import requests
from bs4 import BeautifulSoup

s = requests.Session()
s.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
})

s.get('https://www.bit.courts.go.jp/app/top/pt001/h01')
s.post('https://www.bit.courts.go.jp/app/area/pk001/h01', data={'tabId': 'property', 'blockCls': '01'})
r3 = s.post('https://www.bit.courts.go.jp/app/areaselect/ps002/h04', data={'prefecturesId': '91', 'searchType': '2', 'blockCls': '01', 'tabId': 'property'})
soup3 = BeautifulSoup(r3.text, 'html.parser')
form = soup3.find('form', id='searchareaselectForm')
data = {inp.get('name'): inp.get('value', '') for inp in form.find_all('input') if inp.get('name')}
data['saleCls'] = ['1', '2', '3', '4']

r4 = s.post('https://www.bit.courts.go.jp/app/areaselect/ps002/h17', data=data)
soup4 = BeautifulSoup(r4.text, 'html.parser')

for s_tag in soup4.find_all('script'):
    if 'function getData' in s_tag.text:
        idx = s_tag.text.find('function getData')
        print(s_tag.text[idx:idx+1200])
