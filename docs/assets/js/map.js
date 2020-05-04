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

// add imd2019
map.on('load', function () {
    map.addSource('sedldata', {
        type: 'vector',
        url: 'mapbox://davidkane.9mlhlenp',
    });
    map.addLayer({
        'id': 'sedldata',
        'source': 'sedldata',
        'source-layer': 'wards_2017_extra',
        'type': 'fill',
        // 'filter': ['==', ['get', 'left_behind'], 'Y'],
        'paint': {
            'fill-color': [
                "interpolate",
                ["linear"],
                ["get", "sales_yoy_change_total_2020_04_21"],
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
            ],
            'fill-opacity': 0.5,
        },
    });
});


// Create a popup, but don't add it to the map yet.
var popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});

map.on('mousemove', 'sedldata', function (e) {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = 'pointer';

    var features = map.queryRenderedFeatures(e.point);

    var displayFeaturesText = `<h2 class="pa0 ma0 f6 b">
                ${features[0].properties.wd17nm}
            </h2>
            <p>Vulnerability quintile: ${features[0].properties.vulnerability_quintile}</p>
            <p>YOY change in all sales: ${features[0].properties.sales_yoy_change_total_2020_04_21}%</p>
            <p>YOY change in grocery sales: ${features[0].properties.sales_yoy_change_grocery_2020_04_21}%</p>
            `

    // Populate the popup and set its coordinates
    // based on the feature found.
    popup
        .setLngLat(e.lngLat)
        .setHTML(displayFeaturesText)
        .addTo(map);
});

map.on('mouseleave', 'sedldata', function () {
    map.getCanvas().style.cursor = '';
    popup.remove();
});