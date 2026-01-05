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
    default: 0
  },
  photo: [String],
  description: String,
  propertyType: {
    type: String,
    enum: ['apartment','house', 'villa','studio'],
    default: 'house'
  },
  bedrooms: {
    type: Number,
    default: 1
  },
  bathrooms: {
    type: Number,
    default: 1
  },
  maxGuests: {
    type: Number,
    default: 2
  },
  amenities: [{
    type: String,
    enum: ['wifi', 'parking', 'pool', 'ac', 'heating', 'kitchen', 'tv', 'washer', 'dryer', 'gym', 'balcony', 'garden']
  }],
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  hostName: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
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
