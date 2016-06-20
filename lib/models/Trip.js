var mongoose = require('mongoose'),
    tripSchema;

tripSchema = new mongoose.Schema({
    'request': {
        type: mongoose.Schema.ObjectId,
        ref: 'Request',
        required: true,
        index: true
    },
    'request_id': {
        type: String,
        required: true
    },
    'vehicle': {
        'make': String,
        'model': String,
        'picture_url': String,
        'plate': String
    },
    'location': {
        'bearing': String,
        'latitude': Number,
        'longitude': Number
    },
    'driver': {
        'name': String,
        'phone': Number,
        'picture_url': String,
        'rating': Number
    },
    'eta': Number,
    'surge_multiplier': Number,
    'status': {
        type: String,
        required: true
    },
    'created': {
        type: Date,
        default: Date.now
    }
});

tripSchema.methods('toJSON', function () {
    var trip = {
        id          : this._id,
        request_id  : this.request_id,
        request     : this.request,
        vehicle     : this.vehicle,
        location    : this.location,
        driver      : this.driver,
        eta         : this.eta,
        surge       : this.surge_multiplier,
        status      : this.status,
        created     : this.created
    };

    return trip;
});

// Compile the trip model
mongoose.model('Trip', tripSchema);

// Export the model
module.exports = mongoose.model('Trip');
