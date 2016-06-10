var _ = require('lodash'),
    env = process.env.NODE_ENV || 'development',
    config = require('../../config/config')[env],
    Firebase = require('firebase'),
    google = require('googleapis'),
    googleAuth = require('google-auth-library'),
    request = require('request'),
    moment = require('moment'),

    root = new Firebase(config.firebase.rootRefUrl),
    calendarRef = root.child('calendars'),
    auth = new googleAuth(),
    OAuthClient = new auth.OAuth2(config.calendar.clientId, config.calendar.clientSecret, config.calendar.callBackURL),
    authed = false;

// Not to be removed - For local testing
function loginByOAuth(req, res) {
    var url, calendar, events,
        uid = req.params.uid;

    if (!authed) {
        url = OAuthClient.generateAuthUrl({
            access_type: 'offline',
            scope: config.calendar.authorize_url,
            approval_prompt: 'force',
            state: uid
        });

        res.redirect(url);
    } else {
        calendar = google.calendar('v3');

        console.log("OAuth client", OAuthClient);
        
        calendar.events.list({
            calendarId: 'primary',
            timeMin: moment.utc().format(),
            timeMax: moment().add(2, 'days').utc().format(),
            singleEvents: true,
            orderBy: 'startTime',
            auth: OAuthClient
        }, function(err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);

                return res.status(401).json({ error: err });
            }

            events = buildEventsObject(response.items);

            return res.json(events);
        });
      }
}

// Not to be removed - For local testing
function calendarCallback(req, res) {
    var code = req.query.code;
    console.log(code);

    OAuthClient.getToken(code, function(err, tokens) {
        if (err) {
            console.log('Error authenticating', err);
        } else {
            OAuthClient.setCredentials(tokens);
            authed = true;
            res.redirect('/calendar');
        }
    });
}

function setById(req, res) {
    var data,
        uid = req.params.uid,
        tokens = {
            accessToken: req.body.accessToken,
            refreshToken: req.body.refreshToken
        };

    calendarRef.child(uid).once('value', function (snap) {
        if (snap.val()) {
            console.log('User already has a calendar');
            data = snap.val();
            data = shortList(data.items);

            return res.json({ response: data });

        }

        request.get(config.calendar.events_url, {
            auth: {'bearer': tokens.accessToken},
            qs: {
                access_type: 'offline',
                timeMin: moment.utc().format(),
                singleEvents: true,
                orderBy: 'startTime'
            }
        }, function (err, status, body) {
            if (err) {
                console.log('There is an error - ', err);
                return res.status(400).json({ error: err });
            }

            body = JSON.parse(body);
        
            data = {};
            data.items = buildEventsObject(body.items);

            if (!data.items) {
                return res.status(400).json({ error: 'Insufficient calendar details!' });
            }

            data.tokens = tokens;
            calendarRef.child(uid).set(data, function (err) {
                if (!err) {
                    data = shortList(data.items);
                    
                    return res.json({ response: data });
                }
                return res.status(400).json({ error: 'User does not have a calendar!' });
            });
        });
    });
}

function getById(req, res) {
    var data,
        uid = req.params.uid;

    calendarRef.child(uid).once('value', function (snap) {
        if (snap.val()) {
            data = snap.val();
            data = shortList(data.items);

            return res.json({ response: data });
        }
        
        return res.status(404).json({ error: 'User does not have a calendar!' });
    });
}

function buildEventsObject(data) {
    var i, events = [], eventDetails = {};

    for (i = 0; i < data.length; i++) {

        if (data[i].start && data[i].end && data[i].location && data[i].summary) {
            eventDetails.start      = data[i].start.dateTime;
            eventDetails.end        = data[i].end.dateTime;
            eventDetails.status     = data[i].status;
            eventDetails.location   = data[i].location;
            eventDetails.summary    = data[i].summary;

            events.push(eventDetails);
        }
    }

    return events;
}

function shortList(data) {
    var i, time,
        arr = [],
        now = moment.utc().format(),
        tomorrow = moment().add(2, 'days').utc().format();

    for (i in data) {
        time = moment(data[i].start);

        if (time.isBetween(now, tomorrow)) {
            arr.push(data[i]);
        }
    }

    return arr;
}

module.exports = {
    login       : loginByOAuth,
    getById     : getById,
    setById     : setById,
    callback    : calendarCallback,
};
