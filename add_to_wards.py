import json

import pandas as pd
import numpy as np

df = pd.read_csv('data/BasicImfocoData.csv', index_col='WD17CD')
brc_vulnerability = pd.read_csv(
    'data/brc_vulnerability_ward_2017.csv', index_col='WD17CD')
column_rename = {
    'WD17CD': 'wd17cd',
    'Left Behind': 'left_behind',
    'LAD17CD': 'lad17cd',
    'Constituency': 'pcon',
    'Party 2019 Election (Constituency)': 'election_2019',
    'Election swing % (Constituency)': 'election_2019_swing',
    '15-21 April Total Sales Change YoY': 'sales_yoy_change_total_2020_04_21',
    '15-21 April Grocery Sales Change YoY': 'sales_yoy_change_grocery_2020_04_21',
    'Vulnerability Quintile (Ward)': 'ward_vulnerability_quintile',
    'Vulnerability Quintile (Local Authority)': 'la_vulnerability_quintile',
}
df = df.rename(columns=column_rename)
df = df.join(brc_vulnerability[[
    'Vulnerability score',
    'Vulnerability rank',
    'Vulnerability decile',
    'Vulnerability quintile',
]].rename(columns=lambda c: c.lower().replace(" ", "_")))

for c in ['election_2019_swing', 'sales_yoy_change_total_2020_04_21', 'sales_yoy_change_grocery_2020_04_21']:
    df.loc[df[c]=='#DIV/0!', c] = None
    df.loc[:, c] = df[c].str.replace("%", "").astype(float)

columns_to_include = [
    'left_behind',
    'sales_yoy_change_total_2020_04_21',
    'sales_yoy_change_grocery_2020_04_21',
    'vulnerability_score',
    'vulnerability_quintile',
]

print(df.columns)

with open('data/boundaries/wards_2017.geojson') as a:
    ward_geo = json.load(a)

for w in ward_geo["features"]:
    if w['properties']['wd17cd'] in df.index:
        w['properties'] = {
            **df.loc[w['properties']['wd17cd'], columns_to_include].replace({np.nan: None}).to_dict(),
            **w['properties']
        }
    else:
        w['properties'] = {
            **{c: None for c in df.columns},
            **w['properties']
        }

with open('data/boundaries/wards_2017_extra.geojson', 'w') as a:
    json.dump(ward_geo, a, indent=4)
