/*The MIT License (MIT)

Copyright (c) 2013 Maxime Des Roches

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*
 * Dependencies
 * - jQuery
 * - Google Maps Javascript API v3
 * - Google Places API
 * - ES5 Shim
 * - ES5 Sham
 */

;(function($){
	var WhatsNearby = {

		//=====================================================================
		// init : Public Function
		//
		// @params : options
		//		The various parameters (see this.options) passed to WhatsNearby.
		//
		// @params : elem
		//		Element which will be transformed into a WhatsNearby map.
		//
		// This function initialize WhatsNearby.
		//=====================================================================
		init: function(options, elem){
			this.options = $.extend({},this.options,options);

			this.elem = elem;
			this.$elem = $(elem);

			this._build();

			return this;
		},

		options:{
			"address": "",
			"lat": 45.509234,
			"lng": -73.559067,
			"width": 500,
			"height": 500,
			"zoom":8,
			"mapType": google.maps.MapTypeId.ROADMAP,
			"placeMainMarker": true,
			"mainMarkerIcon": "",
			"placesTypes": [],
			"placesTypesIcon": [],
			"excludePlacesTypes": [],
			"excludeByKeywords": [],
			"placesRadius": 500,
			"disableDefaultUI": false,
			"style": [],
			"scrollwheel":true,
			"backgroundColor": "#000000"
		},

		_markup: "<div class='infowindow-markup'><strong>{{name}}</strong>{{vicinity}}</div>",

		//=====================================================================
		// _build : Private Function
		//
		// This function checks for an address passed as an attribute
		// (data-address) to the element. If no address is found and the address
		// option is not set, it uses the lat and lng options to setup the map.
		// If an address is found, we geocode it to get the LatLng coords.
		//=====================================================================
		_build: function(){
			var o = this.options;
			$(this.elem).width(o.width).height(o.height);

			google.maps.visualRefresh = true;

			if($(this.elem).attr("data-address")) {
				o.address = $(this.elem).attr("data-address");
			}

			if($(this.elem).html() != "") {
				this._markup = $(this.elem).html();
				$(this.elem).html("");
			}

			if(o.address == "") {
				this._setupMap(o.lat,o.lng);
			} else {
				this._geocodeAddress(o.address);
			}

			// Fix for maps all scrambled (@$!$ Google...) when using bootstrap
			$('head').append("<style>#"+$(this.elem).attr('id')+" * { max-width:none; }</style>");
		},

		//=====================================================================
		// _geocodeAddress : Private Function
		//
		// @params : address
		//		String representing a physical address (Eg: 1234 Brown St, Mtl)
		//
		// This function uses Google Geocoder to parse the address and return
		// its LatLng coords.
		//=====================================================================
		_geocodeAddress: function(address){
			var geocoder = new google.maps.Geocoder();
			geocoder.geocode({ "address": address}, this._locationFound.bind(this) );
		},

		//=====================================================================
		// _locationFound : Private Function
		//
		// @params : address
		//		String representing a physical address (Eg: 1234 Brown Street, 
		//		Mtl)
		//
		// This function uses Google Geocoder to parse the address and returns
		// its LatLng coords.
		//=====================================================================
		_locationFound: function(results, status){
			if(status == "OK") {
				this._setupMap(results[0].geometry.location.lat(), results[0].geometry.location.lng());
			} else {
				console.log("An error occured while geocoding the address.");
			}
		},

		//=====================================================================
		// _setupMap : Private Function
		//
		// @params : lat
		//		Number value containing the latitude coordinate of a position
		//
		// @params : lng
		//		Number value containing the longitude coordinate of a position
		//
		// Using Lat and Lng passed as parameters, this function generates a
		// Google Map. It places a marker on the center position (if 
		// placeMainMarker is set in the options) and searches for Places around
		// the center of the map (again only if places types are passed in 
		// options).
		// 
		//=====================================================================
		_setupMap: function(lat, lng){
			var o = this.options;
			var mapOptions = {
				zoom:o.zoom,
				mapTypeId: this.options.mapType,
				center: new google.maps.LatLng(lat, lng),
				disableDefaultUI: this.options.disableDefaultUI,
				backgroundColor: this.options.backgroundColor,
				scrollwheel: this.options.scrollwheel
			}
			this.map = new google.maps.Map(this.elem, mapOptions);

			this.map.set('styles', this.options.style);

			if(o.placeMainMarker) {
				this._placeMainMarker(lat, lng);
			}

			if(o.placesTypes.length > 0) {
				this._searchPlaces(lat, lng);
			}
		},

		//=====================================================================
		// _placeMainMarker : Private Function
		//
		// @params : lat
		//		Number value containing the latitude coordinate of a position
		//
		// @params : lng
		//		Number value containing the longitude coordinate of a position
		//
		// Using Lat and Lng passed as parameters, this function places a main
		// marker on the map using the passed position. A custom icon can be set
		// by passing an url to the mainMarkerIcon option.
		// 
		//=====================================================================
		_placeMainMarker: function(lat, lng){
			var mo = {};
			mo.map = this.map;
			mo.draggable = false;
			mo.animation = google.maps.Animation.DROP;
			mo.position = new google.maps.LatLng(lat, lng);

			if (this.options.mainMarkerIcon != "") {
				mo.icon = this.options.mainMarkerIcon;
			}

			var marker = new google.maps.Marker(mo);
		},

		//=====================================================================
		// _searchPlaces : Private Function
		//
		// @params : lat
		//		Number value containing the latitude coordinate of a position
		//
		// @params : lng
		//		Number value containing the longitude coordinate of a position
		//
		// Using Lat and Lng passed as parameters, this function searches for
		// nearby places (using Google Places API). Types of places can be 
		// filtered 
		// 
		//=====================================================================
		_searchPlaces: function(lat, lng){
			req = {};
			req.location = new google.maps.LatLng(lat, lng);
			req.radius = this.options.placesRadius;
			req.types = this.options.placesTypes;

			this.infoWindow = new google.maps.InfoWindow();

			var service = new google.maps.places.PlacesService(this.map);
			service.nearbySearch(req, this._placesCallback.bind(this));
		},

		//=====================================================================
		// _placesCallback : Private Function
		//
		// @params : results
		//		A JSON object containing all places found.
		//
		// @params : status
		//		Status of the request (successful or not)
		//
		// This function creates markers on the map using the information
		// contained in the JSON object result.
		// 
		//=====================================================================
		_placesCallback: function(results, status){
			if(status == google.maps.places.PlacesServiceStatus.OK) {
				for(var i = 0; i < results.length; i++){
					this._createPlaceMarker(results[i]);
				}
			}
		},

		//=====================================================================
		// _createPlaceMarker : Private Function
		//
		// @params : place
		//		A JSON object containing the information of a place (Places API)
		//
		// This function filters the places excluding those containing types in
		// the excludePlacesTypes option. If the place is not excluded, it 
		// creates a marker and sets the content of the infowindow upon a click.
		// 
		//=====================================================================
		_createPlaceMarker: function(place){
			var excluded = false;

			var mainType = this._getType(place.types);

			for (var i = 0; i < this.options.excludePlacesTypes.length; i++) {
				for(var j = 0; j < place.types.length; j++) {
					if(this.options.excludePlacesTypes[i] == place.types[j]){
						excluded = true;
					}
				}
			};

			for (i = 0; i < this.options.excludeByKeywords.length; i++) {
				if(place.name.toLowerCase().indexOf(this.options.excludeByKeywords[i].toLowerCase()) >= 0){
					excluded = true;
				}
			}
			
			if(!excluded){
				var placeLocation = place.geometry.location;
				var mo = {};
				mo.map = this.map;
				mo.position = placeLocation;

				if(this.options.placesTypesIcon.length > 0) {
					mo.icon = this.options.placesTypesIcon[mainType];
				}

				var marker = new google.maps.Marker(mo);
				marker.place = this._parseMarkup(place);

				google.maps.event.addListener(marker, 'click', function(){
					this.infoWindow.setContent(marker.place);
					this.infoWindow.open(this.map, marker);
				}.bind(this));
			}
		},

		//=====================================================================
		// _parseMarkup : Private Function
		//
		// @params : place
		//		A JSON object containing the information of a place (Places API)
		//
		// This function uses the markup passed in the containing div or the
		// default markup (this._markup) and changes the placeholders to the
		// relevent variables contained within the places object.
		//
		// Any variable can be accessed ex: {{geometry.location.ob}} will return
		// the latitude of the place object.
		// 
		//=====================================================================
		_parseMarkup: function(place){
			return this._markup.replace(/{{([^}]+)}}/g, function(match, placeholder, offset, s){
				var a = placeholder.split(".");
				var iterations = a.length;
				var temp = place;
				for (var i = 0; i < iterations; i++) {
					temp = temp[a[i]];
					if(!temp) break;
				}
				return temp ? temp : "";
			});
		},

		//=====================================================================
		// _getType : Private Function
		//
		// @params : types
		//		An array containing types of places
		//
		// This function return the index of a matched type between the parameter
		// and the placesTypes option.
		// 
		//=====================================================================
		_getType: function(types){
			var type = -1;

			for ( var i = 0; i < types.length; i++ ) {
				if(this.options.placesTypes.indexOf(types[i]) != -1) {
					type = this.options.placesTypes.indexOf(types[i]);
					break;
				}
			}

			return type;
		},

		//=====================================================================
		// resize : Public Function
		//
		// This function asks Google API to resize the map (helps with rendering
		// issues)
		// 
		//=====================================================================
		resize: function(){
			google.maps.event.trigger(this.map, "resize");
		}
	};

	$.fn.whatsnearby = function(options) {
		if(this.length) {
			return this.each(function(){
				var wn = Object.create(WhatsNearby);
				wn.init(options, this);
				$.data(this, 'whatsnearby', wn);
			})
		}
	}
})(jQuery);






