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


const mongoose = require("mongoose");
const Rating = require("./rating.js");
mongoose.connect(process.env.MONGO_CONNECTION_STRING)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error(err));


app.post("/submit", async (req, res) => {
    const location = req.body.dropdown;
    const rating = req.body.rating;
    const comment = req.body.comment;
    
    try {
        const newRating = new Rating({
            name: "John",
            rating: rating,
            comment: comment,
            location: {
                type: 'Point',
                coordinates: [38.9880, 76.9385] // hopefully mckeldin library coords
            },
            weather: 68
        });
        await newRating.save();
        res.redirect("/"); // or render a success page
    } catch (e) {
        response.status(500).send("Error saving to database");
    }
});


// (async () => {
//    try {
//       await mongoose.connect(process.env.MONGO_CONNECTION_STRING);
//     //   const rating1 = new Rating({
//     //     name: "Grace",
//     //     rating: 5,
//     //     comment: "Wow I love McKeldin and the cool nice amazing weather we have here",
//     //     location: {
//     //       type: 'Point',
//     //       coordinates: [38.985946, 76.9450396] // hopefully mckeldin library coords
//     //     },
//     //     weather: 68
//     //   });
//     //   await rating1.save();
      
//       const testing = await Rating.find({});
//       console.log("Ratings\n", testing);
//       mongoose.disconnect();
//    } catch (err) {
//       console.error(err);
//    }
// })();