var map = L.map('map').setView([30.3165, 78.0322], 13);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

var currentRoute = null;  // To store the current route
var markers = [];  // To store the markers

// Function to geocode a location and get coordinates
function geocodeLocation(location, callback) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                var latLng = [data[0].lat, data[0].lon];
                callback(latLng);
            } else {
                alert("Location not found!");
            }
        })
        .catch(error => {
            console.error("Error fetching location:", error);
            alert("There was an error while searching for the location. Please try again later.");
        });
}

// Function to get the user's current location
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    var lat = position.coords.latitude;
                    var lon = position.coords.longitude;
                    resolve([lat, lon]);
                },
                function(error) {
                    console.error("Geolocation error:", error);
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            reject("User denied the request for Geolocation.");
                            break;
                        case error.POSITION_UNAVAILABLE:
                            reject("Location information is unavailable.");
                            break;
                        case error.TIMEOUT:
                            reject("The request to get user location timed out.");
                            break;
                        default:
                            reject("An unknown error occurred.");
                            break;
                    }
                }
            );
        } else {
            reject("Geolocation is not supported by this browser.");
        }
    });
}

// Function to show loading indicator
function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

// Function to hide loading indicator
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Function to find and display the route
function findRoute() {
    var endLocation = document.getElementById('end-location').value.trim();

    if (endLocation) {
        showLoading(); // Show loading indicator

        // Get the user's current location
        getCurrentLocation()
            .then(function(startLatLng) {
                // Geocode the destination location
                geocodeLocation(endLocation, function(endLatLng) {
                    // Remove previous route and markers
                    if (currentRoute) {
                        currentRoute.remove();  // Remove the previous route
                    }
                    markers.forEach(marker => map.removeLayer(marker));  // Remove the previous markers
                    markers = [];  // Clear the marker array

                    // Add a marker for the user's location
                    var startMarker = L.marker(startLatLng).addTo(map).bindPopup("You are here").openPopup();
                    markers.push(startMarker);

                    // Add a marker for the destination location
                    var endMarker = L.marker(endLatLng).addTo(map).bindPopup("Destination: " + endLocation).openPopup();
                    markers.push(endMarker);

                    // Create the route using Leaflet Routing Machine
                    currentRoute = L.Routing.control({
                        waypoints: [
                            L.latLng(startLatLng),
                            L.latLng(endLatLng)
                        ],
                        routeWhileDragging: true
                    }).addTo(map);

                    // Ensure map adjusts to show both markers and route
                    map.fitBounds(L.latLngBounds([startLatLng, endLatLng]));

                    // Hide loading indicator after route is created
                    hideLoading();
                });
            })
            .catch(function(error) {
                hideLoading(); // Hide loading indicator on error
                alert(error); // Display detailed error message
            });
    } else {
        alert('Please enter a destination location!');
    }
}

// Function to clear the route and markers
function clearRoute() {
    if (currentRoute) {
        currentRoute.remove();  // Remove the route
    }
    markers.forEach(marker => map.removeLayer(marker));  // Remove markers
    markers = [];  // Clear the markers array
    document.getElementById('end-location').value = '';  // Clear the input field
}

// Add geocoder control to the map
L.Control.geocoder().addTo(map);
