// colour ramp needs at least 10 values
// http://bl.ocks.org/LuisSevillano/e95704a8966ee81a0a88575fbf978cac
const COLOUR_RAMP = [
    "#dd503c",
    "#e0634a",
    "#e47658",
    "#e78966",
    "#ea9c74",
    "#eeb081",
    "#f1c38f",
    "#f4d69d",
    "#f8e9ab",
    "#fbfcb9",
    "#e9fcae",
    "#e7fcac",
    "#d3fc9f",
    "#befc93",
    "#aafc86",
    "#96fc79",
    "#82fc6c",
    "#6dfc60",
    "#59fc53",
    "#45fc46",
]

const VULNERABILITY_QUINTILES = {
    1: "1 - least vulnerable",
    2: "2",
    3: "3",
    4: "4",
    5: "5 - most vulnerable",
}

const AREACODE_FIELD = 'msoa11cd';
const AREANAME_FIELD = 'MSOA11HCLNM';
const FIELD_MATCH = /(.*)_([0-9]{4}_[0-9]{2})/;

const FIELDS = {
    'sales_change_total_bucket': {
        name: 'Total Sales Change (month to previous year)',
        provider: 'Imfoco',
        hasMonths: true,
        fillColor: {
            property: 'sales_change_total_bucket',
            type: 'categorical',
            stops: [
                ["Insufficient data", "#eee"],
                ["80 - 100% Decrease", COLOUR_RAMP[0]],
                ["60 - 80% Decrease", COLOUR_RAMP[1]],
                ["40 - 60% Decrease", COLOUR_RAMP[3]],
                ["20 - 40% Decrease", COLOUR_RAMP[4]],
                ["0 - 20% Decrease", COLOUR_RAMP[8]],
                ["0 - 20% Increase", COLOUR_RAMP[10]],
                ["20 - 40% Increase", COLOUR_RAMP[12]],
                ["40 - 60% Increase", COLOUR_RAMP[14]],
                ["60 - 80% Increase", COLOUR_RAMP[16]],
                ["80 - 100% Increase", COLOUR_RAMP[18]],
                ["100%+ Increase", COLOUR_RAMP[19]],
            ]
        }
    },
    // 'sales_change_total': {
    //     name: 'Total Sales Change (week to previous year)',
    //     min: -1,
    //     max: 1,
    //     nformat: (n) => Number(n).toLocaleString(undefined, {style: 'percent'}),
    // },
    'sales_change_grocery_bucket': {
        name: 'Grocery Sales Change (month to previous year)',
        provider: 'Imfoco',
        hasMonths: true,
        fillColor: {
            property: 'sales_change_grocery_bucket',
            type: 'categorical',
            stops: [
                ["Insufficient data", "#eee"],
                ["80 - 100% Decrease", COLOUR_RAMP[0]],
                ["60 - 80% Decrease", COLOUR_RAMP[1]],
                ["40 - 60% Decrease", COLOUR_RAMP[3]],
                ["20 - 40% Decrease", COLOUR_RAMP[4]],
                ["0 - 20% Decrease", COLOUR_RAMP[8]],
                ["0 - 20% Increase", COLOUR_RAMP[10]],
                ["20 - 40% Increase", COLOUR_RAMP[12]],
                ["40 - 60% Increase", COLOUR_RAMP[14]],
                ["60 - 80% Increase", COLOUR_RAMP[16]],
                ["80 - 100% Increase", COLOUR_RAMP[18]],
                ["100%+ Increase", COLOUR_RAMP[19]],
            ]
        }
    },
    // 'sales_change_grocery': {
    //     name: 'Grocery Sales Change (week to previous year)',
    //     min: -1,
    //     max: 1,
    //     nformat: (n) => Number(n).toLocaleString(undefined, { style: 'percent' }),
    // },
    'jobs_at_risk_workplace': {
        name: 'At risk jobs (as a result of COVID-19) by workplace',
        provider: 'OCSI',
        min: 0,
        max: 0.5,
        reverse: true,
        hasMonths: false,
        nformat: (n) => Number(n).toLocaleString(undefined, { style: 'percent' }),
    },
    'jobs_at_risk_residence': {
        name: 'At risk jobs (as a result of COVID-19) by employee residence',
        provider: 'OCSI',
        min: 0,
        max: 0.5,
        reverse: true,
        hasMonths: false,
        nformat: (n) => Number(n).toLocaleString(undefined, { style: 'percent' }),
    },
    'vulnerability_quintile': {
        name: 'COVID Vulnerability quintile',
        provider: 'British Red Cross',
        colours: [
            1, COLOUR_RAMP[19],
            2, COLOUR_RAMP[14],
            3, COLOUR_RAMP[10],
            4, COLOUR_RAMP[5],
            5, COLOUR_RAMP[0],
        ],
        min: 1,
        max: 5,
        reverse: true,
        hasMonths: false,
    },
    // 'vulnerability_decile': {
    //     name: 'British Red Cross COVID Vulnerability decile',
    //     min: 1,
    //     max: 10,
    // },
    // 'vulnerability_score': {
    //     name: 'British Red Cross COVID Vulnerability score',
    //     min: 0,
    //     max: 344,
    //     nformat: (n) => Number(n).toLocaleString(undefined, {}),
    // },
    // 'vulnerability_rank': {
    //     name: 'British Red Cross COVID Vulnerability rank',
    //     min: 1,
    //     max: 6791,
    // },
}


