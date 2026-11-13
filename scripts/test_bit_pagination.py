import requests
from bs4 import BeautifulSoup
import re

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
})

# Init
session.get('https://www.bit.courts.go.jp/app/top/pt001/h01', timeout=10)
session.post('https://www.bit.courts.go.jp/app/area/pk001/h01', data={'tabId': 'property', 'blockCls': '03'}, timeout=10)

# Select Tokyo
r_h04 = session.post('https://www.bit.courts.go.jp/app/areaselect/ps002/h04', data={'prefecturesId': '13', 'searchType': '2', 'blockCls': '03', 'tabId': 'property'}, timeout=10)
soup_h04 = BeautifulSoup(r_h04.text, 'html.parser')
form = soup_h04.find('form', id='searchareaselectForm')
search_data = {inp.get('name'): inp.get('value', '') for inp in form.find_all('input') if inp.get('name')}
search_data['saleCls'] = ['1', '2', '3', '4']

r_h17 = session.post('https://www.bit.courts.go.jp/app/areaselect/ps002/h17', data=search_data, timeout=15)
soup1 = BeautifulSoup(r_h17.text, 'html.parser')

cards1 = soup1.select('.bit__searchResult, .bit__searchResult_item')
items1 = [c.find('a', onclick=lambda o: o and 'tranPropertyDetail' in o) for c in cards1 if c.find('a', onclick=lambda o: o and 'tranPropertyDetail' in o)]
print('Page 1 items count:', len(items1))
if items1:
    print('Page 1 first onclick:', items1[0].get('onclick'))

# Inspect all anchors with onclick on page 1
print('\nAll pagination anchors on Page 1:')
for a in soup1.find_all('a'):
    onclick = a.get('onclick', '')
    if any(k in onclick.lower() for k in ['page', 'next', 'h04', 'tran']):
        print(f"  text: '{a.get_text(strip=True)}' | onclick: '{onclick}' | href: '{a.get('href')}'")

# Inspect form inputs on page 1
prop_form = soup1.find('form', id='propertyResultForm')
if prop_form:
    print('\nForm propertyResultForm action:', prop_form.get('action'))
    for inp in prop_form.find_all('input'):
        print(f"  input name: {inp.get('name')} = {inp.get('value')}")
