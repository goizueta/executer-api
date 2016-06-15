var env = process.env.NODE_ENV || 'development',
    config = require('../../config/config')[env],
    Firebase = require('firebase'),
    _ = require('lodash'),
    request = require('request'),
    moment = require('moment'),
    // set firebase root ref and child refs
    root = new Firebase(config.firebase.rootRefUrl),
    usersRef = root.child('users'),
    tripsRef = root.child('trips'),
    requestsRef = root.child('requests');


function listAll(req, res) { // route controller to return all trips for a user
    var trips,
        uuid = req.params.uuid;

    usersRef.child(uuid).once('value', function (snap) { // get the user from the database
        if (!snap.val()) { // Return a 404 error if user doesn't exist
            return res.status(404).json({ error: 'User does not exist!' });
        } 

        tripsRef.once('value', function (snap) { // get all the trips in the database
            if (!snap.val()) { // Return a 404 error if there are no trips in the database
                return res.status(404).json({ error: 'There are no trips available!' });
            }
            
            // Filter the trips by the user id to get all the trips by that user
            trips = _.filter(snap.val(), { 'uuid': uuid });

            if (!trips) { // If there are no trips for this user, return a 404 error
                return res.status(404).json({ error: 'There are no trips for this user.' });
            }
            
            // return a 200 with the trips for that user
            return res.status(200).json({ response: trips });
        });
    });
}

function create(req, res) {
    var user, requestData, request_id, params,
        uuid = req.params.uuid,
        tripBody = req.body;

    if (!tripBody || !tripBody.request_id) {
        return res.status(400).json({ error: 'This request cannot be processed!' });
    }

    request_id = tripBody.request_id;

    requestsRef.child(request_id).once('value', function (snap) {
        if (!snap.val()) { return res.status(400).json({ error: 'This request could not be completed!\nRequest could not be found.' }); }

        requestData = snap.val();

        if (requestData.uid !== uuid) { return res.status(400).json({ error: 'This request could not be completed.\nInvalid user.' }); }

        usersRef.child(uuid).once('value', function (snap) {
            if (!snap.val()) { return res.status(400).json({ error: 'This request could not be completed.\nThe user cannot be found!' }); }

            user = snap.val();

            params = {
                url     : config.uber.sandbox_base_url + 'requests',
                headers : {
                    'Authorization': 'Bearer ' + user.accessToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(buildTripObject(requestData))
            };

            request.post(params, function (err, response, trip) {
                if (err) { res.status(400).json({ error: err }); }

                trip = JSON.parse(trip);
                
                if (!trip) { return res.status(400).json({ error: 'This request could not be completed.\nUnable to create request from Uber API.' }); }

                validateTripDetails(trip);

                trip.created = moment().format();
                
                tripsRef.child(request_id).set(trip, function (err) {
                    if (err) { return res.status(400).json({ error: err }); }
                    
                    return res.json({ response: trip });
                });
            });
        });
    });
}

function listOne(req, res) {
    var tripData,
        uuid = req.params.uuid,
        trip_id = req.params.trip_id;

    usersRef.child(uuid).once('value', function (snap) { // get the user from the database
        if (!snap.val()) { // If the user doesn't exist, return a 404 error
            return res.status(404).json({ error: 'This user does not exist.' });
        }

        tripsRef.child(trip_id).once('value', function (snap) { // get a trip data using the trip id from the database
            if (!snap.val()) { // If the trip doesn't exist, return a 404 error
                return res.status(404).json({ error: 'The requested trip could not be found!' });
            }

            tripData = snap.val();

            if (tripData.uid !== uuid) { // If the trip user id doesn't match the user id from the route, return a 404 error
                return res.status(404).json({ error: 'There is a mismatch in the requested trip.' });
            }

            // Return a 200 along with the trip data
            return res.status(200).json({ response: tripData });
        });
    });
}

function buildTripObject(requestData) {
    return {
        product_id      : requestData.product.id,
        start_latitude  : requestData.location.latitude,
        start_longitude : requestData.location.longitude,
        end_latitude    : requestData.destination.latitude,
        end_longitude   : requestData.destination.longitude
    };
}

function validateTripDetails(trip) {
    if (trip.driver === null) {
        trip.driver = {
            name            : "",
            phone_number    : "",
            picture_url     : "",
            rating          : ""
        };
    }
    
    if (trip.vehicle === null) {
        trip.vehicle = {
            make            : "",
            model           : "",
            picture_url     : "",
            license_plate   : ""
        };
    }

    if (trip.location === null) {
        trip.location = {
            bearing         : "",
            latitude        : "",
            longitude       : ""
        };
    }

    return trip;
}

module.exports = {
    createOne   : create,
    deleteOne   : deleteOne,
    listOne     : listOne,
    listAll     : listAll
};
