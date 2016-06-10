var geolocator = require('../util/geolocator');

function getAddress(req, res) {
    var lat = req.body.lat,
        lng = req.body.lng;

    if (!lat || !lng) {
        return res.status(400).json({ error: 'Invalid request' });
    }
    
    geolocator({lat: lat, lng: lng}, function (err, data) {
        if (err) {
            return res.status(400).json({ error: err });
        }
        
        // respond with an object containing a string
        // of the actual street address of the supplied co-ordinates
        return res.json({ response: data.results[0].formatted_address });
    });
}

function getCoordinates(req, res) {
    var street = req.body.street;

    if (!street) {
        return res.status(400).json({error: 'Invalid request'});
    }

    geolocator(street, function (err, data) {
        if (err) {
            console.log(err);
            return res.status(400).json({error: err});
        }
        
        // respond with a location object containing actual co-ordinates
        return res.json({ response: data.results[0].geometry.location });

    });

}

module.exports = {
    getAddress      : getAddress,
    getCoordinates  : getCoordinates
};
