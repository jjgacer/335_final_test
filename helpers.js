// helpers.js
const buildings = require('./data/buildings.json');
const Rating = require('./data/schema');
const Building = require('./data/buildingSchema');

async function updateBuildingRatings() {
    for (const building of buildings) {
        const ratings = await Rating.find({ location: building.name });
        const avg = ratings.length > 0
            ? Math.round(ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length * 10) / 10
            : building.rating;
        await Building.findOneAndUpdate(
            { name: building.name },
            { rating: avg },
            { upsert: true }
        );
        building.rating = avg;
    }
    console.log('Building ratings updated from database');
}

// Dummy getWeather function (replace with your actual implementation)
async function getWeather() {
    // Implement your weather logic here
    return 72; // Example temperature
}

module.exports = { updateBuildingRatings, getWeather };
