mapboxgl.accessToken = 'pk.eyJ1IjoiZGF2aWRrYW5lIiwiYSI6ImNqcnc4Y3JrdjA5OW40NHBraWc2YmRwZDMifQ.ycu4ql_lAy-rslsdnIcq0Q';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'https://s3-eu-west-1.amazonaws.com/tiles.os.uk/v2/styles/open-zoomstack-light/style.json',
    zoom: 7,
    center: [-1.485, 52.567],
    minZoom: 7,
    maxZoom: 18,
    maxBounds: [[-8.74, 49.84], [1.96, 60.9]]
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

function interpolateField(field){
    return [
        "interpolate",
        ["linear"],
        ["get", field],
        -100, "#FA0000",
        0, "#FFFF00",
        100, "#73FF00",
        1000, "#00FF00",
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
    ]
}

// add imd2019
map.on('load', function () {

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

    map.on('drag', (ev) => {
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
        map.setPaintProperty('sedldata', 'fill-color', interpolateField(field));
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
        url: 'mapbox://davidkane.9mlhlenp',
    });
    map.addLayer({
        'id': 'sedldata',
        'source': 'sedldata',
        'source-layer': 'wards_2017_extra',
        'type': 'fill',
        'layout': {},
        // 'filter': ['==', ['get', 'left_behind'], 'Y'],
        'paint': {
            'fill-color': interpolateField("sales_yoy_change_total_2020_04_21"),
            'fill-opacity': 0.5,
            'fill-antialias': false,
        },
    });
    map.addLayer({
        'id': 'sedldata-highlight',
        'source': 'sedldata',
        'source-layer': 'wards_2017_extra',
        'type': 'line',
        'layout': {},
        'filter': ['==', ['get', 'wd17cd'], ''],
        'paint': {
            'line-color': '#0079b9',
            'line-width': 3,
        },
    });
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

    var displayFeaturesText = `<h2 class="pa0 ma0 b">
                ${features[0].properties.wd17nm}
            </h2>
            <p class="pa0 mv0 ml0 mr3 dib">Vulnerability quintile: ${features[0].properties.vulnerability_quintile}</p>
            <p class="pa0 mv0 ml0 mr3 dib">YOY change in all sales: ${features[0].properties.sales_yoy_change_total_2020_04_21}%</p>
            <p class="pa0 mv0 ml0 mr3 dib">YOY change in grocery sales: ${features[0].properties.sales_yoy_change_grocery_2020_04_21}%</p>
            `

    if (features[0].properties.wd17nm){
        // popup
        //     .setLngLat(e.lngLat)
        //     .setHTML(displayFeaturesText)
        //     .addTo(map);
        areaDisplay.innerHTML = displayFeaturesText;
        map.setFilter('sedldata-highlight', ['==', ['get', 'wd17cd'], features[0].properties.wd17cd]);
    } else {
        // popup.remove();
        areaDisplay.innerHTML = '';
        map.setFilter('sedldata-highlight', ['==', ['get', 'wd17cd'], '']);
    }
});

map.on('mouseleave', 'sedldata', function () {
    map.getCanvas().style.cursor = '';
    popup.remove();
});