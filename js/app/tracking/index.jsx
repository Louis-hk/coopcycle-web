import React from 'react';
import {render} from 'react-dom';
import DeliveryList from './DeliveryList.jsx';
import 'whatwg-fetch';

var _ = require('underscore');
var TWEEN = require('@tweenjs/tween.js');
var L = require('leaflet-providers');
var Polyline = require('@mapbox/polyline');
require('beautifymarker');

var map;
var deliveries = [];
var couriers = [];
var deliveryList;

var LABELS = {
  'WAITING': 'label-default',
  'DELIVERING': 'label-success',
  'PICKED': 'label-info',
  'DELIVERED': 'label-success'
}

var COLORS = {
  TURQUOISE: '#1ABC9C',
  GREEN_SEA: '#16A085',
  EMERALD: '#2ECC71',
  NEPHRITIS: '#27AE60',
  PETER_RIVER: '#3498DB',
  BELIZE_HOLE: '#2980B9',
  AMETHYST: '#9B59B6',
  WISTERIA: '#8E44AD',
  SUN_FLOWER: '#F1C40F',
  ORANGE: '#F39C12',
  CARROT: '#E67E22',
  PUMPKIN: '#D35400',
  ALIZARIN: '#E74C3C',
  POMEGRANATE: '#C0392B',
}

var infoWindows = [];
var center = {
  lat: 48.857498,
  lng: 2.335402
};
var zoom = window.mapZoom || 13;

function toPolylineCoordinates(polyline) {
  var steps = Polyline.decode(polyline);
  var polylineCoords = [];

  for (var i = 0; i < steps.length; i++) {
    var tempLocation = new L.LatLng(
      steps[i][0],
      steps[i][1]
    );
    polylineCoords.push(tempLocation);
  }

  return polylineCoords;
}

function fitToLayers() {
  var bounds = [];
  _.each(deliveries, (marker) => {
    bounds.push(marker.restaurantMarker);
    bounds.push(marker.deliveryAddressMarker);
  });
  _.each(couriers, (marker) => {
    bounds.push(marker.marker);
  });
  var group = new L.featureGroup(bounds);
  map.fitBounds(group.getBounds());
}

function removePolylines() {
  _.each(deliveries, (marker) => {
    if (marker.polyline) {
      map.removeLayer(marker.polyline);
      marker.polyline = null;
    }
  });
}

function hideOtherDeliverys(key) {
  _.each(deliveries, (marker) => {
    if (marker.key !== key) {
      map.removeLayer(marker.layerGroup);
    } else {
      map.addLayer(marker.layerGroup);
    }
  });
}

function showAllDeliverys() {
  _.each(deliveries, (marker) => {
    map.addLayer(marker.layerGroup);
  });
}

function createMarkerIcon(icon, iconShape, color) {
  return L.BeautifyIcon.icon({
    icon: icon,
    iconShape: iconShape,
    borderColor: color,
    textColor: color,
    backgroundColor: 'transparent'
  });
}

function createMarker(position, icon, iconShape, color) {

  var marker = L.marker([position.lat, position.lng], {
    icon: createMarkerIcon(icon, iconShape, color)
  });

  // if (infoWindow) {
  //   marker.addListener('click', function() {
  //     closeAllInfoWindows();
  //     infoWindow.open(map, marker);
  //   });
  // }

  return marker;
}

function createCircle(position, color) {

  var circle = L.circle([position.lat, position.lng], {
    color: color,
    fillColor: color,
    fillOpacity: 0.15,
    radius: 0
  }).addTo(map);

  return circle;
}

function addDelivery(delivery) {

  var key = delivery.key;
  var position = delivery.coords;

  var randomColor = COLORS[_.first(_.shuffle(_.keys(COLORS)))];

  var marker = _.find(deliveries, function(marker) {
    return marker.key === key;
  });

  if (!marker) {

    var circle;
    var tween;

    if (delivery.state === 'WAITING' || delivery.state === 'DISPATCHING') {
      circle = createCircle(delivery.restaurant, randomColor);

      tween = new TWEEN.Tween({ radius: 0 })
        .easing(TWEEN.Easing.Cubic.Out)
        .to({ radius: 1000 }, 500)
        .onUpdate(function() {
            circle.setRadius(this.radius)
        })
        .delay(50)
        .repeat(Infinity)
        .yoyo(true)
        .start();

      var animate = function animate(time) {
        requestAnimationFrame(animate);
        TWEEN.update(time);
      }

      requestAnimationFrame(animate);
    }

    // var infoWindow = new google.maps.InfoWindow({
    //   content: delivery.key
    // });
    // infoWindows.push(infoWindow);

    deliveryList.setItem(key, Object.assign(delivery, {
      color: randomColor
    }));

    var restaurantMarker = createMarker(delivery.restaurant, 'cutlery', 'marker', randomColor);
    var deliveryAddressMarker = createMarker(delivery.deliveryAddress, 'user', 'marker', randomColor);
    var layerGroup = L.layerGroup([restaurantMarker, deliveryAddressMarker]);

    marker = {
      key: key,
      courier: delivery.courier,
      color: randomColor,
      restaurantMarker: restaurantMarker,
      deliveryAddressMarker: deliveryAddressMarker,
      restaurantCircle: circle,
      circleTween: tween,
      polyline: null,
      layerGroup: layerGroup,
    };

    layerGroup.addTo(map);

    deliveries.push(marker);
  } else {
    marker.courier = delivery.courier;
    if (delivery.state === 'DELIVERING') {
      if (marker.circleTween) {
        marker.circleTween.stop();
        marker.circleTween = null;
      }
      if (marker.restaurantCircle) {
        marker.restaurantCircle.setRadius(0);
        map.removeLayer(marker.restaurantCircle);
        marker.restaurantCircle = null;
      }
    }

    deliveryList.setItem(key, delivery);
  }
}

