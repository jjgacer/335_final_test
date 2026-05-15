const path = require("path");
const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
require("dotenv").config({
    path: path.resolve(__dirname, ".env"),
});


const buildings = require("./data/buildings.json");
const { updateBuildingRatings } = require("./helpers");

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

const app = express();
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates"));
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.json());
app.use(express.static(path.resolve(__dirname, 'public')));
app.use('/leaflet', express.static(__dirname + '/node_modules/leaflet/dist'));

const apiRouter = require("./api");
app.use("/api", apiRouter);
app.listen(portNumber);

app.get("/", (req, res) => {
    res.render("index", { buildings });
});

// ...existing code...


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