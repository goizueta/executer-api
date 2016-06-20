var mongoose = require('mongoose'),
    requestSchema;

requestSchema = new mongoose.Schema({
    // User ID
    'user': {
        type: mongoose.Schema.ObjectId,
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
});

// Compile Request model
mongoose.model('Request', requestSchema);

// Export Request model
module.exports = mongoose.model('Request');
