const mongoose = require("mongoose");

const homeSchema = new mongoose.Schema({
  houseName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true
  },
  photo: [String],
  description: String
});

/*
  CASCADE DELETE:
  When a Home is deleted,
  all related Favourite records are also deleted
*/
// homeSchema.pre("findOneAndDelete", async function () {
//   console.log("Came to pre hook while deleting a home");
//   const homeId = this.getQuery()._id;
//   await Favourite.deleteMany({ homeId });
// });

module.exports = mongoose.model("Home", homeSchema);
