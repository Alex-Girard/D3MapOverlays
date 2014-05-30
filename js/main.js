$(window).load(function() {
    var globalMap = new GoogleMapView("#google-map-view", {
        'name': 'center',
        'group': 'POI',
        'pos': [37.77926, -122.41934],
        'color': "red"
    });
    //var restaurants = new RestaurantLoader("#restaurant", globalMap);
    var loader = new JsonPathLoader("data/districts-sf.json", "name")("#bottom-page", globalMap);
})