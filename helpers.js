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

async function getWeather() {
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'national-weather-service.p.rapidapi.com'
        }
    };

    try {
        // somewhere in college park...
        const res = await fetch('https://national-weather-service.p.rapidapi.com/points/38.9807,-76.9379', options);
        if (!res.ok)
            throw new Error('NWS API fetch failed');

        const { properties } = await res.json();
        // Get the observation stations URL
        const stationsRes = await fetch(properties.observationStations, options);
        if (!stationsRes.ok)
            throw new Error('Observation stations fetch failed');
        const stationsData = await stationsRes.json();
        const stationId = stationsData.features[0].properties.stationIdentifier;
        const observationUrl = `https://national-weather-service.p.rapidapi.com/stations/${stationId}/observations/latest`;

        const observationRes = await fetch(observationUrl, options);
        if (!observationRes.ok)
            throw new Error('Observation fetch failed');

        const observationData = await observationRes.json();
        const temp = observationData.properties.temperature.value;
        // Convert Celsius to Fahrenheit if needed
        const fahrenheit = temp !== null ? Math.round((temp * 9) / 5 + 32) : null;
        return fahrenheit;
    } catch (e) {
        console.error(e);
        return 0;
    }
}

module.exports = { updateBuildingRatings, getWeather };
