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
    const DUMMY_TEMP = 58; 
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'national-weather-service.p.rapidapi.com',
            'User-Agent': 'CollegeParkWeatherApp/1.0'
        }
    };

    try {
        const metadataResponse = await fetch('https://national-weather-service.p.rapidapi.com/points/38.9807,-76.9379', options);
        if (!metadataResponse.ok) throw new Error('Metadata fetch failed');
        
        const { properties } = await metadataResponse.json();
        const forecastResponse = await fetch(properties.forecast, options);
        if (!forecastResponse.ok) throw new Error('Forecast fetch failed');
        
        const weatherData = await forecastResponse.json();
        
        // Return only the temperature number
        return weatherData.properties.periods[0].temperature;

    } catch (error) {
        console.warn(`Weather Scraping failed: ${error.message}. Using dummy temp.`);
        return DUMMY_TEMP;
    }
}

// Updated Route for your Express app
app.post("/submit-rating", async (req, res) => {
    try {
        const { name, rating, comment } = req.body;
        const currentTemp = await getWeather();

        const newRating = new Rating({
            name,
            rating: Number(rating),
            comment,
            location: {
                type: 'Point',
                coordinates: [-76.9379, 38.9807]
            },
            weather: {
                temp: currentTemp
                // condition and humidity will remain undefined/empty in the DB
            }
        });

        await newRating.save();
        res.render("success", { name });
        
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving rating.");
    }
});