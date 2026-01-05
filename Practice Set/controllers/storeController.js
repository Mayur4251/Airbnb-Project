const Home = require("../models/home");
const User = require("../models/userModel");
const Review = require("../models/review");
const Booking = require("../models/booking");

const updateCompletedBookings = async (userId) => {
  const today = new Date();

  const user = await User.findById(userId);
  if (!user) return;

  let updated = false;

  user.bookings.forEach((booking) => {
    if (
      booking.status === "confirmed" &&
      new Date(booking.checkOutDate) < today
    ) {
      booking.status = "completed";
      updated = true;
    }
  });

  if (updated) {
    await user.save();
  }
};

/* ---------------- HOME LIST ---------------- */

exports.getHomes = async (req, res, next) => {
  try {
    const registeredHomes = await Home.find();
    res.render("store/home-list", {
      registeredHomes,
      pageTitle: "EliteDwell Homes",
      currentPage: "Home",
      isLoggedIn: req.isLoggedIn,
    });
  } catch (err) {
    console.error("Error fetching homes:", err);
    next(err);
  }
};

/* ---------------- INDEX WITH SEARCH, FILTER & PAGINATION ---------------- */

exports.getIndex = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    // Search and filter parameters
    const search = req.query.search || "";
    const minPrice = req.query.minPrice ? parseInt(req.query.minPrice) : 0;
    const maxPrice = req.query.maxPrice ? parseInt(req.query.maxPrice) : 999999;
    const minRating = req.query.minRating ? parseFloat(req.query.minRating) : 0;
    const propertyType = req.query.propertyType || "";
    const amenities = req.query.amenities
      ? Array.isArray(req.query.amenities)
        ? req.query.amenities
        : [req.query.amenities]
      : [];
    const sortBy = req.query.sortBy || "newest";

    // Build query
    let query = {};

    if (search) {
      query.$or = [
        { houseName: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (minPrice || maxPrice) {
      query.price = { $gte: minPrice, $lte: maxPrice };
    }

    if (minRating) {
      query.rating = { $gte: minRating };
    }

    if (propertyType) {
      query.propertyType = propertyType;
    }

    if (amenities.length > 0) {
      query.amenities = { $in: amenities };
    }

    // Build sort object
    let sort = {};
    switch (sortBy) {
      case "priceLow":
        sort = { price: 1 };
        break;
      case "priceHigh":
        sort = { price: -1 };
        break;
      case "rating":
        sort = { rating: -1 };
        break;
      case "newest":
      default:
        sort = { createdAt: -1 };
        break;
    }

    // Execute query with pagination
    const [registeredHomes, totalHomes] = await Promise.all([
      Home.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Home.countDocuments(query),
    ]);

    // FIXED: Optimize N+1 query - Fetch all reviews at once
    const homeIds = registeredHomes.map((h) => h._id);
    const allReviews = await Review.find({ homeId: { $in: homeIds } });

    // Group reviews by homeId
    const reviewsByHome = {};
    allReviews.forEach((review) => {
      const homeId = review.homeId.toString();
      if (!reviewsByHome[homeId]) {
        reviewsByHome[homeId] = [];
      }
      reviewsByHome[homeId].push(review);
    });

    // Calculate average rating for each home
    registeredHomes.forEach((home) => {
      const reviews = reviewsByHome[home._id.toString()] || [];
      if (reviews.length > 0) {
        const avgRating =
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        home.rating = Math.round(avgRating * 10) / 10;
      }
    });

    // REMOVED: Recently viewed tracking from index page
    // This should only happen on home detail page, not on listing page

    const totalPages = Math.ceil(totalHomes / limit);

    res.render("store/index", {
      registeredHomes,
      pageTitle: "EliteDwell Home",
      currentPage: "index",
      isLoggedIn: req.isLoggedIn,
      currentPageNum: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page + 1,
      prevPage: page - 1,
      search,
      minPrice,
      maxPrice,
      minRating,
      propertyType,
      amenities,
      sortBy,
    });
  } catch (err) {
    console.error("Error fetching homes:", err);
    next(err);
  }
};

/* ---------------- BOOKINGS ---------------- */

exports.getBookings = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect("/login");
    }

    const user = await User.findById(req.session.user._id).populate(
      "bookings.homeId"
    );

    // Normalize today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let updated = false;

    user.bookings.forEach((b) => {
      if (!b.checkOutDate) return;

      const checkOut = new Date(b.checkOutDate);
      checkOut.setHours(0, 0, 0, 0);

      // ✅ AUTO COMPLETE BOOKING
      if (b.status === "confirmed" && checkOut < today) {
        b.status = "completed";
        b.reviewAllowed = true; // ⭐ allow review
        updated = true;
      }
    });

    if (updated) {
      await user.save();
    }

    // ONLY active bookings here
    const activeBookings = user.bookings.filter(
      (b) => b.status === "confirmed" || b.status === "pending"
    );

    res.render("store/bookings", {
      pageTitle: "My Bookings",
      bookings: activeBookings,
      isLoggedIn: true,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Bookings error:", err);
    res.redirect("/");
  }
};

