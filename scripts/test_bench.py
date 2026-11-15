import requests, time

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
for lim in [50, 100, 200]:
    t0 = time.time()
    try:
        res = requests.get(f'https://kigyoulist.com/api/external/takken-agencies?page=1&limit={lim}', headers=headers, timeout=60)
        print(f'limit={lim}: status={res.status_code}, length={len(res.json().get("agencies", []))}, time={time.time()-t0:.2f}s')
    except Exception as e:
        print(f'limit={lim}: failed ({e})')

