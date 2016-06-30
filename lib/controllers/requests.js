var env = process.env.NODE_ENV || 'development',
    config = require('../../config/config')[env],
    Firebase = require('firebase'),
    geolocator = require('../util/geolocator'),
    request = require('request'),
    moment = require('moment'),
    User = require('../models/User'),
    Request = require('../models/Request'),
    Trip = require('../models/Trip'),
    ObjectId = require('mongoose').Types.ObjectId,
    // set firebase root ref and child refs
    root = new Firebase(config.firebase.rootRefUrl),
    usersRef = root.child('users'),
    tripsRef = root.child('trips'),
    requestsRef = root.child('requests');

function listAll(req, res) {
    var id, requests,
        uuid = req.params.uuid,
        userRequests = [];

    // return requests for a particular user
    User.findOne({ _id: uuid })
    .where('active')
    .equals(true)
    .exec(function (err, user) {
        if (err) {
            return res.status(400).json({ message: 'An error occured with this request. Please try again later.', error: err });
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        Request.find({ user: new ObjectId(uuid) })
        .where('active')
        .equals(true)
        .exec(function (err, requests) {
            if (err) {
                return res.status(400).json({ message: 'An error occured with this request. Please try again later.', error: err });
            }

            if (!requests.length) {
                return res.status(404).json({ message: 'This user has no requests available.' });                
            }

            return res.status(200).json({ message: 'Successfully retrieved requests for this user.', response: requests });
        });
    });
}

function createRequest(req, res) {
    var i, user, params, product, products,
        uid = req.params.uuid,
        data = req.body;

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
    User.findOne({ _id: uuid })
    .where('active')
    .equals(true)
    .exec(function (err, user) {
        if (err) {
            return res.status(400).json({ message: 'An error occured with this request. Please, try again later.', error: err });
        }

        if (!user) {
            return res.status(404).json({ message: 'This user is not available.' });
        }

        Request.findOne({ _id: id })
        .exec(function (err, request_data) {
            if (err) {
                return res.status(400).json({ message: 'An error occured with this request. Please, try again later.', error: err });
            }

            if (!request_data) {
                return res.status(404).json({ message: 'Request not found.' });
            }

            Trip.findOne({ request: new ObjectId(id) })
            .exec(function (err, trip) {
                if (err) {
                    return res.status(400).json({ message: 'An error occured with this request. Please, try again later.', error: err });
                }

                if (!trip) {
                    return res.status(200).json({ message: 'Successfully returned request data.', response: request_data });
                }

                // Set the params object for making a call to Uber's Estimate endpoint
                params.url = config.uber.sandbox_base_url + 'requests/' + trip.request_id;
                params.headers = {
                    'Authorization': 'Bearer ' + user.accessToken,
                    'Content-Type': 'application/json'
                };

                request.get(params, function (err, status, body) {
                    if (err) {
                        return res.status(400).json({ error: 'An error occured with this request. Please, try again later.' });
                    }

                    request_data.trip = JSON.parse(body) || null;

                    return res.json({ message: 'Successfully returned request data.', response: request_data });
                });
            });
        });
    });
}

function deleteOne(req, res) {
    var user, trip, trips,
        params = {},
        uuid = req.params.uuid,
        id  = req.params.id;

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
