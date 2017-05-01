'format es6';
'use strict';

/*The MIT License (MIT)

Copyright (c) 2017 Maxime Des Roches

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

import $ from 'jquery';

const google = window.google;
const MarkerClusterer = window.MarkerClusterer;
const InfoBox = window.InfoBox;

function WhatsNearby() {

	this.options = {
		address: '',
		lat: 45.509234,
		lng: -73.559067,
		width: 500,
		height: 500,
		zoom: 8,
		bounds: null,
		mapType: 'roadmap',
		placeMainMarker: true,
		mainMarkerIcon: '',
		markers: [],
		placesTypes: [],
		placesTypesIcon: [],
		excludePlacesTypes: [],
		excludeByKeywords: [],
		placesRadius: 500,
		disableDefaultUI: false,
		streetViewControl: false,
		mapTypeControl: false,
		style: [],
		draggable: true,
		scrollwheel: true,
		backgroundColor: '#000000',
		markercluster: false, // requires markercluster.js
		markerclusterStyles: [], // requires markercluster.js
		markerclusterOptions: {},
		centerOffsetX: 0,
		centerOffsetY: 0,
		useInfoBox: false,
		infoBoxOptions: {},
		onBoundsChanged: null,
		markerVisibleHook: () => true,
	};

	//=====================================================================
	// init : Public Function
	//
	// @params : options
	//      The various parameters (see this.options) passed to WhatsNearby.
	//
	// @params : elem
	//      Element which will be transformed into a WhatsNearby map.
	//
	// This function initialize WhatsNearby.
	//=====================================================================
	this.init = (options, elem) => {
		this.options = $.extend({}, this.options, options);

		this.elem = elem[0];
		this.$elem = elem;

		this._markers = [];

		this._build();

		return this;
	};

	this._markup = "<div class='infowindow-markup'><strong>{{name}}</strong>{{vicinity}}</div>";

	//=====================================================================
	// _build : Private Function
	//
	// This function checks for an address passed as an attribute
	// (data-address) to the element. If no address is found and the address
	// option is not set, it uses the lat and lng options to setup the map.
	// If an address is found, we geocode it to get the LatLng coords.
	//=====================================================================
	this._build = () => {
		const o = this.options;
		$(this.elem).width(o.width).height(o.height);

		google.maps.visualRefresh = true;

		if ($(this.elem).attr('data-address')) {
			o.address = $(this.elem).attr('data-address');
		}

		if ($(this.elem).attr('data-lat') && $(this.elem).attr('data-lng')) {
			o.lat = $(this.elem).attr('data-lat');
			o.lng = $(this.elem).attr('data-lng');
		}

		if ($(this.elem).html() !== '') {
			this._markup = $(this.elem).html();
			$(this.elem).html('');
		}

		if (o.address === '') {
			let { lat, lng } = o;
			if (o.bounds) {
				const center = o.bounds.getCenter();
				lat = center.lat();
				lng = center.lng();
			}
			this._setupMap(lat, lng, o.bounds);
		} else {
			this._geocodeAddress(o.address);
		}

		// Fix for maps all scrambled (@$!$ Google...) when using bootstrap
		$('head').append(`<style>#${$(this.elem).attr('id')} * { max-width:none; }</style>`);
	};

	//=====================================================================
	// _geocodeAddress : Private Function
	//
	// @params : address
	//      String representing a physical address (Eg: 1234 Brown St, Mtl)
	//
	// This function uses Google Geocoder to parse the address and return
	// its LatLng coords.
	//=====================================================================
	this._geocodeAddress = (address) => {
		const geocoder = new google.maps.Geocoder();
		geocoder.geocode({ address }, this._locationFound.bind(this));
	};

	//=====================================================================
	// _locationFound : Private Function
	//
	// @params : address
	//      String representing a physical address (Eg: 1234 Brown Street,
	//      Mtl)
	//
	// This function uses Google Geocoder to parse the address and returns
	// its LatLng coords.
	//=====================================================================
	this._locationFound = (results, status) => {
		if (status === 'OK') {
			this._setupMap(results[0].geometry.location.lat(), results[0].geometry.location.lng());
		} else {
			console.log('An error occured while geocoding the address.');
		}
	};

	//=====================================================================
	// _setupMap : Private Function
	//
	// @params : lat
	//      Number value containing the latitude coordinate of a position
	//
	// @params : lng
	//      Number value containing the longitude coordinate of a position
	//
	// @params: bounds
	//	type google.maps.LatLngBounds used to center/zoom the map on a list of points
	//
	// Using Lat and Lng passed as parameters, this function generates a
	// Google Map. It places a marker on the center position (if
	// placeMainMarker is set in the options) and searches for Places around
	// the center of the map (again only if places types are passed in
	// options).
	//
	//=====================================================================
	this._setupMap = (lat, lng, bounds) => {
		const o = this.options;
		const mapOptions = {
			zoom: o.zoom,
			mapTypeId: this.options.mapType,
			center: new google.maps.LatLng(lat, lng),
			disableDefaultUI: this.options.disableDefaultUI,
			backgroundColor: this.options.backgroundColor,
			scrollwheel: this.options.scrollwheel,
			draggable: this.options.draggable,
			streetViewControl: this.options.streetViewControl,
			mapTypeControl: this.options.mapTypeControl,
		};

		this.map = new google.maps.Map(this.elem, mapOptions);
		if (bounds) this.map.fitBounds(bounds);

		let offsetOnce = false;

		this.map.addListener('bounds_changed', (e) => {
			if (!offsetOnce) {
				this._offsetCenter(
					mapOptions.center,
					this.options.centerOffsetX,
					this.options.centerOffsetY
				);
				offsetOnce = true;
			}

			if (this.options.onBoundsChanged) {
				this.options.onBoundsChanged(e, this.map, this._markers);
			}
		});

		this.map.addListener('idle', this.showMarkers.bind(this));
		this.map.addListener('zoom_changed', () => {
			this.$elem.attr('data-zoom', this.map.zoom);
		});
		this.$elem.attr('data-zoom', this.map.zoom);

		this.map.set('styles', this.options.style);

		if (o.placeMainMarker) {
			this._placeMainMarker(lat, lng);
		}

		if (o.placesTypes.length > 0) {
			this._searchPlaces(lat, lng);
		}

		//adds custom predefined markers
		if (o.markers && o.markers.length > 0) {
			o.markers.forEach(this._createCustomMarker.bind(this));
		}

		if (this.options.markercluster && MarkerClusterer) {
			this._markerCluster = new MarkerClusterer(
				this.map,
				this._markers,
				this.options.markerclusterOptions
			);
			if (this.options.markerclusterStyles) {
				this._markerCluster.setStyles(this.options.markerclusterStyles);
			}
		}
	};

	this.showMarkers = () => {
		const bounds = this.map.getBounds();

		const filtered = this._markers.filter((marker) => {
			const isVisible = this.options.markerVisibleHook(marker);
			if (!isVisible) marker.setMap(null);
			return isVisible;
		});
		filtered.forEach((marker) => {
			if (bounds.contains(marker.getPosition())) {
				if (marker.getMap() === null) {
					marker.setMap(this.map);
				}
			} else {
				marker.setMap(null);
			}
		});
	};

	//=====================================================================
	// _createCustomMarker : Private Function
	//
	// @params : marker
	//      A JSON object containing the information
	//      {
	//          location: {lat:x, lng:x},
	//			getInfoWindowMarkup: callback that returns the markup of the infowindow.
	//			That callback, since it can load info by ajax, also has a callback to
	//			call that opens the window
	//      }
	//
	// This function adds a custom marker, set by a lat & lng, and adds a click event on it
	//
	//=====================================================================
	this._createCustomMarker = (markerDefinition) => {
		const mo = {};
		mo.map = null;//this.map;
		mo.position = markerDefinition.location;
		mo.icon = markerDefinition.icon;
		mo.label = (markerDefinition.label) ? markerDefinition.label : '';
		this.infoWindow = this.infoWindow || (
			(this.options.useInfoBox) ?
				new InfoBox(this.options.infoBoxOptions) : new google.maps.InfoWindow()
		);
		const marker = new google.maps.Marker(mo);
		const processCb = (cnt) => {
			this.infoWindow.setContent(cnt);
			this.infoWindow.open(this.map, marker);
		};
		google.maps.event.addListener(marker, 'click', () => {
			markerDefinition.getInfoWindowMarkup.call(markerDefinition, processCb);
		});
		marker.definition = markerDefinition;
		this._markers.push(marker);
	};

	//=====================================================================
	// _placeMainMarker : Private Function
	//
	// @params : lat
	//      Number value containing the latitude coordinate of a position
	//
	// @params : lng
	//      Number value containing the longitude coordinate of a position
	//
	// Using Lat and Lng passed as parameters, this function places a main
	// marker on the map using the passed position. A custom icon can be set
	// by passing an url to the mainMarkerIcon option.
	//
	//=====================================================================
	this._placeMainMarker = (lat, lng) => {
		const mo = {};
		mo.map = (this.options.placeMainMarker) ? this.map : null;
		mo.draggable = false;
		mo.animation = google.maps.Animation.DROP;
		mo.position = new google.maps.LatLng(lat, lng);

		if (this.options.mainMarkerIcon !== '') {
			mo.icon = this.options.mainMarkerIcon;
		}

		if (this.mainMarker) {
			this.mainMarker.setMap(null);
		}

		this.mainMarker = new google.maps.Marker(mo);
	};

	//=====================================================================
	// moveMainMarker : Public Function
	//
	// @params : lat
	//      Number value containing the latitude coordinate of a position
	//
	// @params : lng
	//      Number value containing the longitude coordinate of a position
	//
	// @params : show
	//      Boolean value affecting the visibility of the marker
	//
	// @params : zoom
	//      Int value setting the map zoom
	//
	//=====================================================================
	this.moveMainMarker = (lat, lng, show, zoom) => {
		this.options.placeMainMarker = show;
		this._placeMainMarker(lat, lng);
		this.map.setZoom(zoom);
		this._offsetCenter(
			this.mainMarker.position,
			this.options.centerOffsetX,
			this.options.centerOffsetY
		);
	};

	//=====================================================================
	// _searchPlaces : Private Function
	//
	// @params : lat
	//      Number value containing the latitude coordinate of a position
	//
	// @params : lng
	//      Number value containing the longitude coordinate of a position
	//
	// Using Lat and Lng passed as parameters, this function searches for
	// nearby places (using Google Places API). Types of places can be
	// filtered
	//
	//=====================================================================
	this._searchPlaces = (lat, lng) => {
		const req = {};
		req.location = new google.maps.LatLng(lat, lng);
		req.radius = this.options.placesRadius;
		req.types = this.options.placesTypes;

		this.infoWindow = new google.maps.InfoWindow();

		const service = new google.maps.places.PlacesService(this.map);
		service.nearbySearch(req, this._placesCallback.bind(this));
	};

	//=====================================================================
	// _placesCallback : Private Function
	//
	// @params : results
	//      A JSON object containing all places found.
	//
	// @params : status
	//      Status of the request (successful or not)
	//
	// This function creates markers on the map using the information
	// contained in the JSON object result.
	//
	//=====================================================================
	this._placesCallback = (results, status) => {
		if (status === google.maps.places.PlacesServiceStatus.OK) {
			for (let i = 0; i < results.length; i++) {
				this._createPlaceMarker(results[i]);
			}
		}
	};

	//=====================================================================
	// _createPlaceMarker : Private Function
	//
	// @params : place
	//      A JSON object containing the information of a place (Places API)
	//
	// This function filters the places excluding those containing types in
	// the excludePlacesTypes option. If the place is not excluded, it
	// creates a marker and sets the content of the infowindow upon a click.
	//
	//=====================================================================
	this._createPlaceMarker = (place) => {
		let excluded = false;

		const mainType = this._getType(place.types);

		for (let i = 0; i < this.options.excludePlacesTypes.length; i++) {
			for (let j = 0; j < place.types.length; j++) {
				if (this.options.excludePlacesTypes[i] === place.types[j]) {
					excluded = true;
				}
			}
		}

		const name = place.name.toLowerCase();
		for (let i = 0; i < this.options.excludeByKeywords.length; i++) {
			if (name.indexOf(this.options.excludeByKeywords[i].toLowerCase()) >= 0) {
				excluded = true;
			}
		}

		if (!excluded) {
			const placeLocation = place.geometry.location;
			const mo = {};
			mo.map = null;//this.map;
			mo.position = placeLocation;

			if (this.options.placesTypesIcon.length > 0) {
				mo.icon = this.options.placesTypesIcon[mainType];
			}

			const marker = new google.maps.Marker(mo);
			marker.place = this._parseMarkup(place);

			google.maps.event.addListener(marker, 'click', () => {
				this.infoWindow.setContent(marker.place);
				this.infoWindow.open(this.map, marker);
			});

			this._markers.push(marker);
		}
	};

	//=====================================================================
	// _parseMarkup : Private Function
	//
	// @params : place
	//      A JSON object containing the information of a place (Places API)
	//
	// This function uses the markup passed in the containing div or the
	// default markup (this._markup) and changes the placeholders to the
	// relevent variables contained within the places object.
	//
	// Any variable can be accessed ex: {{geometry.location.ob}} will return
	// the latitude of the place object.
	//
	//=====================================================================
	this._parseMarkup = (place) => {
		return this._markup.replace(/{{([^}]+)}}/g, (match, placeholder) => {
			const a = placeholder.split('.');
			const iterations = a.length;
			let temp = place;
			for (let i = 0; i < iterations; i++) {
				temp = temp[a[i]];
				if (!temp) break;
			}
			return temp || '';
		});
	};

	//=====================================================================
	// _getType : Private Function
	//
	// @params : types
	//      An array containing types of places
	//
	// This function return the index of a matched type between the parameter
	// and the placesTypes option.
	//
	//=====================================================================
	this._getType = (types) => {
		let type = -1;

		for (let i = 0; i < types.length; i++) {
			if (this.options.placesTypes.indexOf(types[i]) !== -1) {
				type = this.options.placesTypes.indexOf(types[i]);
				break;
			}
		}

		return type;
	};

	//=====================================================================
	// resize : Public Function
	//
	// This function asks Google API to resize the map (helps with rendering
	// issues)
	//
	//=====================================================================
	this.resize = () => {
		google.maps.event.trigger(this.map, 'resize');
	};

	this.setCenterOffset = (offx, offy, update) => {
		this.options.centerOffsetX = offx;
		this.options.centerOffsetY = offy;
		if (update) {
			google.maps.event.trigger(this.map, 'resize');
		}
	};

	this._offsetCenter = (latlng, offsetx, offsety) => {
		const scale = Math.pow(2, this.map.getZoom());

		const worldCoordinateCenter = this.map.getProjection().fromLatLngToPoint(latlng);
		const pixelOffset = new google.maps.Point((offsetx / scale) || 0, (offsety / scale) || 0);

		const worldCoordinateNewCenter = new google.maps.Point(
			worldCoordinateCenter.x - pixelOffset.x,
			worldCoordinateCenter.y + pixelOffset.y
		);

		const newCenter = this.map.getProjection().fromPointToLatLng(worldCoordinateNewCenter);

		this.map.setCenter(newCenter);
	};
}

$.fn.whatsnearby = function whatsnearby(options) {
	if (this.length) {
		return this.each(() => {
			const wn = new WhatsNearby;
			wn.init(options, this);
			this.data('whatsnearby', wn);
		});
	}
	return null;
};
