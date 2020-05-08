import json

with open('data\Travel_to_Work_Areas_(December_2011)_Names_and_Codes_in_the_United_Kingdom.geojson') as a,\
    open('docs\\assets\\data\\areas.json', 'w') as b:
    data = json.load(a)
    json.dump({
        "ttwa": [
            [f['properties']['TTWA11CD'], f['properties']['TTWA11NM']]
            for f in data['features']
        ]
    }, b, indent=4)

