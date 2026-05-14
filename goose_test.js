const mongoose = require("mongoose");

const testSchema = new mongoose.Schema({
   title: {
      type: String,
      required: true
   },
   oscars: {
      type: Number,
      required: true
   }
});

const Movie = mongoose.model("Movie", testSchema);
module.exports = Movie;
