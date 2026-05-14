const fs = require('fs');
const path = require("path");
const express = require('express');
const bodyParser = require("body-parser");
require("dotenv").config({
    path: path.resolve(__dirname, ".env"),
});

process.stdin.setEncoding("utf8");

if (process.argv.length != 2) {
    process.stdout.write(`Usage: node main.js\n`);
    process.exit(1);
}

const portNumber = parseInt(process.env.PORT_NUMBER);

const app = express();
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "templates"));
app.use(bodyParser.urlencoded({extended:false}));
app.listen(portNumber);

app.get("/", (req, res) => {
    res.render("index")
})

const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  // 1. Name of the reviewer
  name: {
    type: String,
    required: [true, 'User name is required'],
    trim: true
  },

  // 2. Numerical Rating (1-5 star scale)
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },

  // 3. User Comment
  comment: {
    type: String,
    maxLength: [500, 'Comment cannot exceed 500 characters']
  },

  // 4. Geospatial Location (GeoJSON Point)
  // Required for spatial queries like .find({ location: { $near: ... } })
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },

  // 5. Weather Snapshot (Object)
  // Useful for tracking context (e.g., "Was it raining when they rated?")
  weather: {
    temp: Number,
    condition: String, // e.g., 'Sunny', 'Rainy'
    humidity: Number
  },

  // 6. Metadata
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a 2dsphere index for the location to enable proximity searches
ratingSchema.index({ location: '2dsphere' });

const Rating = mongoose.model('Rating', ratingSchema);

async function getWeather() {
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'national-weather-service.p.rapidapi.com',
            'User-Agent': 'CollegeParkWeatherApp/1.0' // Good practice for NWS API
        }
    };

    try {
        // STEP 1: Get metadata for coordinates
        const step1Response = await fetch('https://national-weather-service.p.rapidapi.com/points/38.9807,-76.9379', options);
        
        if (!step1Response.ok) {
            throw new Error(`Step 1 failed: ${step1Response.statusText}`);
        }

        const zoneData = await step1Response.json();
        const forecastUrl = zoneData.properties.forecast;
        
        // STEP 2: Fetch the forecast
        // We use the same options here to keep the User-Agent consistent
        const step2Response = await fetch(forecastUrl, { headers: { 'User-Agent': 'CollegeParkWeatherApp/1.0' } });
        
        if (!step2Response.ok) {
            throw new Error(`Step 2 failed: ${step2Response.statusText}`);
        }

        const weatherData = await step2Response.json();
        
        // STEP 3: Access and display data
        const currentPeriod = weatherData.properties.periods[0];
        const currentTemp = currentPeriod.temperature;
        const unit = currentPeriod.temperatureUnit; // Dynamically get F or C
        
        console.log(`The forecast for ${currentPeriod.name} is ${currentTemp}°${unit}.`);
        console.log(`Conditions: ${currentPeriod.shortForecast}`);
        
    } catch (error) {
        console.error("Weather Fetch Error:", error.message);
    }
}

getWeather();