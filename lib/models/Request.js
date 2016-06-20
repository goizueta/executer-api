var mongoose = require('mongoose'),
    requestSchema;

requestSchema = new mongoose.Schema({
    // User ID
    'user': {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // Event summary
    'event_summary': {
        type: String
    },
    // Start details for the request
    'start': {
        'time': {
            type: Date,
            required: true
        },
        'location': {
            'address': {
                type: String,
                required: true
            },
            'latitude': {
                type: Number,
                required: true
            },
            'longitude': {
                type: Number,
                required: true
            }
        }
    },
    // End details for the request
    'end': {
        'time': {
            type: Date,
            required: true
        },
        'location': {
            'address': {
                type: String,
                required: true
            },
            'latitude': {
                type: Number,
                required: true
            },
            'longitude': {
                type: Number,
                required: true
            }
        }
    },
    // Uber Product details
    'uber': {
        'product_id': {
            type: String,
            required: true
        },
        'product': {
            type: String,
            required: true
        },
        'duration_estimate': {
            type: Number,
            required: true
        },
        'reminder': {
            type: Date,
            required: true
        }
    },
    // Time of request
    'created': {
        type: Date,
        default: Date.now,
        required: true
    },
    // Active status
    'active': {
        type: Boolean,
        default: true
    }
});

requestSchema.methods('toJSON', function () {
    var request = {
        id          : this._id,
        user        : this.user,
        meeting     : {
            start   : this.start,
            end     : this.end,
            summary : this.event_summary
        },
        uber        : this.uber,
        created     : this.created,
        active      : this.active
    };
});

// Compile Request model
mongoose.model('Request', requestSchema);

// Export Request model
module.exports = mongoose.model('Request');
