var development = {
    db: {
        url                 : 'mongodb://localhost/executer',
    },
    firebase: {
        rootRefUrl          : "https://project-4946325313836123278.firebaseio.com/",
        secretKey           : "mJ7NQ9eTXCowtmSzAAWqDFAF9n9kiufKdVxD09hQ"
    },
    calendar: {
        clientId            : "453264479059-fc56k30fdhl07leahq5n489ct7ifk7md.apps.googleusercontent.com",
        clientSecret        : "XA-7mkghxVKC-iXkCR9VnAbe",
        authorize_url       : "https://www.googleapis.com/auth/calendar.readonly",
        events_url          : "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        callBackURL         : "http://localhost:5555/calendar/callback"
    },
    uber: {
        clientId            : "rr2NzvHi69QJalUHz0ImU1KidoE1KGc5",
        access_token_url    : "https://login.uber.com/oauth/token",
        authorize_url       : "https://login.uber.com/oauth/authorize",
        base_url            : "https://login.uber.com/",
        scopes              : ["profile", "history_lite", "request"],
        base_uber_url       : "https://api.uber.com/v1/",
        base_uber_url_v1_1  : "https://api.uber.com/v1.1/",
        profile_url         : "https://api.uber.com/v1/me",
        sandbox_base_url    : "https://sandbox-api.uber.com/v1/",
        redirect_url        : "http://localhost:5555/uber/callback",
        secretKey           : "aw-quoDm9pKUvQL9NrgdwlUcegrj_JOJpRSVtUj4",
        server_token        : "WaxCkdTlaVFmB9Vf76q_buaTGqVad5ODrYX5S5h2"
    }
};

var production = {
    db: {
        url                 : ''
    },
    firebase: {
        rootRefUrl          : "https://project-4946325313836123278.firebaseio.com/",
        secretKey           : "mJ7NQ9eTXCowtmSzAAWqDFAF9n9kiufKdVxD09hQ"
    },
    calendar: {
        clientId            : "453264479059-fc56k30fdhl07leahq5n489ct7ifk7md.apps.googleusercontent.com",
        clientSecret        : "XA-7mkghxVKC-iXkCR9VnAbe",
        callBackURL         : "https://andelahack.herokuapp.com/calendar/callback"
    },
    uber: {
        clientId            : "rr2NzvHi69QJalUHz0ImU1KidoE1KGc5",
        access_token_url    : "https://login.uber.com/oauth/token",
        authorize_url       : "https://login.uber.com/oauth/authorize",
        base_url            : "https://login.uber.com/",
        scopes              : ["profile", "history_lite", "request"],
        base_uber_url       : "https://api.uber.com/v1/",
        base_uber_url_v1_1  : "https://api.uber.com/v1.1/",
        profile_url         : "https://api.uber.com/v1/me",
        sandbox_base_url    : "https://sandbox-api.uber.com/v1/",
        redirect_url        : "https://andelahack.herokuapp.com/uber/callback",
        secretKey           : "aw-quoDm9pKUvQL9NrgdwlUcegrj_JOJpRSVtUj4",
        server_token        : "WaxCkdTlaVFmB9Vf76q_buaTGqVad5ODrYX5S5h2"
    }
};

var staging = {
    db: {
        url                 : ''
    },
    firebase: {
        rootRefUrl          : "https://project-4946325313836123278.firebaseio.com/",
        secretKey           : "mJ7NQ9eTXCowtmSzAAWqDFAF9n9kiufKdVxD09hQ"
    },
    calendar: {
        clientId            : "453264479059-fc56k30fdhl07leahq5n489ct7ifk7md.apps.googleusercontent.com",
        clientSecret        : "XA-7mkghxVKC-iXkCR9VnAbe",
        callBackURL         : "http://localhost:5555/calendar/callback"
    }
};

var test = {
    db: {
        url                 : ''
    },
    firebase: {
        rootRefUrl          : "https://project-4946325313836123278.firebaseio.com/",
        secretKey           : "mJ7NQ9eTXCowtmSzAAWqDFAF9n9kiufKdVxD09hQ"
    },
    calendar: {
        clientId            : "453264479059-fc56k30fdhl07leahq5n489ct7ifk7md.apps.googleusercontent.com",
        clientSecret        : "XA-7mkghxVKC-iXkCR9VnAbe",
        callBackURL         : "http://localhost:5555/calendar/callback"
    }
};

module.exports = {
    development : development,
    test        : test,
    production  : production,
    staging     : staging
};
