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
- create TTWA boundaries and lookups

