import urllib.request
req1 = urllib.request.Request('https://www.bit.courts.go.jp/app/detail/pd001/h04?courtId=07_2_fukushima&saleUnitId=00000005199', headers={'User-Agent': 'Mozilla/5.0'})
try:
    urllib.request.urlopen(req1)
    print("req1 success")
except Exception as e: print("req1:", e)

req2 = urllib.request.Request('https://www.bit.courts.go.jp/app/detail/pd001/h04?courtId=37541&saleUnitId=00000005199', headers={'User-Agent': 'Mozilla/5.0'})
try:
    urllib.request.urlopen(req2)
    print("req2 success")
except Exception as e: print("req2:", e)
