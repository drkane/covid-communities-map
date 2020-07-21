import json

import pandas as pd
import geopandas as gpd
import numpy as np
import tqdm

wardlookup = pd.read_csv('data/sources/ward_all_codes.csv', index_col='WDCD')
sedldata = pd.read_excel('data/MSOA & Ward datasets_12-05-2020 v4.xlsx',
                         index_col='WD17CD', sheet_name='Full ward dataset')
column_rename = {
    'Vulnerability ward quintile': 'vulnerability_quintile',
    'Total Sales Change (week to previous year)': 'sales_change_total_2020_04',
    'Total Sales Change (week to previous year)_bucket': 'sales_change_total_bucket_2020_04',
    'Grocery Sales Change (week to previous year)': 'sales_change_grocery_2020_04',
    'Grocery Sales Change (week to previous year)_bucket': 'sales_change_grocery_bucket_2020_04',
}
sedldata = sedldata.rename(columns=column_rename)
sedldata = sedldata[sedldata.index.str.startswith("N")]

columns_to_include = list(column_rename.values())

print(sedldata.columns)

geo = gpd.read_file('data/boundaries/wards2017.geojson')
geo = geo[geo.wd17cd.str.startswith("N")]
geo = geo.join(wardlookup, on='wd17cd')
geo = geo.join(sedldata[columns_to_include], on='wd17cd')
geo.drop(columns='geometry').to_csv('data/ward_data_ni.csv', index=False)
geo.to_file('data/boundaries/ward_data_ni.geojson', driver='GeoJSON')
