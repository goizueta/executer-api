var mongoose = require('mongoose'),
    userSchema;

userSchema = new mongoose.Schema({
    // Uber user's unique identifier
    'uuid': {
        type: String,
        required: true
    },
    // Uber rider's identifier
    'rider_id': {
        type: String
    },
    // User's first name
    'first_name': {
        type: String,
        required: true
    },
    // User's last name
    'last_name': {
        type: String,
        required: true
    },
    // User's email address
    'email': {
        type: String,
        required: true
    },
    // User's picture
    'picture': {
        type: String,
        required: true
    },
    // User's promo code
    'promo_code': {
        type: String
    },
    // User's mobile verification status
    'mobile_verified': {
        type: Boolean
    },
    // User's access token
    'accessToken': {
        type: String,
        required: true
    },
    // User's active status
    'active': {
        type: Boolean,
        default: true
    },
    // User's registration date
    'createdAt': {
        type: Date,
        default: Date.now
    }
});

userSchema.method('toJSON', function () {
    var user = {
        id              : this._id,
        uber_id         : this.uuid,
        rider_id        : this.rider_id,
        first_name      : this.first_name,
        last_name       : this.last_name,
        email           : this.email,
        active          : this.active,
        createdAt       : this.createdAt,
        avatar          : this.picture,
        promo_code      : this.promo_code,
        mobile_verified : this.mobile_verified
    };

    return user;
});

// Compile User model
mongoose.model('User', userSchema);

// Export User model
module.exports = mongoose.model('User');
