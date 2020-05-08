import json
import os
import tempfile
import zipfile

import geopandas

data_sources_dir = '../data/sources/'
data_output_dir = '../data/boundaries/'
shp_zips = {
    'SG_IntermediateZoneBdry_2011.zip': {
        'id': 'scotland_intermediate_zones',
        'id_field': 'InterZone',
        'name_field': 'Name',
    },
    'SOA2011_Esri_Shapefile_0.zip': {
        'id': 'ni_soa',
        'id_field': 'SOA_CODE',
        'name_field': 'SOA_LABEL',
    },
}

msoa_files = [os.path.join(data_sources_dir, 'msoa_bgc.geojson')]
for filepath, fileinfo in shp_zips.items():
    with tempfile.TemporaryDirectory() as tmpdirname:
        print(filepath)
        with zipfile.ZipFile(os.path.join(data_sources_dir, filepath)) as z:
            z.extractall(tmpdirname)
        shapefiles = [f for f in os.listdir(tmpdirname) if f.endswith(".shp")]
        for s in shapefiles:
            print(s)
            gdf = geopandas.read_file(os.path.join(tmpdirname, s))
            gdf.loc[:, "msoa11cd"] = gdf[fileinfo['id_field']]
            gdf.loc[:, "msoa11nm"] = gdf[fileinfo['name_field']]
            print(gdf.crs)
            filename = os.path.join(
                data_output_dir, f"{fileinfo['id']}.geojson")
            msoa_files.append(filename)
            gdf.to_crs("EPSG:4326").to_file(filename), driver = 'GeoJSON')

def minimiseFeature(feature):
    return {
        **feature,
        "properties": {
            "msoa11cd": feature["properties"]["msoa11cd"], 
            "msoa11nm": feature["properties"]["msoa11nm"],
        }
    }

all_features = []
for fp in msoa_files:
    with open(fp) as f:
        for feature in json.load(f)["features"]:
            all_features.append(minimiseFeature(feature))
with open(os.path.join(data_output_dir, 'msoa.geojson'), 'w') as a:
    json.dump({
        "type": "FeatureCollection",
        "features": all_features
    }, a, indent=4)
    print("finished")
