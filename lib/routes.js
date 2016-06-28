var express = require('express'),
    router = express.Router(),
    controllers = require('./index');

router.get('/status', function (req, res) {
    res.send({ message: "Good" });
});

router.get('/login',                                controllers.users.loginByOAuth);
router.post('/login',                               controllers.users.loginByAccessToken);
router.get('/uber/callback',                        controllers.users.uberCallback);

router.get('/calendar',                             controllers.calendar.login);
router.get('/calendar/callback',                    controllers.calendar.callback);

router.post('/geolocation',                         controllers.geolocation.getAddress);
router.post('/geolocation/street',                  controllers.geolocation.getCoordinates);

router.get('/users/:uuid/calendar/',                controllers.calendar.getById);
router.post('/users/:uuid/calendar/',               controllers.calendar.setById);

router.get('/users/:uuid/requests',                 controllers.requests.listAll);
router.post('/users/:uuid/requests',                controllers.requests.create);

router.get('/users/:uuid/requests/:req_id',         controllers.requests.listOne);
router.delete('/users/:uuid/requests/:req_id',      controllers.requests.deleteOne);

router.get('/users/:uuid/trips',                    controllers.trips.listAll);
router.post('/users/:uuid/trips',                   controllers.trips.createOne);

router.get('/users/:uuid/trips/:trip_id',           controllers.trips.listOne);
// router.delete('/users/:uuid/trips/:trip_id',        controllers.trips.deleteOne);

module.exports = router;