function addCourier(key, position) {

  var marker = _.find(couriers, function(marker) {
    return marker.key === key;
  });

  var delivery = _.find(deliveries, function(delivery) {
    return delivery.courier === key;
  });

  var color = delivery ? delivery.color : '#fff';

  if (!marker) {

    // var infoWindow = new google.maps.InfoWindow({
    //   content: key
    // });
    // infoWindows.push(infoWindow);

    var courierMarker = createMarker(position, 'bicycle', 'circle', color);

    marker = {
      key: key,
      marker: courierMarker
    };

    courierMarker.addTo(map);

    // marker.marker.addListener('click', function() {
    //   closeAllInfoWindows();
    //   infoWindow.open(map, marker.marker);
    // });

    couriers.push(marker);
  } else {
    marker.marker.setLatLng([position.lat, position.lng]).update();
    marker.marker.setIcon(createMarkerIcon('bicycle', 'circle', color));
  }
}

function closeAllInfoWindows() {
  _.each(infoWindows, function(infoWindow) {
    infoWindow.close();
  });
}

function removeMissingObjects(objects, markers) {
  var allKeys = _.map(objects, function(object) {
    return object.key;
  });
  var onMapKeys = _.map(markers, function(marker) {
    return marker.key;
  });
  var keysToRemove = _.difference(onMapKeys, allKeys);

  removeMarkersByKeys(keysToRemove, markers);
}

function removeMarkersByKeys(keys, markers) {
  _.each(keys, function(key) {
    var index = _.findIndex(markers, function(marker) {
      return marker.key === key;
    });
    if (-1 !== index) {
      console.log('Removing marker ' + key);
      var marker = markers.splice(index, 1);
      if (marker[0].hasOwnProperty('marker')) {
        map.removeLayer(marker[0].marker);
      }
      if (marker[0].hasOwnProperty('restaurantMarker')) {
        map.removeLayer(marker[0].restaurantMarker);
      }
      if (marker[0].hasOwnProperty('deliveryAddressMarker')) {
        map.removeLayer(marker[0].deliveryAddressMarker);
      }
      if (marker[0].hasOwnProperty('restaurantCircle') && marker[0].restaurantCircle) {
        marker[0].restaurantCircle.setRadius(0);
        map.removeLayer(marker[0].restaurantCircle);
      }
      deliveryList.removeItem(key);
    }
  });
}

map = L.map('map', { scrollWheelZoom: false }).setView([center.lat, center.lng], zoom);
// L.tileLayer.provider('OpenStreetMap.BlackAndWhite').addTo(map);

L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy;<a href="https://carto.com/attribution">CARTO</a>'
}).addTo(map);

var hostname = window.location.hostname;

setTimeout(function() {

  var socket = io('//' + hostname, {path: '/tracking/socket.io'});

  socket.on('couriers', function (data) {
    removeMissingObjects(data, couriers);
    for (var i = 0; i < data.length; i++) {
      addCourier(data[i].key, data[i].coords);
    }
  });

  socket.on('deliveries', function (data) {
    removeMissingObjects(data, deliveries);
    for (var i = 0; i < data.length; i++) {
      addDelivery(data[i]);
    }
  });

}, 1000);

var activeKey = null;

deliveryList = render(
  <DeliveryList
    onReset={() => {
      activeKey = null;
      removePolylines();
      showAllDeliverys();
      fitToLayers();
    }}
    onItemMouseEnter={(delivery) => {
      var markers = _.reject(deliveries, function(marker) {
        return marker.key === delivery.key || marker.key === activeKey;
      });
      setTimeout(() => {
        _.each(markers, (marker) => {
          marker.layerGroup.eachLayer(function(layer) {
            layer.setOpacity(0.3);
          })
        });
      }, 200);
    }}
    onItemMouseLeave={() => {
      _.each(deliveries, function(marker) {
        marker.layerGroup.eachLayer(function(layer) {
          layer.setOpacity(1);
        })
      });
    }}
    onItemClick={(delivery) => {
      console.log('Zoom to delivery', delivery.key);

      var marker = _.find(deliveries, function(marker) {
        return marker.key === delivery.key;
      });

      activeKey = delivery.key;

      var restaurant = marker.restaurantMarker.getLatLng();
      var deliveryAddress = marker.deliveryAddressMarker.getLatLng();

      var originParam = [restaurant.lat, restaurant.lng].join(',');
      var destinationParam = [deliveryAddress.lat, deliveryAddress.lng].join(',');

      fetch('/api/routing/route?origin=' + originParam + '&destination=' + destinationParam)
        .then((response) => {
          response.json().then((data) => {

            removePolylines();
            hideOtherDeliverys(delivery.key);

            // Fit map to bounds
            var bounds = [];
            bounds.push(marker.restaurantMarker);
            bounds.push(marker.deliveryAddressMarker);
            if (marker.courier) {
              var courierMarker = _.find(couriers, function(marker) {
                return marker.key === delivery.courier;
              });
              if (courierMarker) {
                bounds.push(courierMarker.marker);
              }
            }
            var group = new L.featureGroup(bounds);
            map.fitBounds(group.getBounds());

            // Draw polyline
            var route = toPolylineCoordinates(data.routes[0].geometry);
            marker.polyline = new L.Polyline(route, {
              color: marker.color,
              weight: 3,
              opacity: 0.5,
              smoothFactor: 1
            });
            map.addLayer(marker.polyline);

          });
        });

    }} />,
  document.getElementById('order-list')
);
