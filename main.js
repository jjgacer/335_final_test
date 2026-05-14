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


const { MongoClient } = require('mongodb');
const uri = `mongodb://localhost:${portNumber}/WeatherProject`;
const client = new MongoClient(uri);

// console.log("Connecting to MongoDB...");
async function connect() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Connection failed', error);
  }
}

connect();
// console.log("Connected to MongoDB, ready to handle requests.");

const mongoose = require("mongoose");
const Wow = require("./goose_test.js");
(async () => {
   try {
      await mongoose.connect(process.env.MONGO_CONNECTION_STRING);
      
      const aa = await Wow.find({});
      console.log("Songs\n", aa);

      mongoose.disconnect();
   } catch (err) {
      console.error(err);
   }
})();