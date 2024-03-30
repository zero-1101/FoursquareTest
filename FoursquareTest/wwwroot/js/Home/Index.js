
mapboxgl.accessToken = 'pk.eyJ1IjoiemVyby1tYXBib3giLCJhIjoiY2x1ZG5vbDBnMDNhZjJqbnR0NTFuajllMSJ9.3X0MCU_HDIT8hNYwn3jQDg';

const monument = [-77.0353, 38.8895];

const map = new mapboxgl.Map({
    container: 'map', // container ID
    // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
    //style: 'mapbox://styles/mapbox/light-v11',
	//center: [-74.5, 40], // starting position [lng, lat]
    //   zoom: 9, // starting zoom
    center: monument,
    zoom: 15,
    //pitch: 45,
    //bearing: -17.6,
    container: 'map',
    antialias: true
});

map.addControl(new mapboxgl.GeolocateControl());
map.addControl(new mapboxgl.ScaleControl({
    maxWidth: 80,
    unit: 'metric'
}));
map.addControl(new mapboxgl.NavigationControl({
    showCompass: true,
    visualizePitch: true,
    showZoom: true,

}));

// create the popup
const popup = new mapboxgl.Popup({ offset: 25 }).setText(
    'Construction on the Washington Monument began in 1848.'
);

// create DOM element for the marker
const el = document.createElement('div');
el.id = 'marker';

// create the marker
new mapboxgl.Marker(el)
    .setLngLat(monument)
    .setPopup(popup) // sets a popup on this marker
    .addTo(map);

//// Set marker options.
//const marker = new mapboxgl.Marker({
//    color: "red",
//    draggable: true
//}).setLngLat([-77.0353, 38.8894])
//    .addTo(map);

map.on('style.load', () => {
	map.setConfigProperty('basemap', 'lightPreset', 'day');
});

map.on('style.load', () => {
	map.setConfigProperty('basemap', 'showPointOfInterestLabels', true);
});
