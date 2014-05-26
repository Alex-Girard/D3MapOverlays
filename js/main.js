$(window).load(function() {
    var globalMap = new GoogleMapView("#google-map-view", {
        'name': 'center',
        'group': 'POI',
        'pos': [37.77926, -122.41934],
        'color': "red"
    });
    var stations = new StationLoader("#bottom-page", globalMap);
    var districts = new DistrictLoader("#bottom-page", globalMap);
    var restaurants = new RestaurantLoader("#bottom-page", globalMap);
})