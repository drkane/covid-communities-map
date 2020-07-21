import json
import argparse

import pandas as pd
import geopandas as gpd
import numpy as np
import tqdm


parser = argparse.ArgumentParser(description='Process some integers.')
parser.add_argument('--msoa-lookup', default='data/sources/msoa_la.csv', help='File containing MSOA lookups')
parser.add_argument('--sedldata', default='data/MSOA & Ward datasets_20-07-2020 v5.xlsx', help='File containing SEDL data. Needs to be in a specific format')
parser.add_argument('--sedldata-tab', default='MSOA_inc_Scot_NI', help='The name of the tab containing the MSOA data')
parser.add_argument('--brc-vulnerability', default='data/sources/vulnerability-MSOA-UK.csv', help='File containing BRC vulnerability by MSOA')
parser.add_argument('--msoa-boundaries', default='data/boundaries/msoa.geojson', help='GeoJSON file containing MSOA boundaries')
parser.add_argument('--output-data', default='data/msoa_data.csv', help='Output CSV')
parser.add_argument('--output-boundaries', default='data/boundaries/msoa_data.geojson', help='Output GeoJSON file')

args = parser.parse_args()


print("Load MSOA lookups")
msoalookup = pd.read_csv(args.msoa_lookup, index_col='MSOA11CD')
msoalookup.loc[:, "MSOA11HCLNM"] = msoalookup["MSOA11HCLNM"].fillna(msoalookup['MSOA11NM'])
print("Loaded MSOA lookups")

print("Load SEDL data")
sedldata = pd.read_excel(args.sedldata, sheet_name=args.sedldata_tab).set_index(['msoa11cd', 'Month'])
print("Loaded SEDL data")

print("Load BRC vulnerability data")
brc_vulnerability = pd.read_csv(args.brc_vulnerability, index_col='Code')
print("Loaded BRC vulnerability data")

print("Process SEDL data")
column_rename = {
    'At risk jobs (as a result of COVID-19) by location of job': 'jobs_at_risk_workplace',
    'At risk employees (as a result of COVID-19) by employee residence': 'jobs_at_risk_residence',
    'Total Sales Change (month to previous year)': 'sales_change_total',
    'Total Sales Change (month to previous year)_bucket': 'sales_change_total_bucket',
    'Grocery Sales Change (month to previous year)': 'sales_change_grocery',
    'Grocery Sales Change (month to previous year)_bucket': 'sales_change_grocery_bucket',
}
sedldata = sedldata.rename(columns=column_rename)
sedl_columns = [
    'sales_change_total',
    'sales_change_total_bucket',
    'sales_change_grocery',
    'sales_change_grocery_bucket',
]

jobs_at_risk = sedldata.xs("2020_04", level=1)[
    ['jobs_at_risk_workplace', 'jobs_at_risk_residence']
]
sedldata = sedldata[sedl_columns].unstack()
sedldata.columns = ["_".join(c).lower() for c in sedldata.columns.tolist()]
print(sedldata.columns)
print("Processed SEDL data")

print("Process BRC data")
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
brc_columns_to_include = [
    'vulnerability_score',
    'vulnerability_rank',
    'vulnerability_decile',
    'vulnerability_quintile',
]
print(brc_vulnerability.columns)
print("Processed BRC data")

# for c in ['election_2019_swing', 'sales_yoy_change_total_2020_04_21', 'sales_yoy_change_grocery_2020_04_21']:
#     sedldata.loc[sedldata[c] == '#DIV/0!', c] = None
#     sedldata.loc[:, c] = sedldata[c].str.replace("%", "").astype(float)

print("Read MSOA boundaries")
geo = gpd.read_file(args.msoa_boundaries)
print("Add MSOA lookups")
geo = geo.join(msoalookup, on='msoa11cd')
print("Add jobs at risk data")
geo = geo.join(jobs_at_risk, on='msoa11cd')
print("Add sales change data")
geo = geo.join(sedldata, on='msoa11cd')
print("Add BRC data")
geo = geo.join(brc_vulnerability[brc_columns_to_include], on='msoa11cd')
print("Exclude NI data")
geo = geo[geo.CTRYCD != 'N92000002']
print("Save CSV output")
geo.drop(columns='geometry').to_csv(args.output_data, index=False)
print("Save geojson output")
geo.to_file(args.output_boundaries, driver='GeoJSON')
print("Finished")
