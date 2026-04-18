import requests
res = requests.get('http://express.heartrails.com/api/json?method=getPrefectures')
prefs = res.json()['response']['prefecture']
print("Prefectures:", len(prefs))
if prefs:
    lines_res = requests.get(f'http://express.heartrails.com/api/json?method=getLines&prefecture={prefs[0]}')
    lines = lines_res.json()['response']['line']
    print(f"Lines in {prefs[0]}:", len(lines), lines[:3])
    if lines:
        stations_res = requests.get(f'http://express.heartrails.com/api/json?method=getStations&line={lines[0]}')
        stations = stations_res.json()['response']['station']
        print(f"Stations in {lines[0]}:", len(stations), stations[0])
