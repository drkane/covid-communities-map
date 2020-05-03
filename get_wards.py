import requests
import os

BOUNDARIES= {
    'wards_2017': 'https://opendata.arcgis.com/datasets/7193daa99995445aa84a0b23352e56a1_2.geojson',
    'wards_2019': 'https://opendata.arcgis.com/datasets/d2dce556b4604be49382d363a7cade72_0.geojson',
}

for b, url in BOUNDARIES.items():
    print(f'fetching {b}')
    r = requests.get(url)
    with open(f'data/boundaries/{b}.geojson', 'wb') as a:
        a.write(r.content)
        print(f'saved {b}.geojson')