/* ---------------- FAVOURITES ---------------- */

exports.getFavouriteList = async (req, res, next) => {
  if (!req.session.isLoggedIn || !req.session.user) {
    return res.redirect("/login");
  }

  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId).populate("favourites");

    res.render("store/favourite-list", {
      favouriteHomes: user.favourites,
      pageTitle: "My Favourites",
      currentPage: "favourites",
      isLoggedIn: req.isLoggedIn,
    });
  } catch (err) {
    console.error("Error fetching favourites:", err);
    next(err);
  }
};

/* ---------------- ADD TO FAVOURITE ---------------- */

exports.postAddtoFavourite = async (req, res, next) => {
  if (!req.session.isLoggedIn || !req.session.user) {
    console.log("User not logged in, redirecting to login");
    return res.redirect("/login");
  }

  try {
    const homeId = req.body.id;
    const userId = req.session.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).render("error", {
        message: "User not found",
        isLoggedIn: req.isLoggedIn,
      });
    }

    if (!user.favourites.includes(homeId)) {
      user.favourites.push(homeId);
      await user.save();
      console.log("Favourite added successfully");
    } else {
      console.log("Already in favourites");
    }

    res.redirect("/favourites");
  } catch (err) {
    console.error("Error adding to favourite:", err);
    next(err);
  }
};

/* ---------------- REMOVE FROM FAVOURITE ---------------- */

exports.postRemoveFromFavourite = async (req, res, next) => {
  if (!req.session.isLoggedIn || !req.session.user) {
    return res.redirect("/login");
  }

  try {
    const homeId = req.params.homeId;
    const userId = req.session.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.redirect("/favourites");
    }

    if (user.favourites.includes(homeId)) {
      user.favourites = user.favourites.filter(
        (fav) => fav.toString() !== homeId.toString()
      );
      await user.save();
      console.log("Favourite removed successfully");
    }

    res.redirect("/favourites");
  } catch (err) {
    console.error("Error removing from favourite:", err);
    next(err);
  }
};

/* ---------------- HOME DETAILS WITH REVIEWS ---------------- */

