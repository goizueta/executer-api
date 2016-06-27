var _ = require('lodash'),
    env = process.env.NODE_ENV || 'development',
    config = require('../../config/config')[env],
    OAuth = require('oauth'),
    request = require('request'),
    User = require('../models/User'),
    OAuth2 = new OAuth.OAuth2(config.uber.clientId, config.uber.secretKey, '', config.uber.authorize_url, config.uber.access_token_url, config.uber.base_uber_url);

function loginByAccessToken(req, res) {
    var access_token = req.body.access_token;

    request.get(config.uber.profile_url, {
        auth:  {
            'bearer': access_token
        },
        json: true
    }, function (err, status, data) {
        if (err) {
            return res.status(401).json({ message: 'An error occured while processing this request.', error: err });
        }

        data.accessToken = access_token;

        User.findOne({ uuid: data.uuid })
        .where('active')
        .equals(true)
        .exec(function (err, user) {
            if (err) {
                return res.status(400).json({ message: 'An error occured!', error: err });
            }
            else if (user) {
                return res.status(200).json({ message: 'User already exists', response: user });
            }
            else {
                new User(data).save(function (err, user) {
                    if (err) {
                        return res.status(400).json({ error: 'An error occured while signing in. Please, try again later.' });
                    }

                    return res.status(200).json({ message: 'User has been created!', response: user.toJSON() });
                });
            }
        });
    });
}

function loginByOAuth(req, res) {
    var params = {
        'response_type': 'code',
        'redirect_uri': config.uber.redirect_url,
        'scope': 'profile request request_receipt history history_lite'
    },
    login_url = OAuth2.getAuthorizeUrl(params);

    res.redirect(login_url);
}

function uberCallback(req, res) {
    var query = req.query,
        params = {
            'redirect_uri': config.uber.redirect_url,
            'code':         query.code,
            'grant_type':   'authorization_code',
            client_id: config.uber.clientId,
            client_secret: config.uber.secretKey
        };

    OAuth2.getOAuthAccessToken(query.code, params, function (err, access_token, refresh_token, results) {
        if (err) {
            return res.status(401).json({ message: 'An error occured while processing this request.', error: err });
        }

        access_token = results.access_token;

        request.get(config.uber.profile_url, {
            auth:  {
                'bearer': access_token
            },
            json: true
        }, function (err, status, data) {
            if (err) {
                console.log(err);
                return res.status(401).json({ error: err });
            }

            data.accessToken = access_token;

            User.findOne({ uuid: data.uuid })
            .exec(function (err, user) {
                if (err) {
                    return res.status(400).json({ message: 'An error occured!', error: err });
                }
                else if (user) {
                    return res.status(200).json({ message: 'User already exists in the database.', response: user });
                }
                else {
                    new User(data).save(function (err, user) {
                        if (err) {
                            return res.status(400).json({ message: 'An error occured while signing in. Please, try again later.', error: err });
                        }

                        return res.status(200).json({ message: 'User has been created!', response: user.toJSON() });
                    });
                }
            });
        });
    });
}

module.exports = {
    uberCallback            : uberCallback,
    loginByOAuth            : loginByOAuth,
    loginByAccessToken      : loginByAccessToken
};