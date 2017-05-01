WhatsNearby
===========

A jQuery plugin to list and show nearby places around a certain position using Google Maps.

###[DEMO](http://lagrangemtl.github.io/WhatsNearby/example/index.html)

Dependencies
------------

- [jQuery](http://jquery.com)
- [Google Maps Javascript API v3](https://developers.google.com/maps/documentation/javascript/)
- [Google Places API](https://developers.google.com/places/)

Basic usage
-----------

First, be sure to include all the above libraries. Then, include WhatsNearby :
````html
<script src="js/WhatsNearby.js" type="text/javascript"></script>
````

WhatsNearby must be attached to an html element :
````html
<div id="wn"></div>
````

Using jQuery, setup WhatsNearby on the selected element :
````js
$("#wn").whatsnearby();
````

You can customize WhatsNearby using an options argument (more details on all options will follow):
````js
$("#wn").whatsnearby({ zoom:14, address:"Montréal, Qc" });
````

Options
-------
````js
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
    excludeByKeywords: [], //an array of string that will be excluded from the search (name of the place)
    placesRadius : 500 //the radius, in meters in which Places will be found
    disableDefaultUI: false,
    style: [], // pasted from https://snazzymaps.com/
    draggable:true, // Can you drag the map around
    scrollwheel:true, // Deactivate scrollwheel (very useful for mobile users!)
    backgroundColor: "#000000", // Background color under the map
    markercluster: false, // requires markercluster.js
    markerclusterStyles: [], // requires markercluster.js
    markerclusterOptions: {}, // requires markercluster.js
    centerOffsetX: 0, // offsets the center of the map
    centerOffsetY: 0,
    useInfoBox: false, // uses InfoBox to customize Info Windows
    infoBoxOptions: {}
},
````


To show custom markers overlayed on the map, use the Custom Overlay helper :

```
Sample marker:
    {
        id: int,
        location: {
            lat: float,
            lng: float,
            latlng: google.maps.LatLng
        }
    }
```
```const OverlayMap = new CustomOverlay({ map: wn.map }, markersList, null, onClickMarker);```