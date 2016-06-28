var _ = require('lodash'),
    env = process.env.NODE_ENV || 'development',
    config = require('../../config/config')[env],
    Firebase = require('firebase'),
    google = require('googleapis'),
    googleAuth = require('google-auth-library'),
    request = require('request'),
    moment = require('moment'),
    ObjectId = require('mongoose').Types.ObjectId,
    Calendar = require('../models/Calendar'),

    root = new Firebase(config.firebase.rootRefUrl),
    calendarRef = root.child('calendars'),
    auth = new googleAuth(),
    OAuthClient = new auth.OAuth2(config.calendar.clientId, config.calendar.clientSecret, config.calendar.callBackURL),
    authed = false;

// Not to be removed - For local testing
function loginByOAuth(req, res) {
    var url, calendar, events,
        uid = req.params.uuid;

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
        
        calendar.events.list({
            calendarId: 'primary',
            timeMin: moment.utc().format(),
            timeMax: moment().add(2, 'days').utc().format(),
            singleEvents: true,
            orderBy: 'startTime',
            auth: OAuthClient
        }, function(err, response) {
            if (err) {
                return res.status(400).json({ message: 'An error occured while processing this request. Please, try again later.', error: err });
            }

            events = buildEventsObject(response.items);

            return res.status(200).json({ message: 'Successfully returned events.', response: events });
        });
    }
}

function calendarCallback(req, res) {
    var code = req.query.code;

    OAuthClient.getToken(code, function(err, tokens) {
        if (err) {
            return res.status(400).json({ message: 'Error authenticating', error: err });
        }
        
        OAuthClient.setCredentials(tokens);
        authed = true;
        
        return res.redirect('/calendar');
    });
}

function setCalendarById(req, res) {
    var data = {},
        uid = req.params.uuid,
        tokens = {
            accessToken: req.body.accessToken,
            refreshToken: req.body.refreshToken
        };

    Calendar.findOne({ user: new ObjectId(uid) })
    .populate('user')
    .exec(function (err, calendar) {
        if (err) {
            return res.status(400).json({ message: 'An error occured with this request. Please, try again later.', error: err });
        }

        if (calendar) {
            return res.status(200).json({ message: 'User already has a calendar.', response: calendar.toJSON() });
        }

        request.get(config.calendar.events_url, {
            auth: {
                'bearer': tokens.accessToken
            },
            qs: {
                access_type: 'offline',
                orderBy: 'startTime',
                singleEvents: true,
                timeMin: moment.utc().format()
            }
        }, function (err, status, body) {
            if (err) {
                return res.status(400).json({ message: 'An error occured while trying to save the calendar. Please, try again later.', error: err });
            }

            body = JSON.parse(body);

            data.user = uid;
            data.tokens = tokens;
            data.items = buildEventsObject(body.items);

            if (!data.items.length) {
                return res.status(400).json({ message: 'The request could not be completed. Please, try again later.' });
            }

            new Calendar(data).save(function (err, calendar) {
                if (err) {
                    return res.status(400).json({ message: 'Calendar could not be saved for this user. Please, try again later.', error: err });
                }

                return res.status(200).json({ message: 'Calendar was successfully saved.', response: calendar.toJSON() });
            });
        });        
    });
}

function getCalendarById(req, res) {
    var data,
        uid = req.params.uuid;

    Calendar.findOne({ user: new ObjectId(uid) })
    .populate('user')
    .exec(function (err, calendar) {
        if (err) {
            return res.status(400).json({ message: 'An error occured with this request. Please, try again later.', error: err });
        }

        return res.status(200).json({ message: 'User already has a calendar.', response: calendar.toJSON() });
    });
}

function buildEventsObject(data) {
    var i, events = [], eventDetails = {};

    for (i = 0; i < data.length; i++) {

        if (data[i].start && data[i].end && data[i].location && data[i].summary) {
            eventDetails.time       = {};
            eventDetails.time.start = data[i].start.dateTime;
            eventDetails.time.end   = data[i].end.dateTime;
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
    getById     : getCalendarById,
    setById     : setCalendarById,
    callback    : calendarCallback,
};