var app = new Vue({
    el: '#app',
    data() {
        return {
            currentField: Object.keys(FIELDS)[0],
            currentMonth: Object.keys(MONTHS).slice(-1)[0],
            currentArea: "",
            currentVulnerabilityQuintile: "",
            highlightedArea: null,
            fields: FIELDS,
            months: MONTHS,
            vulnerabilityQuintiles: VULNERABILITY_QUINTILES,
            areas: null,
            loading: true,
            boundaries: null,
            map: null,
            accessToken: MAPBOX_ACCESS_TOKEN,
            showAbout: false,
            charts: {},
        }
    },
    mounted () {
        
        mapboxgl.accessToken = this.accessToken;
        var map = new mapboxgl.Map({
            container: 'map',
            style: MAP_STYLE,
            zoom: STARTING_ZOOM,
            center: STARTING_LATLNG,
            minZoom: 4,
            maxZoom: 18,
            maxBounds: MAX_BOUNDS,
        });
        this.map = map;
        var component = this;
        
        map.on('load', function () {
        
            // Add geolocate control to the map.
            map.addControl(
                new mapboxgl.GeolocateControl({
                    positionOptions: {
                        enableHighAccuracy: true
                    },
                    trackUserLocation: true
                })
            );
            map.addControl(
                new mapboxgl.NavigationControl()
            );

            map.addSource('sedldata', {
                type: 'vector',
                url: TILESET_URL,
            });
            map.addLayer({
                'id': 'sedldata',
                'source': 'sedldata',
                'source-layer': SOURCE_LAYER,
                'type': 'fill',
                'layout': {},
                'filter': ['!=', ["slice", ['get', AREACODE_FIELD], 0, 1], 'N'],
                'paint': {
                    'fill-color': 'white',
                    'fill-opacity': 0.5,
                    'fill-antialias': false,
                },
            });
            map.addLayer({
                'id': 'sedldata-highlight',
                'source': 'sedldata',
                'source-layer': SOURCE_LAYER,
                'type': 'line',
                'layout': {},
                'filter': ['==', ['get', AREACODE_FIELD], ''],
                'paint': {
                    'line-color': '#0079b9',
                    'line-width': 3,
                },
            });
  
            map.on('dragend', (ev) => {
                if (map.getLayer('highlightArea')) {
                    map.removeLayer('highlightArea');
                }
                if (map.getLayer('highlightAreaBBox')) {
                    map.removeLayer('highlightAreaBBox');
                    map.removeSource('highlightAreaBBox');
                }
            });

            map.on('mousemove', 'sedldata', function (e) {
                // Change the cursor style as a UI indicator.
                map.getCanvas().style.cursor = 'pointer';
            });
            
            map.on('click', 'sedldata', function (e) {
                // Change the cursor style as a UI indicator.
                map.getCanvas().style.cursor = 'pointer';
            
                var features = map.queryRenderedFeatures(e.point);
                if (features[0].properties[AREANAME_FIELD]){
                    component.highlightedArea = features[0];
                    map.setFilter('sedldata-highlight', ['==', ['get', AREACODE_FIELD], features[0].properties[AREACODE_FIELD]]);
                } else {
                    component.highlightedArea = null;
                    map.setFilter('sedldata-highlight', ['==', ['get', AREACODE_FIELD], '']);
                }
            });
            
            map.on('mouseleave', 'sedldata', function () {
                map.getCanvas().style.cursor = '';
            });

            fetch('assets/data/ttwa_boundaries.geojson')
                .then(r => r.json())
                .then(geojson => {
                    component.map.addSource('highlightArea', {
                        'type': 'geojson',
                        'data': geojson
                    });
                    component.boundaries = geojson;
                    component.areas = geojson.features.map((f) => {
                        return {
                            name: f.properties.ttwa11nm,
                            id: f.properties.ttwa11cd
                        }
                    }).sort(function (a, b) {
                        if (a.name > b.name) {
                            return 1;
                        }
                        if (a.name < b.name) {
                            return -1;
                        }
                        return 0;
                    });
                })
                .catch((error) => {
                    console.log(error);
                })
                .finally(() => {
                    component.loading = false;
                    component.updateMap();
                });
        });
    },
    watch: {
        currentField: function(){ this.updateMap(); },
        currentMonth: function(){ this.updateMap(); },
        currentVulnerabilityQuintile: function(){ this.updateMap(); },
        currentArea: function(){ this.selectArea(); },
    },
    computed: {
        field: function(){
            return this.fields[this.currentField];
        },
        field_id: function(){
            if(this.field.hasMonths){
                return this.currentField + "_" + this.currentMonth;
            }
            return this.currentField;
        },
        colours: function(){
            
            if(this.field.fillColor){
                var colours = this.field.fillColor;
                colours.property = this.field_id;
                return colours;
            }
            
            var startColour = COLOUR_RAMP[0];
            var endColour = COLOUR_RAMP[COLOUR_RAMP.length - 1];
            var midColour = COLOUR_RAMP[COLOUR_RAMP.length / 2];
            if(this.field.reverse){
                startColour = COLOUR_RAMP[COLOUR_RAMP.length - 1];
                endColour = COLOUR_RAMP[0];
            }
        
            if (this.field.colours) {
                var colours = this.field.colours;
            } else if(this.field.min < 0){
                var colours = [
                    this.field.min, startColour,
                    0, midColour,
                    this.field.max, endColour,
                ]
            } else {
                var colours = [
                    this.field.min, startColour,
                    (this.field.min + this.field.max) / 2, midColour,
                    this.field.max, endColour,
                ]
            }
        
            return [
                "interpolate",
                ["linear"],
                ["get", this.field_id],
            ].concat(colours);
        },
        areaName: function(){
            if(!this.highlightedArea){return "";}
            return this.highlightedArea.properties[AREANAME_FIELD];
        },
        areaValues: function(){
            if(!this.highlightedArea){
                return {}
            }
            var values = {};
            Object.entries(this.highlightedArea.properties).forEach(([pkey, pvalue]) => {
                var match = pkey.match(FIELD_MATCH);
                Object.entries(this.fields).forEach(([fkey, fvalue]) => {
                    var value = pvalue;
                    if(fvalue.nformat){
                        value = fvalue.nformat(parseFloat(value));
                    }
                    if(fkey==pkey){
                        values[fkey] = value;
                    } else if(match && match[1]==fkey) {
                        if(!(fkey in values)){
                            values[fkey] = {}
                        }
                        values[fkey][match[2]] = value;
                    }
                });
            });
            return values;
        },
        legendItems: function(){
            var items = [];
            if(this.colours.stops){
                this.colours.stops.forEach(([text, colour]) => {
                    items.push({
                        colour: colour,
                        text: text
                    });
                })
            } else {
                this.colours.slice(3).reduce((all, v, i) => {
                    if (i % 2) {
                        all[all.length - 1].push(v);
                        return all;
                    } else {
                        return [...all, [v]];
                    }
                }, []).forEach(c => {
                    if(this.field.nformat){
                        items.push({
                            colour: c[1],
                            text: this.field.nformat(parseFloat(c[0]))
                        });
                    } else {
                        items.push({
                            colour: c[1],
                            text: c[0]
                        });
                    }
                });
            }
            return items;
        }
    },
    methods: {
        updateMap: function(){
            this.map.setPaintProperty('sedldata', 'fill-color', this.colours);
            if(this.currentVulnerabilityQuintile==""){
                this.map.setFilter('sedldata', null);
            } else {
                this.map.setFilter(
                    'sedldata', 
                    [
                        '==',
                        ['get', 'vulnerability_quintile'],
                        parseFloat(this.currentVulnerabilityQuintile)
                    ]
                )
            }
        },
        resetMap: function(){
            this.currentArea = "";
            if(!this.map){
                return;
            }
            this.map.flyTo({ center: STARTING_LATLNG, zoom: STARTING_ZOOM });
            if (this.map.getLayer('highlightAreaBBox')) {
                this.map.removeLayer('highlightAreaBBox');
                this.map.removeSource('highlightAreaBBox');
            }
        },
        selectArea: function(){
            var map = this.map;

            // reset the area bbox
            if (map.getLayer('highlightAreaBBox')){
                map.removeLayer('highlightAreaBBox');
                map.removeSource('highlightAreaBBox');
            }

            if(!this.currentArea){
                if (map.getLayer('highlightArea')) {
                    map.removeLayer('highlightArea');
                }
                return;
            }
            var geojson = this.boundaries.features.find((b) => b.properties.ttwa11cd == this.currentArea);
            var geojsonBounds = bbox(geojson);
            var sw = new mapboxgl.LngLat(geojsonBounds[0], geojsonBounds[1]);
            var ne = new mapboxgl.LngLat(geojsonBounds[2], geojsonBounds[3]);
            var llb = new mapboxgl.LngLatBounds(sw, ne);
    
            map.addSource('highlightAreaBBox', {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Polygon',
                        'coordinates': [
                            [
                                [0, 90],
                                [180, 90],
                                [180, -90],
                                [0, -90],
                                [-180, -90],
                                [-180, 0],
                                [-180, 90],
                                [0, 90],
                            ],[
                                [geojsonBounds[0], geojsonBounds[1]],
                                [geojsonBounds[0], geojsonBounds[3]],
                                [geojsonBounds[2], geojsonBounds[3]],
                                [geojsonBounds[2], geojsonBounds[1]],
                            ]
                        ]
                    }
                }
            });
            map.addLayer({
                'id': 'highlightAreaBBox',
                'type': 'fill',
                'source': 'highlightAreaBBox',
                'layout': {},
                'paint': {
                    'fill-color': '#fff',
                    'fill-opacity': 0.8
                }
            });
    
            map.fitBounds(llb, {padding: 20});
        },
    }
})
