var globalMap = new GoogleMapView(null);
var StationController = new StationController(globalMap);

// prevent submit when pressing <enter>
$(document).ready(function() {
    $('form input').keydown(function(event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            StationController.submit();
            return false;
        }
    });
});