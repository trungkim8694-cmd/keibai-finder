import requests
import json
API_KEY = "3cee958080dc40b2854698b6407d4b5a"
headers = {"Ocp-Apim-Subscription-Key": API_KEY}
url4 = "https://www.reinfolib.mlit.go.jp/ex-api/external/XIT002?year=2023&area=13"
res4 = requests.get(url4, headers=headers)
print("XIT002:", res4.status_code, res4.text[:300])
