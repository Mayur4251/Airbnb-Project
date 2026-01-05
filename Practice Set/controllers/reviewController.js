const Home = require("../models/home");
const Review = require("../models/review");
const Booking = require("../models/booking");

/* ---------------- GET ADD / UPDATE REVIEW ---------------- */

exports.getAddReview = async (req, res) => {
  try {
    const homeId = req.params.homeId;
    const userId = req.session.user._id;

    // Fetch home details
    const home = await Home.findById(homeId);
    if (!home) {
      return res.redirect("/past-bookings");
    }

    // Check if booking is completed
    const booking = await Booking.findOne({
      userId,
      homeId,
      status: "completed"
    });

    const hasBooking = !!booking;

    // Fetch existing review (if any)
    const existingReview = await Review.findOne({
      userId,
      homeId
    });

    res.render("store/add-review", {
      pageTitle: "Add Review",
      home,
      hasBooking,
      existingReview
    });

  } catch (err) {
    console.log(err);
    res.redirect("/past-bookings");
  }
};

/* ---------------- POST REVIEW ---------------- */

exports.postReview = async (req, res) => {
  try {
    const homeId = req.params.homeId;
    const userId = req.session.user._id;
    const { rating, comment } = req.body;

    // Get user name from session
    const userName = `${req.session.user.firstName} ${req.session.user.lastName}`;

    // Verify completed booking
    const booking = await Booking.findOne({
      userId,
      homeId,
      status: "completed"
    });

    if (!booking) {
      return res.redirect(`/homes/${homeId}`);
    }

    // Check if review already exists
    let review = await Review.findOne({ userId, homeId });

    if (review) {
      // Update existing review
      review.rating = rating;
      review.comment = comment;
      await review.save();
    } else {
      // Create new review
      review = new Review({
        userId,
        homeId,
        userName,   // ✅ REQUIRED by your schema
        rating,
        comment,
        photos: []  // optional, future use
      });

      await review.save();

      // Mark booking as reviewed
      booking.reviewGiven = true;
      await booking.save();
    }

    res.redirect("/past-bookings");

  } catch (err) {
    console.log(err);
    res.redirect("/past-bookings");
  }
};
