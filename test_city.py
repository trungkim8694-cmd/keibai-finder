import requests
API_KEY = "3cee958080dc40b2854698b6407d4b5a"
url = "https://www.reinfolib.mlit.go.jp/ex-api/external/XIT002?year=2023&area=01"
res = requests.get(url, headers={"Ocp-Apim-Subscription-Key": API_KEY})
cities = res.json().get('data', [])

# Find anything related to Shiraoi
shiraoi = [c for c in cities if "白老" in c['name']]
print("Shiraoi in MLIT:", shiraoi)

# Find anything related to Ishikari
ishikari = [c for c in cities if "石狩" in c['name']]
print("Ishikari in MLIT:", ishikari)

