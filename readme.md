# Data Sources

## Boundaries

- [England and Wales MSOA boundaries](https://geoportal.statistics.gov.uk/datasets/middle-layer-super-output-areas-december-2011-boundaries-ew-bgc)
- [Scottish Intermediate Zone boundaries](https://data.gov.uk/dataset/133d4983-c57d-4ded-bc59-390c962ea280/intermediate-zone-boundaries-2011)
- [Northern Ireland Super Output Area boundaries](https://www.nisra.gov.uk/publications/super-output-area-boundaries-gis-format)

## Data lookups

- [LSOA to TTWA](https://geoportal.statistics.gov.uk/datasets/lower-layer-super-output-area-2011-to-travel-to-work-area-december-2011-lookup-in-the-united-kingdom)
- [Output area lookups](https://geoportal.statistics.gov.uk/datasets/output-area-to-lower-layer-super-output-area-to-middle-layer-super-output-area-to-local-authority-district-december-2011-lookup-in-england-and-wales)
- [Scottish lookups](https://www2.gov.scot/Topics/Statistics/sns/SNSRef/DZ2011Lookups)

## Data points

- [British Red Cross vulnerability index]() - MSOA11
- SEDL data - MSOA11
- OCSI jobs/employees - MSOA11

# Data cleaning steps

- Step 1: Fetch the data - using `sources.csv`
- Step 2: Turn Scotland and NI boundaries into geojson - `shp_to_geojson.py`
- Step 3: Merge geojson from Scotland, NI & England and Wales - `shp_to_geojson.py`
- Step 4: Add lookups to MSOA boundaries from [geo-lookups](https://github.com/drkane/geo-lookups/) and merge in source data - `add_to_boundaries.py`
- Step 5: Use Tippecanoe to create mbtiles from geojson - `maketiles.sh`

Also needed:

- create TTWA boundaries and lookups

# Add additional month data

The new data should be in an excel spreadsheet in the same format as the previous month.
The spreadsheet should have a tab called `MSOA_inc_Scot_NI`, with the following columns.
The column names should exactly match the ones given:

 - `msoa11cd` - code of the MSOA
 - `msoa11nm` - name of the MSOA (not used)
 - `Vulnerability MSOA quintile` - BRC Vulnerability quintile (not used)
 - `At risk jobs (as a result of COVID-19) by location of job`
 - `At risk employees (as a result of COVID-19) by employee residence`
 - `Total Sales Change (month to previous year)`
 - `Total Sales Change (month to previous year)_bucket`
 - `Grocery Sales Change (month to previous year)`
 - `Grocery Sales Change (month to previous year)_bucket`
 - `Month` - should be in format `2020_05`

You can pass the file and tab names to the `add_to_boundaries.py` script, like this:

```sh
python scripts/add_to_boundaries --sedldata data/new_filename.xlsx --sedldata-tab MSOA_inc_Scot_NI
```

Once this has been created, run steps 4 and 5 above to update the data, and add a new source tileset in mapbox (or replace the existing one).

Finally, you'll need to update a couple of variables at the bottom of [`index.html`](docs/index.html):

- `TILESET_URL` will need to be set to the new Tileset ID from mapbox, unless you've replaced the existing one
- `MONTHS` - you'll need to add a new line to this object, with the ID of the month you've added (eg `2020_07`) and how you would like it to appear in the interface (`July 2020`)
