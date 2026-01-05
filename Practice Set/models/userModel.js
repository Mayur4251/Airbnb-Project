const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required']
  },
  lastName: String,
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  userType: {
    type: String,
    required: ['guest', 'host'],
    default: 'guest'
  },
  favourites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Home'
    }
  ],
  bookings: [
    {
      homeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Home',
        required: true
      },
      bookingDate: {
        type: Date,
        default: Date.now
      },
      checkInDate: {
        type: Date,
        required: true
      },
      checkOutDate: {
        type: Date,
        required: true
      },
      totalPrice: {
        type: Number,
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'confirmed'
      }
    }
  ],
  recentlyViewed: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Home'
  }],
  phoneNumber: String,
  bio: String
 });

module.exports = mongoose.model("User", userSchema);
