var map = L.map('map').setView([30.3165, 78.0322], 13);

// Base tile layers
var streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://carto.com/">CartoDB</a>',
  subdomains: 'abcd',
  maxZoom: 19
});

var satellite = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenTopoMap contributors'
});

L.control.layers({
  "Streets": streets,
  "Dark": dark,
  "Satellite": satellite
}).addTo(map);

var currentRoute = null;
var markers = [];
var watchId = null;
var userMarker = null;

function showLoading() {
  document.getElementById('loading').style.display = 'block';
}
function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

function geocodeLocation(location, callback) {
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`)
    .then(res => res.json())
    .then(data => {
      if (data.length > 0) {
        callback([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      } else {
        alert("Location not found!");
      }
    }).catch(err => {
      console.error("Geocoding error:", err);
      alert("Error fetching location. Try again.");
    });
}

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject("Geolocation not supported.");
    navigator.geolocation.getCurrentPosition(
      pos => resolve([pos.coords.latitude, pos.coords.longitude]),
      err => reject("Failed to get location: " + err.message)
    );
  });
}

function findRoute() {
  const endLocation = document.getElementById('end-location').value.trim();
  if (!endLocation) return alert('Please enter a destination.');

  showLoading();
  getCurrentLocation()
    .then(startLatLng => {
      geocodeLocation(endLocation, endLatLng => {
        clearRoute();

        userMarker = L.marker(startLatLng).addTo(map).bindPopup("You are here").openPopup();
        markers.push(userMarker);
        var endMarker = L.marker(endLatLng).addTo(map).bindPopup("Destination: " + endLocation).openPopup();
        markers.push(endMarker);

        currentRoute = L.Routing.control({
          waypoints: [L.latLng(startLatLng), L.latLng(endLatLng)],
          routeWhileDragging: false,
          show: false,
          addWaypoints: false,
        }).addTo(map);

        currentRoute.on('routesfound', e => {
          const summary = e.routes[0].summary;
          const distanceKm = (summary.totalDistance / 1000).toFixed(2);
          const timeMin = summary.totalTime / 60;

          // Estimate a range to account for traffic
          const minTime = Math.floor(timeMin * 0.9);
          const maxTime = Math.ceil(timeMin * 1.25);

          alert(`📍 Distance: ${distanceKm} km\n⏱️ Estimated Time: ~${minTime}–${maxTime} minutes (depending on traffic)`);
        });

        currentRoute.on('routingerror', e => {
          alert("Routing failed: " + e.error.message);
        });

        map.fitBounds(L.latLngBounds([startLatLng, endLatLng]));
        hideLoading();
      });
    }).catch(err => {
      hideLoading();
      alert(err);
    });
}

function clearRoute() {
  if (currentRoute) currentRoute.remove();
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];
  currentRoute = null;
  if (userMarker) userMarker = null;
  document.getElementById('end-location').value = '';
}

function startLiveLocationTracking() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
  }

  watchId = navigator.geolocation.watchPosition(
    pos => {
      const latLng = [pos.coords.latitude, pos.coords.longitude];
      if (userMarker) {
        userMarker.setLatLng(latLng);
      } else {
        userMarker = L.marker(latLng).addTo(map).bindPopup("Live Location").openPopup();
        markers.push(userMarker);
      }
      map.setView(latLng);
    },
    err => alert("Tracking error: " + err.message),
    { enableHighAccuracy: true }
  );
}

L.Control.geocoder().addTo(map);

// *** AUTOCOMPLETE SUGGESTIONS IN FIXED BOTTOM CONTAINER ***
const input = document.getElementById("end-location");
const suggestionBox = document.getElementById("autocomplete-suggestions");
const showSuggestionsBtn = document.getElementById("show-suggestions-btn");

showSuggestionsBtn.addEventListener("click", () => {
  const query = input.value.trim();
  if (query.length < 3) {
    alert("Please enter at least 3 characters to get suggestions.");
    return;
  }

  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`)
    .then(res => res.json())
    .then(data => {
      suggestionBox.innerHTML = '';
      if (data.length === 0) {
        suggestionBox.textContent = 'No suggestions found.';
        return;
      }
      data.forEach(place => {
        const item = document.createElement("div");
        item.className = "autocomplete-suggestion";
        item.textContent = place.display_name;
        item.addEventListener("click", () => {
          input.value = place.display_name;
          suggestionBox.innerHTML = '';
        });
        suggestionBox.appendChild(item);
      });
    }).catch(() => {
      suggestionBox.textContent = 'Error fetching suggestions.';
    });
});

// Hide suggestions on outside click
document.addEventListener("click", (e) => {
  if (!suggestionBox.contains(e.target) && e.target !== input && e.target !== showSuggestionsBtn) {
    suggestionBox.innerHTML = '';
  }
});
