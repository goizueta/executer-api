var env = process.env.NODE_ENV || 'development',
    config = require('../../config/config')[env],
    Firebase = require('firebase'),
    geolocator = require('../util/geolocator'),
    request = require('request'),
    moment = require('moment'),
    // set firebase root ref and child refs
    root = new Firebase(config.firebase.rootRefUrl),
    usersRef = root.child('users'),
    tripsRef = root.child('trips'),
    requestsRef = root.child('requests');

function listAll(req, res) {
    var id, requests,
        uid = req.params.uuid,
        userRequests = [];

    // return requests for a particular user
    usersRef.child(uid).once('value', function (snap) {
        if (!snap.val()) {
            // If the user doesn't exist, return an error message
            return res.status(401).json({ error: 'You are not authorized!' });
        }
        
        // retrieve all requests
        requestsRef.once('value', function (snap) {
            if (!snap.val()) {
                // if there are no requests, return an error message
                return res.status(404).json({ error: 'There are no requests available!' });
            }
            
            requests = snap.val();
            
            for (id in requests) {
                if (requests[id].uid === uid) {
                    // if user has requests available, push them into an array
                    requests[id].id = id;
                    userRequests.push(requests[id]);
                }
            }
      
            if (!userRequests.length) {
                // if user has no requests, return an error message
                return res.status(404).json({ error: 'There are no available requests!'});
            }

            return res.json({ response: userRequests });
        });
    });
}

function createRequest(req, res) {
    var i, user, params, product, products,
        uid = req.params.uuid,
        data = req.body;

    console.log('\n\nRequest body...\n--------------------\n', data);

    if (!data || !data.destination || !data.startTime || !data.productType || !data.location) {
        res.status(400).json({ error: 'Invalid request!' });
    }

    geolocator(data.location, function (err, coords) {
        if (err) {
            return res.status(400).json({ error: err });
        }

        data.location = {
            address     : coords.results[0].formatted_address,
            latitude    : coords.results[0].geometry.location.lat,
            longitude   : coords.results[0].geometry.location.lng
        };

        usersRef.child(uid).once('value', function (snap) {
            if (!snap.val()) { return res.status(400).json({ error: 'Invalid user id' }); }

            data.uid = uid;

            user = snap.val();
            params = {
                url: config.uber.base_uber_url + 'products',
                qs: {
                    server_token    : config.uber.server_token,
                    latitude        : data.location.latitude,
                    longitude       : data.location.longitude
                }
            };

            request.get(params, function (err, status, body) {
                if (err) { return res.status(400).json({ error: err }); }

                body = JSON.parse(body);

                products = body.products;

                for (i in products) {
                    if (products[i].display_name == data.productType) {
                        product = products[i];
                    }
                }

                data.product = {
                    id: product.product_id,
                    type: data.productType
                };

                delete data.productType;
                
                geolocator(data.destination, function (err, coords) {
                    if (err) { return res.status(400).json({ error: 'Unable to calculate co-ordinates for your destination address!' }); }

                    data.destination = {
                        address     : coords.results[0].formatted_address,
                        latitude    : coords.results[0].geometry.location.lat,
                        longitude   : coords.results[0].geometry.location.lng
                    };

                    // Set the params object for making a call to Uber's Estimate endpoint
                    params.url = config.uber.base_uber_url + 'requests/estimate';
                    params.headers = {
                        'Authorization': 'Bearer ' + user.accessToken,
                        'Content-Type': 'application/json'
                    };

                    params.body = JSON.stringify({
                        product_id          : data.product.id,
                        start_latitude      : data.location.latitude,
                        start_longitude     : data.location.longitude,
                        end_latitude        : data.destination.latitude,
                        end_longitude       : data.destination.longitude
                    });

                    params.qs = {};

                        // Get the estimated duration for the requested trip
                    request.post(params, function (err, status, body)  {
                        if (err) { res.status(400).json({ error: err }); }

                        if (!body) {
                            return res.status(400).json({ error: 'Unable to calculate estimates! Please, try again later!' });
                        }

                        body = JSON.parse(body);
                        // console.log('\n\nPushing to firebase...\n--------------------------\n', body);

                        if (!body.trip || !body.pickup_estimate) {
                            return res.status(400).json({ error: 'Unable to get estimates! Please, try again later!' });
                        }

                        var duration_estimate = body.trip.duration_estimate,
                            pickup_estimate = body.pickup_estimate,
                            time = moment(data.startTime).subtract(15, 'minutes').format(),
                            reminder = moment(time).subtract(duration_estimate, 'seconds').format();

                        data.estimates = {
                            duration: duration_estimate,
                            reminder: reminder
                        };

                        data.created = moment().format();

                        var newRequestRef = requestsRef.push();
                        var request_id = newRequestRef.key();

                        newRequestRef.set(data, function (err) {
                            if (err) {
                                return res.status(400).json({ message: 'Unable to save data to firebase!', error: err });
                            }

                            data.id = request_id;
                            
                            return res.json({ response: data });
                        });
                    });
                });
            });
        });
    });
}
    
