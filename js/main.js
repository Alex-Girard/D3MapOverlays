$(window).load(function() {
    var globalMap = new GoogleMapView(null);
    var controller = new StationController(globalMap);

    $('form input').keydown(function(event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            controller.submit();
            return false;
        }
    });
});