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
 * - Google Maps Javascript API v3
 * - Google Places API
 * - ES5 Shim
 * - ES5 Sham
 * 
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
			"placesRadius": 500
		},

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

			if($(this).attr("data-address") != "") {
				address = $(this).attr("data-address");
			}

			if(o.address == "") {
				this._setupMap(o.lat,o.lng);
			} else {
				this._geocodeAddress(o.address);
			}

			// Fix for maps all scrambled (@$!$ Google...) when using bootstrap
			$('head').append("<style>#wn * { max-width:none; }</style>");
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
		// This function uses Google Geocoder to parse the address and return
		// its LatLng coords.
		//=====================================================================
		_locationFound: function(results, status){
			if(status == "OK") {
				this._setupMap(results[0].geometry.location.nb, results[0].geometry.location.ob);
			} else {
				console.log("An error occured while geocoding the address.");
			}
		},
		_setupMap: function(lat, lng){
			var o = this.options;
			var mapOptions = {
				zoom:o.zoom,
				center: new google.maps.LatLng(lat, lng)
			}
			this.map = new google.maps.Map(this.elem, mapOptions);

			if(o.placeMainMarker) {
				this._placeMainMarker(lat, lng);
			}

			if(o.placesTypes.length > 0) {
				this._searchPlaces(lat, lng);
			}
		},
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
		_searchPlaces: function(lat, lng){
			req = {};
			req.location = new google.maps.LatLng(lat, lng);
			req.radius = this.options.placesRadius;
			req.types = this.options.placesTypes;

			this.infoWindow = new google.maps.InfoWindow();

			var service = new google.maps.places.PlacesService(this.map);
			service.nearbySearch(req, this._placesCallback.bind(this));
		},
		_placesCallback: function(results, status){
			if(status == google.maps.places.PlacesServiceStatus.OK) {
				for(var i = 0; i < results.length; i++){
					this._createPlaceMarker(results[i]);
				}
			}
		},
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

			if(!excluded){
				var placeLocation = place.geometry.location;
				var mo = {};
				mo.map = this.map;
				mo.position = placeLocation;

				if(this.options.placesTypesIcon.length > 0) {
					mo.icon = this.options.placesTypesIcon[mainType];
				}

				var marker = new google.maps.Marker(mo);

				google.maps.event.addListener(marker, 'click', function(){
					this.infoWindow.setContent(place.name);
					this.infoWindow.open(this.map, marker);
				}.bind(this));
			} 
		},
		_getType: function(types){
			var type = -1;

			for ( var i = 0; i < types.length; i++ ) {
				if(this.options.placesTypes.indexOf(types[i]) != -1) {
					type = this.options.placesTypes.indexOf(types[i]);
					break;
				}
			}

			return type;
		}
	};

	if (typeof Object.create !== 'function'){
		Object.create = function (o) {
			function F(){};
			F.prototype = o;
			return new F();
		}
	}

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






