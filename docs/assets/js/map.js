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

const FIELDS = {
    'sales_change_total_bucket': {
        name: 'Total Sales Change (week to previous year)',
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
        name: 'Grocery Sales Change (week to previous year)',
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
        min: 0,
        max: 0.5,
        reverse: true,
        nformat: (n) => Number(n).toLocaleString(undefined, { style: 'percent' }),
    },
    'jobs_at_risk_residence': {
        name: 'At risk jobs (as a result of COVID-19) by employee residence',
        min: 0,
        max: 0.5,
        reverse: true,
        nformat: (n) => Number(n).toLocaleString(undefined, { style: 'percent' }),
    },
    'vulnerability_quintile': {
        name: 'British Red Cross COVID Vulnerability quintile',
        min: 1,
        max: 5,
        reverse: true,
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
const STARTING_LATLNG = [-2.89479, 54.093409]; // original: [-1.485, 52.567],
const STARTING_ZOOM = 5;
const MAP_STYLE = 'https://s3-eu-west-1.amazonaws.com/tiles.os.uk/v2/styles/open-zoomstack-light/style.json';
const MAX_BOUNDS = [[-25, 45], [15, 65]]; // original: [[-8.74, 49.84], [1.96, 60.9]],

var currentField = 'sales_change_total_bucket';

var fieldSelect = document.getElementById('field-select');
Object.entries(FIELDS).forEach(([key, value])=> {
    var opt = document.createElement('option');
    opt.setAttribute('value', key);
    opt.innerText = value.name;
    fieldSelect.append(opt);
})

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
var map = new mapboxgl.Map({
    container: 'map',
    style: MAP_STYLE,
    zoom: STARTING_ZOOM,
    center: STARTING_LATLNG,
    minZoom: 4,
    maxZoom: 18,
    maxBounds: MAX_BOUNDS,
});

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

var boundaries = {};

function interpolateField(field_id){
    currentField = field_id;
    var field = FIELDS[field_id];
    if(field.fillColor){
        return field.fillColor;
    }
    var startColour = COLOUR_RAMP[0];
    var endColour = COLOUR_RAMP[COLOUR_RAMP.length - 1];
    var midColour = COLOUR_RAMP[COLOUR_RAMP.length / 2];
    if(field.reverse){
        startColour = COLOUR_RAMP[COLOUR_RAMP.length - 1];
        endColour = COLOUR_RAMP[0];
    }

    if(field.min < 0){
        colours = [
            field.min, startColour,
            0, midColour,
            field.max, endColour,
        ]
    } else {
        colours = [
            field.min, startColour,
            (field.min + field.max) / 2, midColour,
            field.max, endColour,
        ]
    }

    return [
        "interpolate",
        ["linear"],
        ["get", field_id],
    ].concat(colours);
        // -100, "#FA0000",
        // 0, "#FFFF00",
        // 100, "#73FF00",
        // 1000, "#00FF00",
        // 1, "#0864A7",
        // 2, "#0978C7",
        // 3, "#2690CC",
        // 4, "#4AADD2",
        // 5, "#7DCBD8",
        // 6, "#B0E1D6",
        // 7, "#D3EED5",
        // 8, "#E3F5D8",
        // 9, "#EFFCCA",
        // 10, "#FBFCB9"
}

function addItemToLegend(legend, colour, text) {
    // create legend item
    var li = document.createElement('li');
    li.classList.add('pa0', 'ma0', 'flex', 'items-center', 'f6')

    // create legend colour
    var colourBlock = document.createElement('span');
    colourBlock.classList.add('h1', 'w1', 'dib', 'mr2');
    colourBlock.style.backgroundColor = colour;
    li.append(colourBlock);

    // create legend text
    var legendText = document.createElement('span');
    legendText.innerText = text;
    legendText.classList.add('v-mid')
    li.append(legendText);

    // add to legend
    legend.append(li);
}

function setField(map, field_id) {
    var field = FIELDS[field_id];
    var colours = interpolateField(field_id);

    var legend = document.getElementById('map-legend');
    document.getElementById('map-legend-title').innerText = field.name;
    legend.innerHTML = '';
    if(colours.stops){
        colours.stops.forEach(([text, colour]) => {
            addItemToLegend(legend, colour, text);
        })
    } else {
        colours.slice(3).reduce((all, v, i) => {
            if (i % 2) {
                all[all.length - 1].push(v);
                return all;
            } else {
                return [...all, [v]];
            }
        }, []).forEach(c => {
            if(field.nformat){
                addItemToLegend(legend, c[1], field.nformat(parseFloat(c[0])));
            } else {
                addItemToLegend(legend, c[1], c[0]);
            }
        });
    }

    map.setPaintProperty('sedldata', 'fill-color', colours);
    // map.setFilter('sedldata', ["any", ["get", field_id]]);
}

// add imd2019
map.on('load', function () {

    Array.from(document.getElementsByClassName('toggle-about')).forEach((el) => {
        el.addEventListener('click', (ev) => {
            ev.preventDefault();
            document.getElementById('about-data').classList.toggle('dn');
        })
    })

    document.getElementById('reset-map').addEventListener('click', (ev) => {
        ev.preventDefault();
        map.flyTo({ center: STARTING_LATLNG, zoom: STARTING_ZOOM });
        if (map.getLayer('highlightAreaBBox')) {
            map.removeLayer('highlightAreaBBox');
            map.removeSource('highlightAreaBBox');
        }
    });

    // fetch('assets/data/areas.json')
    //     .then(r => r.json())
    //     .then(r => {
    //         r.ttwa.forEach((area) => {
    //             var areaOption = document.createElement('option');
    //             areaOption.innerText = area[1];
    //             areaOption.value = area[0];
    //             document.getElementById('area-select').append(areaOption);
    //         });
    //     });

    fetch('assets/data/ttwa_boundaries.geojson')
        .then(r => r.json())
        .then(geojson => {
            map.addSource('highlightArea', {
                'type': 'geojson',
                'data': geojson
            });
            boundaries = geojson;
            geojson.features.map((f) => {
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
            }).forEach((f) => {
                var areaOption = document.createElement('option');
                areaOption.innerText = f.name;
                areaOption.value = f.id;
                document.getElementById('area-select').append(areaOption);
            });
        })
        .catch((error) => {
            console.log(error);
        });
    
    document.getElementById('area-select').addEventListener('input', (ev) => {
        ev.preventDefault();
        var areaCode = ev.target.value;
        if(!areaCode){
            if (map.getLayer('highlightArea')) {
                map.removeLayer('highlightArea');
            }
            if (map.getLayer('highlightAreaBBox')) {
                map.removeLayer('highlightAreaBBox');
                map.removeSource('highlightAreaBBox');
            }
            return;
        }
        var geojson = boundaries.features.find((b) => b.properties.ttwa11cd == areaCode);
        // var filter = ['==', ['get', 'ttwa11cd'], areaCode];
        // if (map.getLayer('highlightArea')){
        //     map.setFilter('highlightArea', filter)
        // } else {
        //     map.addLayer({
        //         'id': 'highlightArea',
        //         'type': 'line',
        //         'source': 'highlightArea',
        //         'filter': filter,
        //         'layout': {
        //             'line-join': 'round',
        //         },
        //         'paint': {
        //             'line-color': '#000',
        //             'line-width': 3,
        //         }
        //     });
        // }
        var geojsonBounds = bbox(geojson);
        var sw = new mapboxgl.LngLat(geojsonBounds[0], geojsonBounds[1]);
        var ne = new mapboxgl.LngLat(geojsonBounds[2], geojsonBounds[3]);
        var llb = new mapboxgl.LngLatBounds(sw, ne);

        if (map.getLayer('highlightAreaBBox')){
            map.removeLayer('highlightAreaBBox');
            map.removeSource('highlightAreaBBox');
        }

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
    
    document.getElementById('field-select').addEventListener('input', (ev) => {
        ev.preventDefault();
        var field = ev.target.value;
        setField(map, field);
    });
    
    document.getElementById('vulnerability-quintile').addEventListener('input', (ev) => {
        ev.preventDefault();
        var vulnerability_quintile = ev.target.value;
        if(vulnerability_quintile==""){
            map.setFilter('sedldata', null);
        } else {
            map.setFilter('sedldata', ['==', ['get', 'vulnerability_quintile'], parseFloat(vulnerability_quintile)])
        }
    })

    map.addSource('sedldata', {
        type: 'vector',
        url: 'mapbox://davidkane.7cyqthwr',
    });
    map.addLayer({
        'id': 'sedldata',
        'source': 'sedldata',
        'source-layer': 'msoa_data',
        'type': 'fill',
        'layout': {},
        // 'filter': ['==', ['get', 'left_behind'], 'Y'],
        'paint': {
            'fill-color': interpolateField(currentField),
            'fill-opacity': 0.5,
            'fill-antialias': false,
        },
    });
    map.addLayer({
        'id': 'sedldata-highlight',
        'source': 'sedldata',
        'source-layer': 'msoa_data',
        'type': 'line',
        'layout': {},
        'filter': ['==', ['get', 'msoa11cd'], ''],
        'paint': {
            'line-color': '#0079b9',
            'line-width': 3,
        },
    });

    setField(map, currentField);
});


// Create a popup, but don't add it to the map yet.
var popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});
var areaDisplay = document.getElementById('area-display');

map.on('mousemove', 'sedldata', function (e) {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = 'pointer';
});

map.on('click', 'sedldata', function (e) {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = 'pointer';

    var features = map.queryRenderedFeatures(e.point);

    var displayFeaturesText = `<h2 class="pa0 ma0 mb2">${features[0].properties.MSOA11HCLNM}</h2>
        <h3 class="pa0 ma0 mb2"><span class="f6 gray normal"> in </span>${features[0].properties.UTLANM }</h3>
        <ul class="list pa0 ma0 flex flex-wrap">`
    Object.entries(FIELDS).forEach(([key, value]) => {
        if (features[0].properties[key]){
            var v = features[0].properties[key];
            if (value.nformat){
                v = value.nformat(features[0].properties[key]);
            }
            displayFeaturesText += `<li class="pa0 ma0 pr3 w-100 f5">
                <strong class="f6">${value.name}</strong><br>${v}
            </p>`
        }
    });
    displayFeaturesText += `</ul>`;

    if (features[0].properties.MSOA11HCLNM){
        // popup
        //     .setLngLat(e.lngLat)
        //     .setHTML(displayFeaturesText)
        //     .addTo(map);
        areaDisplay.innerHTML = displayFeaturesText;
        map.setFilter('sedldata-highlight', ['==', ['get', 'msoa11cd'], features[0].properties.msoa11cd]);
    } else {
        // popup.remove();
        areaDisplay.innerHTML = '';
        map.setFilter('sedldata-highlight', ['==', ['get', 'msoa11cd'], '']);
    }
});

map.on('mouseleave', 'sedldata', function () {
    map.getCanvas().style.cursor = '';
    popup.remove();
});