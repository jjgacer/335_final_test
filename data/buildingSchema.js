const mongoose = require('mongoose');

const buildingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    rating: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Building', buildingSchema);
