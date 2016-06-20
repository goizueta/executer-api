global.t = require('moment');
global._ = require('lodash');

var cookieParser = require('cookie-parser'),
    morgan = require('morgan'),
    mongoose = require('mongoose'),
    env = process.env.NODE_ENV || 'development',
    config = require('./config/config')[env],
    router = require('./lib/routes'),
    express = require('express'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    app = express();

console.log('\nConnecting to MongoDB at ' + config.db.url + ' ...');
mongoose.connect(config.db.url);

mongoose.connection.on('open', function () {
    console.log('\nConnected to MongoDB...');
});

mongoose.connection.on('error', function () {
    console.error('\nUnable to connect to MongoDB server!');
});

app.use(morgan('dev'));
app.use(cookieParser());
app.dir = process.cwd();

// things to do on each request
router.use(function (req, res, next) {
    // log each request in development environment
    if (env !== 'production') {
        // console.log(t().format('HH:MM'), req.method, req.url, req.socket.bytesRead);
    }

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
});

// Standard error handling
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// to support JSON-encoded bodies
app.use(bodyParser.json());

// to support URL-encoded bodies
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(cors());

app.use('/', router);

var server = app.listen(process.env.PORT || 5555, function() {
    console.log('Listening on port %d', server.address().port);
});

module.exports = app;