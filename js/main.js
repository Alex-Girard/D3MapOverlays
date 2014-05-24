$(window).load(function() {
    var globalMap = new GoogleMapView("#google-map-view", {
        'name': 'center',
        'group': 'POI',
        'pos': [37.77926, -122.41934],
        'color': "red"
    });
    var canvasLayer = new GoogleMapCanvasLayer(globalMap, "shader/food.vert", "shader/food.frag");
    var stations = new StationLoader("#bottom-page", globalMap);
    var districts = new DistrictLoader("#bottom-page", globalMap);
})