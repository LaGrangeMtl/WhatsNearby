WhatsNearby
===========

A jQuery plugin to list and show nearby places near a certain position using Google Maps.


Dependencies
------------

- [jQuery](http://jquery.com)
- [Google Maps Javascript API v3](https://developers.google.com/maps/documentation/javascript/)
- [Google Places API](https://developers.google.com/places/)
- [ES5 Shim and Sham](https://github.com/kriskowal/es5-shim)

Basic usage
-----------

First, be sure to include all the above libraries. Then, include WhatsNearby :

    <script src="js/WhatsNearby.js" type="text/javascript"></script>

WhatsNearby must be attached to an html element :

    <div id="wn"></div>

Using jQuery, setup WhatsNearby on the selected element :

    $("#wn").whatsnearby();

You can customize WhatsNearby using an options argument (more details on all options will follow):

    $("#wn").whatsnearby({ zoom:14, address:"Montréal, Qc" });

Options
-------

	options: {
	    address: "Montréal, Qc", //A string representing a physical address, this will be used as the center of the map
	    lat: 45.509234, //The latitude coordinate of the center of the map (default if no address set)
	    lng: -73.559067, //The longitude coordinate of the center of the map (default if no address set)
	    width: 500 , //can be px or %
	    height: 500, //can be px or %
	    zoom : 8, //map zoom level
	    mapType : google.maps.MapTypeId.ROADMAP, //ROADMAP, SATELLITE, HYBRID, TERRAIN
	    placeMainMarker : true, //shows the marker for the center position of the map
	    mainMarkerIcon : "", //if set, this image will replace the default marker icon
	    placesTypes : ['store', 'gym'], //an array of places types
	    placesTypesIcon : [], //if set, those images will replace type marker icons (must match placesTypes order)
	    excludePlacesTypes : [], //an array of types that will be excluded from the search
	    placesRadius : 500 //the radius, in meters in which Places will be found
	}