exports.getHomeDetails = async (req, res) => {
  try {
    const homeId = req.params.homeId;

    const home = await Home.findById(homeId);
    if (!home) return res.redirect("/homes");

    const reviews = await Review.find({ homeId }).sort({ createdAt: -1 });

    let avgRating = 0;
    if (reviews.length > 0) {
      avgRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    }

    const relatedHomes = await Home.find({
      _id: { $ne: homeId },
      location: home.location,
    }).limit(4);

    res.render("store/home-detail", {
      pageTitle: home.houseName,
      home,
      reviews,
      avgRating,
      reviewCount: reviews.length,
      relatedHomes,
      isLoggedIn: req.session.isLoggedIn,
      user: req.session.user,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
};

/* ---------------- BOOK HOME (GET) ---------------- */

exports.getBookHome = async (req, res, next) => {
  if (!req.session.isLoggedIn || !req.session.user) {
    return res.redirect("/login");
  }

  try {
    const homeId = req.params.homeId;
    const home = await Home.findById(homeId);

    if (!home) {
      return res.redirect("/");
    }

    res.render("store/book-home", {
      home,
      pageTitle: "Book Home",
      currentPage: "book-home",
      isLoggedIn: req.isLoggedIn,
    });
  } catch (err) {
    console.error("Error fetching home for booking:", err);
    next(err);
  }
};

/* ---------------- BOOK HOME (POST) ---------------- */

exports.postBookHome = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect("/login");
    }

    const homeId = req.params.homeId;
    const userId = req.session.user._id;
    const { checkInDate, checkOutDate } = req.body;

    if (!checkInDate || !checkOutDate) {
      return res.redirect(`/homes/${homeId}/book`);
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkOut <= checkIn) {
      return res.redirect(`/homes/${homeId}/book`);
    }

    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    const home = await Home.findById(homeId);
    if (!home) {
      return res.redirect("/homes");
    }

    const totalPrice = home.price * nights;

    const user = await User.findById(userId);
    if (!user) {
      return res.redirect("/login");
    }

    // ✅ CREATE BOOKING (PENDING)
    const booking = {
      homeId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      totalPrice,
      status: "pending",
    };

    user.bookings.push(booking);
    await user.save();

    const bookingId = user.bookings[user.bookings.length - 1]._id;

    // ✅ SINGLE RESPONSE → PAYMENT PAGE
    return res.redirect(`/payment/${bookingId}`);
  } catch (err) {
    console.error("Error creating booking:", err);
    return res.redirect("/homes");
  }
};

/* ---------------- BOOKING CONFIRMATION ---------------- */

exports.getBookingConfirmation = async (req, res, next) => {
  if (!req.session.isLoggedIn || !req.session.user) {
    return res.redirect("/login");
  }

  try {
    const bookingId = req.params.bookingId;
    const userId = req.session.user._id;
    const user = await User.findById(userId).populate("bookings.homeId");

    if (!user) {
      return res.redirect("/bookings");
    }

    const booking = user.bookings.id(bookingId);
    if (!booking) {
      return res.redirect("/bookings");
    }

    res.render("store/booking-confirmation", {
      booking,
      pageTitle: "Booking Confirmation",
      currentPage: "booking-confirmation",
      isLoggedIn: req.isLoggedIn,
    });
  } catch (err) {
    console.error("Error fetching booking confirmation:", err);
    next(err);
  }
};

/* ---------------- CANCEL BOOKING ---------------- */

exports.postCancelBooking = async (req, res, next) => {
  if (!req.session.isLoggedIn || !req.session.user) {
    return res.redirect("/login");
  }

  try {
    const bookingId = req.params.bookingId;
    const userId = req.session.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.redirect("/bookings");
    }

    const booking = user.bookings.id(bookingId);
    if (booking && booking.status !== "cancelled") {
      booking.status = "cancelled";
      await user.save();
      console.log("Booking cancelled successfully");
    }

    res.redirect("/bookings");
  } catch (err) {
    console.error("Error cancelling booking:", err);
    next(err);
  }
};

/* ---------------- ADD REVIEW ---------------- */

exports.getAddReview = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect("/login");
    }

    const homeId = req.params.homeId;
    const userId = req.session.user._id;

    const home = await Home.findById(homeId);
    const user = await User.findById(userId);
    const existingReview = await Review.findOne({ homeId, userId });

    const hasBooking = user.bookings.some(
      (b) => b.homeId.toString() === homeId && b.status === "completed"
    );

    res.render("store/add-review", {
      pageTitle: "Add Review",
      home,
      hasBooking,
      existingReview,
      isLoggedIn: true,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Add review error:", err);
    res.redirect("/");
  }
};