function listOne(req, res) {
    var user, userTrips, trip, requestData,
        uuid = req.params.uuid,
        id = req.params.req_id,
        params = {};

    // Find the user from the database with the user's id
    usersRef.child(uuid).once('value', function (snap) {
        if (!snap.val()) { // If user doesn't exist, return a 401 error
            return res.status(401).json({ error: 'You are not authorized!' });
        }

        // If user exists, assign the object to the user` variable
        user = snap.val();

        // Then, find the request with the request id
        requestsRef.child(id).once('value', function (snap) {
            if (!snap.val()) {
                // If the request doesn't exist, return a 404 error
                return res.status(404).json({ error: 'Request not found!' });
            }

            requestData = snap.val();

            // Check if the request has details for a trip
            tripsRef.child(uuid).once('value', function (snap) {
                if (!snap.val()) { // If it doesn't have a trip, send the requestData object
                    return res.json({ response: requestData });
                }
                
                // If the request has a trip, add it to the requestData object
                userTrips = snap.val();
                trip = userTrips[id];

                if (!trip) { return res.json({ response: requestData }); }
                
                if (trip.status === 'accepted') {
                    requestData.trip = trip;

                    return res.json({ response: requestData });
                } else {
                    // Set the params object for making a call to Uber's Estimate endpoint
                    params.url = config.uber.sandbox_base_url + 'requests/' + trip.request_id;
                    params.headers = {
                        'Authorization': 'Bearer ' + user.accessToken,
                        'Content-Type': 'application/json'
                    };

                    request.get(params, function (err, status, body) {
                        if (err) { return res.status(400).json({ error: 'We are unable to complete this request at this time. Please, try again later.'}); }

                        requestData.trip = JSON.parse(body) || '';

                        return res.json({ response: requestData });
                    });
                }
            });
        });
    });
}

function deleteOne(req, res) {
    var user, trip, trips,
        params = {},
        uuid = req.params.uuid,
        id  = req.params.id;

    console.log(uuid, id);

    // delete an existing request
    usersRef.child(uuid).once('value', function (snap) {
        if (!snap.val()) {
            // If the user doesn't exist, return an error message
            return res.status(404).json({error: 'User not found!'});
        }
        // Assign the returned user object to the `user` variable
        user = snap.val();

        // Find the request in the requestsRef
        requestsRef.child(id).once('value', function (requestSnap) {
            if (!requestSnap.val()) {
                // if the request doesn't exist, return an error message
                return res.status(404).json({error: 'Request not found!'});
            }

            // if the request exists, delete it from uber's API and then from the firebase requests
            tripsRef.child(uuid).once('value', function (tripSnap) {
                trips = tripSnap.val();

                // If there are no trips or no trip with the request id, delete the request from firebase
                if (!trips || !trips[id]) {
                    requestSnap.ref().remove(function (err) {
                        if (!err) {
                            return res.json({response: 'Successfully deleted!'});
                        }
                    }); 
                }
                else {
                    // Assign the single trip request to a trip variable
                    trip = trips[id];

                    params.url = config.uber.sandbox_base_url + 'requests/' + trip.request_id;
                    params.headers = {
                        'Authorization': 'Bearer ' + user.accessToken,
                        'Content-Type': 'application/json'
                    };

                    // Make a delete request to uber's api to delete the request
                    request.del(params, function (err, response, body) {
                        if (err) {
                            return res.status(400).json({ error: 'Unable to cancel this uber trip!' });
                        }

                        if (response.statusCode === 204) {
                            requestSnap.ref().remove(function (err) {
                                if (!err) {
                                    return res.json({response: 'Successfully deleted request!' });
                                }
                            });
                        }
                        else {
                            return res.status(400).json({ error: 'Unable to cancel this request!' });
                        }
                    });
                }
            });
        });
    });
}

module.exports = {
    create      : createRequest,
    listOne     : listOne,
    listAll     : listAll,
    deleteOne   : deleteOne
};
