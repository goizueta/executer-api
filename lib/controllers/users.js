var _ = require('lodash'),
    env = process.env.NODE_ENV || 'development',
    config = require('../../config/config')[env],
    OAuth = require('oauth'),
    request = require('request'),
    Firebase = require('firebase'),
    root = new Firebase(config.firebase.rootRefUrl),
    OAuth2 = new OAuth.OAuth2(config.uber.clientId, config.uber.secretKey, '', config.uber.authorize_url, config.uber.access_token_url, config.uber.base_uber_url);

function loginByAccessToken(req, res) {
    var access_token = req.body.access_token;

    request.get(config.uber.profile_url, {
        auth:  {'bearer': access_token},
        json: true
    }, function (err, status, data) {
        if (err) {
            console.log('Access token login error - ', err);
            return res.status(401).json({ error: err });
        } else {
            console.log('Access token login response: ', data);
            data.accessToken = access_token;

            root.child('users').child(data.uuid).once('value', function (snap) {
                if(snap.val()) {
                    console.log('User exists', snap.val());

                    root.child('users').child(data.uuid).update({accessToken: access_token, promo_code: data.promo_code}, function(err) {
                        if(!err) {
                            return res.send({message: 'User updated', response: data});
                        }
                        return res.status(401).json({ error: err });
                    });
                } else {
                    root.child('users').child(data.uuid).set(data, function(err) {
                        if(!err) {
                            console.log('saved user');
                            return res.send({message: 'User created', response: data});
                        }
                        return res.status(401).json({ error: err });
                    });
                }
            });
        }
    });
}

function loginByOAuth(req, res) {
    var params = {
        'response_type': 'code',
        'redirect_uri': config.uber.redirect_url,
        'scope': 'profile request request_receipt history history_lite'
    },
    login_url = OAuth2.getAuthorizeUrl(params);

    console.log('OAuthorize URL - ', login_url);

    res.redirect(login_url);
}

function uberCallback(req, res) {
    var query = req.query;

    console.log('Callback code: - ', query);

    var params = {
        'redirect_uri': config.uber.redirect_url,
        'code':         query.code,
        'grant_type':   'authorization_code',
        client_id: config.uber.clientId,
        client_secret: config.uber.secretKey
    };

    OAuth2.getOAuthAccessToken(query.code, params, function (err, access_token, refresh_token, results) {
        if (err) {
            console.log(err);
            return res.status(401).json({ error: err });
        }

        console.log('OAuth results - ', results);
        access_token = results.access_token;

        request.get(config.uber.profile_url, {
            auth:  {'bearer': access_token},
            json: true
        }, function (err, status, data) {
            if (err) {
                console.log(err);
                return res.status(401).json({ error: err });
            } else {
                console.log('Uber profile: ', data);
                data.accessToken = access_token;

                root.child('users').child(data.uuid).once('value', function (snap) {
                    if (snap.val()) {
                        console.log('User exists', snap.val());
                        
                        root.child('users').child(data.uuid).update({accessToken: access_token, promo_code: data.promo_code, picture: data.picture}, function (err) {
                            if (!err) {
                                return res.send({message: 'User updated', response: data});
                            }

                            return res.status(401).json({ error: err });
                        });
                    } else {
                        root.child('users').child(data.uuid).set(data, function (err) {
                            if (!err) {
                                console.log('saved user');
                                return res.send({message: 'User created', response: data});
                            }
                            return res.status(401).json({ error: err });
                        });
                    }
                });
            }
        });
    });
}

module.exports = {
    loginByOAuth            : loginByOAuth,
    loginByAccessToken      : loginByAccessToken,
    uberCallback            : uberCallback
};