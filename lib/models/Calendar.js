var mongoose = require('mongoose'),
    calendarSchema;

calendarSchema = new mongoose.Schema({
    // User ID
    'user': {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // Calendar items in an array of objects
    'items': [{
        'time': {
            'start': {
                type: Date,
                required: true
            },
            'end': {
                type: Date,
                required: true
            }
        },
        'location': {
            type: String,
            required: true
        },
        'summary': {
            type: String,
            required: true
        },
        'status': {
            type: String
        }
    }],
    // Access & Refresh tokens for calendar authentication
    'tokens': {
        'accessToken': {
            type: String,
            required: true
        },
        'refreshToken': {
            type: String,
            required: true
        }
    },
    // Date of creation
    'created': {
        type: Date,
        default: Date.now
    },
    // Calendar status
    'active': {
        type: Boolean,
        default: true
    }
});

calendarSchema.method('toJSON', function () {
    var calendar = {
        id          : this._id,
        user        : { id: this.user },
        tokens      : this.tokens,
        items       : this.items,
        created     : this.created,
        active      : this.active
    };

    console.log(this.user.toJSON());

    return calendar;
});

// Compile calendar model
mongoose.model('Calendar', calendarSchema);

// Export calendar model
module.exports = mongoose.model('Calendar');
