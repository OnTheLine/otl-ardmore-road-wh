// set initial center point, zoom, and layers
var startCenter = [41.7664725937752, -72.73301216877707]; // Ardmore Road and Milton Street, West Hartford
var minLatLng = [41.75489626185603, -72.74478706615103]; // S Main and Boulevard
var maxLatLng = [41.77205393621194, -72.71328720395834]; // Prospect & Fern
var bounds = L.latLngBounds(minLatLng, maxLatLng);
var startZoom = 17;
var minZoom = 15;
var layer1 = 'sanborn1917';
var layer2 = 'sanborn1923';

// define baselayers and insert further below, and also in index.html
var sanborn1917 = new L.tileLayer("https://mapwarper.net/maps/tile/55434/{z}/{x}/{y}.png", {
  attribution: '<a href="https://www.loc.gov/item/sanborn01132_004/" target="_blank">1917 Sanborn-LOC</a>'
});

var sanborn1923 = new L.tileLayer("https://mapwarper.net/maps/tile/55433/{z}/{x}/{y}.png", {
  attribution: '<a href="https://www.loc.gov/item/sanborn01194_001/" target="_blank">1923 Sanborn-LOC</a>'
});

// https://esri.github.io/esri-leaflet/api-reference/layers/basemap-layer.html
var esriImagery = L.esri.basemapLayer('Imagery');
var esriTransportation = L.esri.basemapLayer('ImageryTransportation');
var esriLabels = L.esri.basemapLayer('ImageryLabels');
var esriPresent = [esriImagery, esriTransportation, esriLabels];

// Check for permalink: If address string contains '#', process parameters after the '#'
var addr = window.location.href;

if (addr.indexOf('#') !== -1) {
  var sep = (addr.indexOf('&amp;') !== -1) ? '&amp;' : '&';
  var params = window.location.href.split('#')[1].split(sep);

  params.forEach(function(k) {
    z = k.split('=');

    switch (z[0]) {
      case 'zoom':
        startZoom = z[1];
        break;
      case 'lat':
        startCenter[0] = z[1];
        break;
      case 'lng':
        startCenter[1] = z[1];
        break;
      case 'layer1':
        layer1 = z[1];
        $('#map1basemaps option[value="' + layer1 + '"]').prop('selected', true);
        $('#map2basemaps option').removeAttr('disabled');
        $('#map2basemaps option[value="' + layer1 + '"]').prop('disabled', true);
        break;
      case 'layer2':
        layer2 = z[1];
        $('#map2basemaps option[value="' + layer2 + '"]').prop('selected', true);
        $('#map1basemaps option').removeAttr('disabled');
        $('#map1basemaps option[value="' + layer2 + '"]').prop('disabled', true);
        break;
      default:
        break;
    }
  });
}

// Insert basemap variables; return layer named s
function pickLayer(s) {
  switch (s) {
    case 'sanborn1917':
      return sanborn1917;
    case 'sanborn1923':
      return sanborn1923;
    case 'esriPresent':
      return esriPresent;
    default:
      return esriPresent;
  }
}

// Create two maps
var map1 = L.map('map1', {
    layers: pickLayer(layer1),
    center: startCenter,
    zoom: startZoom,
    zoomControl: false,
    minZoom: minZoom,
    scrollWheelZoom: false,
    tap: false,
    maxBounds: [minLatLng,maxLatLng]
});

var map2 = L.map('map2', {
    layers: pickLayer(layer2),
    center: startCenter,
    zoom: startZoom,
    minZoom: minZoom,
    zoomControl: false,
    scrollWheelZoom: false,
    tap: false,
    maxBounds: [minLatLng,maxLatLng]
});

// customize link to view source code; add your own GitHub repository
map1.attributionControl
  .setPrefix('View <a href="http://github.com/ontheline/otl-development-wh" target="_blank">code on GitHub</a>');

// Reposition zoom control other than default topleft
L.control.zoom({position: "topright"}).addTo(map1);
L.control.zoom({position: "topright"}).addTo(map2);

L.control.scale().addTo(map2);

// create the geocoding control, add to map 2, display markers
var searchControl = L.esri.Geocoding.geosearch({
  position: 'topright',
  //useMapBounds: true,
  searchBounds: bounds,
}).addTo(map2);

// create an empty layer group to store the results and add it to the map
var results = L.layerGroup().addTo(map2);

// listen for the results event and add every result to the map
searchControl.on("results", function(data) {
  results.clearLayers();
  for (var i = data.results.length - 1; i >= 0; i--) {
    results.addLayer(
      L.marker(data.results[i].latlng).bindPopup( data.results[i].text )
    );
  }
  // Open popups
  results.eachLayer(function(l) { l.openPopup() })
});

// sync maps using Leaflet.Sync code
map1.sync(map2);
map2.sync(map1);

function changeBasemap(map, basemap) {
  var other_map = (map === 'map1') ? 'map2' : 'map1';
  var map = (map === 'map1') ? map1 : map2;

  // Disable selected layer on the neighbor map
  // (if two maps load the same layer, weird behavior observed)
  $('#' + other_map + 'basemaps option').removeAttr('disabled');
  $('#' + other_map + 'basemaps option[value="' + basemap + '"]').attr('disabled', 'disabled');

  // Remove the old layer(s) -- insert all basemap variables
  [esriImagery,
   esriTransportation,
   esriLabels,
   sanborn1917,
   sanborn1923
 ].forEach(function(v) {
    map.removeLayer(v);
  });

  // Add appropriate new layer -- insert all basemap variables
  switch (basemap) {
    case 'esriPresent':
      map.addLayer(esriImagery);
      map.addLayer(esriTransportation);
      map.addLayer(esriLabels);
      break;
    case 'sanborn1917':
      map.addLayer(sanborn1917);
      break;
    case 'sanborn1923':
      map.addLayer(sanborn1923);
      break;
    default:
      break;
  }
}

// Set up to create permalink
$(document).ready(function() {
  $('#map1basemaps select').change(function() {
    changeBasemap('map1', $(this).val());
  });

  $('#map2basemaps select').change(function() {
    changeBasemap('map2', $(this).val());
  });

  // Generate permalink on click
  $('#permalink').click(function() {
    var zoom = map1._zoom;
    var lat = map1.getCenter().lat;
    var lng = map1.getCenter().lng;
    var layer1 = $('#map1basemaps select').val();
    var layer2 = $('#map2basemaps select').val();
    var href = '#zoom=' + zoom + '&lat=' + lat + '&lng=' +
                  lng + '&layer1=' + layer1 + '&layer2=' + layer2;
    // Update URL in browser
    window.location.hash = href;
    window.prompt("Copy with Cmd+C (Mac) or Ctrl+C", window.location.href);
  });

});
