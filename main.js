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