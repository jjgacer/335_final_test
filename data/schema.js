const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'User name is required'],
        trim: true
    },
    rating: {
        type: Number,
        required: true,
        min: 0.5,
        max: 5
    },
    comment: {
        type: String,
        maxLength: [512, 'Comment cannot exceed 512 characters']
    },
    location: {
        type: String,
        maxLength: [128, 'Location id cannot exceed 128 characters']
    },
    weather: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Rating', ratingSchema);