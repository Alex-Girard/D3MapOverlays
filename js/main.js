$(window).load(function() {
    var globalMap = new GoogleMapView("#google-map-view", {
        'name': 'center',
        'group': 'POI',
        'pos': [37.8009, -122.43666],
        'color': "red"
    });

    var stations = new StationLoader("#bottom-page", globalMap);
})