import json

import pandas as pd
import geopandas as gpd
import numpy as np
import tqdm

msoalookup = pd.read_csv('data/sources/msoa_la.csv', index_col='MSOA11CD')
msoalookup.loc[:, "MSOA11HCLNM"] = msoalookup["MSOA11HCLNM"].fillna(msoalookup['MSOA11NM'])
sedldata = pd.read_excel('data/MSOA & Ward datasets_12-05-2020 v4.xlsx',
                         index_col='msoa11cd', sheet_name='MSOA_inc_Scot_NI')
brc_vulnerability = pd.read_csv(
    'data/sources/vulnerability-MSOA-UK.csv', index_col='Code')
column_rename = {
    'At risk jobs (as a result of COVID-19) by location of job': 'jobs_at_risk_workplace',
    'At risk employees (as a result of COVID-19) by employee residence': 'jobs_at_risk_residence',
    'Total Sales Change (month to previous year)': 'sales_change_total',
    'Total Sales Change (month to previous year)_bucket': 'sales_change_total_bucket',
    'Grocery Sales Change (month to previous year)': 'sales_change_grocery',
    'Grocery Sales Change (month to previous year)_bucket': 'sales_change_grocery_bucket',
}
sedldata = sedldata.rename(columns=column_rename)
brc_vulnerability.loc[:, "Vulnerability quintile"] = brc_vulnerability['Vulnerability decile'].replace({
    1: 1,
    2: 1,
    3: 2,
    4: 2,
    5: 3,
    6: 3,
    7: 4,
    8: 4,
    9: 5,
    10: 5,
})
brc_vulnerability = brc_vulnerability[[
    'Vulnerability score',
    'Vulnerability rank',
    'Vulnerability decile',
    'Vulnerability quintile',
]].rename(columns=lambda c: c.lower().replace(" ", "_"))

# for c in ['election_2019_swing', 'sales_yoy_change_total_2020_04_21', 'sales_yoy_change_grocery_2020_04_21']:
#     sedldata.loc[sedldata[c] == '#DIV/0!', c] = None
#     sedldata.loc[:, c] = sedldata[c].str.replace("%", "").astype(float)

columns_to_include = list(column_rename.values())
brc_columns_to_include = [
    'vulnerability_score',
    'vulnerability_rank',
    'vulnerability_decile',
    'vulnerability_quintile',
]

print(sedldata.columns)
print(brc_vulnerability.columns)

geo = gpd.read_file('data/boundaries/msoa.geojson')
geo = geo.join(msoalookup, on='msoa11cd')
geo = geo.join(sedldata.reset_index().set_index('msoa11cd')
               [columns_to_include], on='msoa11cd')
geo = geo.join(brc_vulnerability[brc_columns_to_include], on='msoa11cd')
geo.drop(columns='geometry').to_csv('data/msoa_data.csv', index=False)
geo.to_file('data/boundaries/msoa_data.geojson', driver='GeoJSON')
