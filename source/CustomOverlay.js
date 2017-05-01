'format es6';
'use strict';

import $ from 'jquery';

const google = window.google;

function CustomOverlay(options, markersList, onDrawDoneCb, onClickMarker) {
	this.firstDraw = true;
	this.markersList = markersList;
	this.setValues(options);
	this.markerLayer = $('<div />').addClass('customOverlay');
	this.onDrawDoneCb = onDrawDoneCb;
	this.onClickMarker = onClickMarker;
}

if (google) {
	CustomOverlay.prototype = new google.maps.OverlayView();
}

CustomOverlay.prototype.onAdd = function onAdd() {
	const $pane = $(this.getPanes().overlayImage); // Pane 3
	$pane.append(this.markerLayer);
};

CustomOverlay.prototype.onRemove = function onRemove() {
	this.markerLayer.remove();
};

CustomOverlay.prototype.draw = function draw() {
	const projection = this.getProjection();
	const fragment = document.createDocumentFragment();

	if (this.firstDraw) {
		this.markerLayer.empty(); // Empty any previous rendered markers

		this.markersList.forEach((marker) => {
			const pos = projection.fromLatLngToDivPixel(new google.maps.LatLng(marker.location.lat, marker.location.lng));
			const $point = $(`<div class="wn-map-point" style="left:${pos.x}px;top:${pos.y}px;"/>'`);
			marker.node = $point;
			marker.node.data('marker', marker);

			if (this.onClickMarker) {
				$point.on('click.customoverlay', this.onClickMarker);
			}

			// Append the HTML to the fragment in memory
			fragment.appendChild($point.get(0));
		});

		// Now append the entire fragment from memory onto the DOM
		this.markerLayer.append(fragment);

		if (this.onDrawDoneCb) this.onDrawDoneCb();

		this.firstDraw = false;
	} else {
		this.markersList.forEach((marker) => {
			const pos = projection.fromLatLngToDivPixel(new google.maps.LatLng(marker.location.lat, marker.location.lng));
			marker.node.css({
				left: pos.x,
				top: pos.y,
			});
		});
	}

};

module.exports = CustomOverlay;
