var geocoder = require('geocoder'),
    options = { sensor: true };

function geolocator(val, cb) {
    if (typeof val === "string") {
        // Geocoding
        geocoder.geocode(val, function (err, data) {
            if (err) {
                cb(err, null);
            }
            
            // respond with a location object containing actual co-ordinates
            cb(null, data);

        }, options);
    }

    if (typeof val === "object" && val.lat && val.lng) {
        // Reverse Geocoding
        geocoder.reverseGeocode(val.lat, val.lng, function (err, data) {
            if (err) {
                cb(err, null);
            }
            
            // respond with an object containing a string
            // of the actual street address of the supplied co-ordinates
            cb(null, data);
        }, options);
    }
}

module.exports = geolocator;