exports.postAddReview = async (req, res) => {

  try {
    console.log("POST REVIEW HIT");
    console.log(req.body);
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect("/login");
    }

    const { rating, comment } = req.body;
    const homeId = req.params.homeId;
    const userId = req.session.user._id;

    if (!rating || !comment) {
      return res.redirect(`/homes/${homeId}/review`);
    }

    const user = await User.findById(userId);

    // ✅ DATE-BASED completed stay check
    const completedBooking = user.bookings.find(
      (b) =>
        b.homeId.toString() === homeId && new Date(b.checkOutDate) < new Date()
    );

    if (!completedBooking) {
      return res.redirect(`/homes/${homeId}/review`);
    }

    let review = await Review.findOne({ homeId, userId });

    if (review) {
      review.rating = Number(rating);
      review.comment = comment;
      await review.save();
    } else {
      await Review.create({
        homeId,
        userId,
        userName: user.firstName,
        rating: Number(rating),
        comment,
      });
    }

    res.redirect(`/homes/${homeId}`);
  } catch (err) {
    console.error("Review submit error:", err);
    res.redirect("/");
  }
};

/* ---------------- USER PROFILE ---------------- */

exports.getUserProfile = async (req, res, next) => {
  if (!req.session.isLoggedIn || !req.session.user) {
    return res.redirect("/login");
  }

  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.redirect("/login");
    }

    res.render("store/user-profile", {
      user,
      pageTitle: "My Profile",
      currentPage: "profile",
      isLoggedIn: req.isLoggedIn,
    });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    next(err);
  }
};

exports.postUpdateProfile = async (req, res, next) => {
  if (!req.session.isLoggedIn || !req.session.user) {
    return res.redirect("/login");
  }

  try {
    const userId = req.session.user._id;
    const { firstName, lastName, email, phoneNumber, bio } = req.body;

    // ADDED: Input validation
    if (!firstName || !lastName || !email) {
      return res.redirect("/profile");
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.redirect("/login");
    }

    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.bio = bio || user.bio;

    // Handle profile picture upload if provided
    if (req.files && req.files.length > 0) {
      user.profilePicture = req.files[0].filename;
    }

    await user.save();

    // Update session
    req.session.user.firstName = firstName;
    req.session.user.lastName = lastName;
    req.session.user.email = email;

    res.redirect("/profile");
  } catch (err) {
    console.error("Error updating profile:", err);
    next(err);
  }
};

/* ---------------- RECENTLY VIEWED ---------------- */

exports.getRecentlyViewed = async (req, res, next) => {
  if (!req.session.isLoggedIn || !req.session.user) {
    return res.redirect("/login");
  }

  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId).populate("recentlyViewed");

    if (!user) {
      return res.redirect("/login");
    }

    res.render("store/recently-viewed", {
      homes: user.recentlyViewed.reverse() || [],
      pageTitle: "Recently Viewed",
      currentPage: "recently-viewed",
      isLoggedIn: req.isLoggedIn,
    });
  } catch (err) {
    console.error("Error fetching recently viewed:", err);
    next(err);
  }
};

exports.getPaymentPage = async (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.redirect("/login");
  }

  const bookingId = req.params.bookingId;
  const userId = req.session.user._id;

  const user = await User.findById(userId).populate("bookings.homeId");
  if (!user) return res.redirect("/bookings");

  const booking = user.bookings.id(bookingId);
  if (!booking) return res.redirect("/bookings");

  res.render("store/payment", {
    booking,
    pageTitle: "Payment",
    isLoggedIn: req.isLoggedIn,
  });
};

exports.postPayment = async (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.redirect("/login");
  }

  const bookingId = req.params.bookingId;
  const userId = req.session.user._id;

  const user = await User.findById(userId);
  if (!user) return res.redirect("/bookings");

  const booking = user.bookings.id(bookingId);
  if (!booking) return res.redirect("/bookings");

  // ✅ MOCK PAYMENT SUCCESS
  booking.status = "confirmed";

  await user.save();

  res.redirect(`/bookings/${bookingId}/confirm`);
};

exports.getPastBookings = async (req, res) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect("/login");
    }

    const user = await User.findById(req.session.user._id).populate(
      "bookings.homeId"
    );

    const pastBookings = user.bookings.filter((b) => b.status === "completed");

    res.render("store/past-bookings", {
      pageTitle: "Past Bookings",
      pastBookings,
      isLoggedIn: true,
      user: req.session.user,
    });
  } catch (err) {
    console.error("Past bookings error:", err);
    res.redirect("/");
  }
};
