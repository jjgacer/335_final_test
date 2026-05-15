const path = require("path");
const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
require("dotenv").config({
    path: path.resolve(__dirname, ".env"),
});

const buildings = require("./data/buildings.json");
const Rating = require("./data/schema");
const Building = require("./data/buildingSchema");

process.stdin.setEncoding("utf8");

if (process.argv.length != 2) {
    process.stdout.write(`Usage: node main.js\n`);
    process.exit(1);
}

const portNumber = parseInt(process.env.PORT_NUMBER);

mongoose.connect(process.env.MONGO_CONNECTION_STRING)
    .then(async () => {
        console.log('Connected to MongoDB');
        await updateBuildingRatings();
    })
    .catch(err => console.error('MongoDB connection error:', err));

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

const app = express();
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates"));
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.json());
app.use(express.static(path.resolve(__dirname, 'public')));
app.use('/leaflet', express.static(__dirname + '/node_modules/leaflet/dist'));
app.listen(portNumber);

app.get("/", (req, res) => {
    res.render("index", { buildings });
});

app.get("/api/weather", async (req, res) => {
    const temperature = await getWeather();
    res.json({ temperature });
});

app.get("/api/sidebar", (req, res) => {
    res.render("components/sidebar-content", { buildings }, (err, html) => {
        if (err) {
            return res.status(500).json({ error: "Render error" });
        }
        res.send(html);
    });
});

app.get("/api/comments/:location", async (req, res) => {
    try {
        const location = req.params.location;
        const building = buildings.find(b => b.name === location);
        if (!building) {
            return res.status(404).json({ error: "Building not found" });
        }
        const comments = await Rating.find({ location }).sort({ createdAt: -1 });
        res.render("components/detail-view", { building, comments }, (err, html) => {
            if (err) {
                return res.status(500).json({ error: "Render error" });
            }
            res.send(html);
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post("/api/ratings", async (req, res) => {
    try {
        const rating = new Rating(req.body);
        await rating.save();
        await updateBuildingRatings();
        res.json({ success: true });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

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
        const forecastRes = await fetch(properties.forecast, options);
        if (!forecastRes.ok)
            throw new Error('Forecast fetch failed');

        const weather = await forecastRes.json();

        return weather.properties.periods[0].temperature;
    } catch (e) {
        console.error(e);
        return 0;
    }
}