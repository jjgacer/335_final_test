const path = require("path");
const express = require('express');
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
require("dotenv").config({
    path: path.resolve(__dirname, ".env"),
});


const buildings = require("./data/buildings.json");
const { updateBuildingRatings, getWeather } = require("./helpers");

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
