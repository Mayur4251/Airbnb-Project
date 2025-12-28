const Home = require("../models/home");
const User = require("../models/userModel");

/* ---------------- HOME LIST ---------------- */

exports.getHomes = (req, res, next) => {
  Home.find().then((registeredHomes) => {
    res.render("store/home-list", {
      registeredHomes,
      pageTitle: "Airbnb Homes",
      currentPage: "Home",
      isLoggedIn: req.isLoggedIn,
    });
  });
};

/* ---------------- INDEX ---------------- */

exports.getIndex = (req, res, next) => {
  console.log("Session Value: ", req.session);
  Home.find().then((registeredHomes) => {
    res.render("store/index", {
      registeredHomes,
      pageTitle: "Airbnb Home",
      currentPage: "index",
      isLoggedIn: req.isLoggedIn,
    });
  });
};

/* ---------------- BOOKINGS ---------------- */

exports.getBookings = (req, res, next) => {
  res.render("store/bookings", {
    pageTitle: "My Bookings",
    currentPage: "bookings",
    isLoggedIn: req.isLoggedIn,
  });
};

/* ---------------- FAVOURITES ---------------- */

exports.getFavouriteList = async (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  const userId = req.session.user._id;
  const user = await User.findById(userId).populate("favourites");
  res.render("store/favourite-list", {
    favouriteHomes: user.favourites,
    pageTitle: "My Favourites",
    currentPage: "favourites",
    isLoggedIn: req.isLoggedIn,
  });
};

/* ---------------- ADD TO FAVOURITE ---------------- */

exports.postAddtoFavourite = async (req, res, next) => {
  console.log("postAddtoFavourite - Session:", req.session);
  console.log("postAddtoFavourite - Session user:", req.session.user);
  console.log("postAddtoFavourite - isLoggedIn:", req.isLoggedIn);

  if (!req.session.isLoggedIn || !req.session.user) {
    console.log("User not logged in, redirecting to login");
    return res.redirect("/login");
  }

  try {
    const homeId = req.body.id;
    const userId = req.session.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).render("error", { message: "User not found" });
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
  const homeId = req.params.homeId;
  const userId = req.session.user._id;
  const user = await User.findById(userId);
  if (user.favourites.includes(homeId)) {
    user.favourites = user.favourites.filter((fav) => fav != homeId);
    await user.save();
  }
  res.redirect("/favourites");
};

/* ---------------- HOME DETAILS ---------------- */

exports.getHomeDetails = (req, res, next) => {
  const homeId = req.params.homeId;

  Home.findById(homeId).then((home) => {
    if (!home) {
      return res.redirect("/homes");
    }
    res.render("store/home-detail", {
      home,
      pageTitle: "Home Detail",
      currentPage: "home-details",
      isLoggedIn: req.isLoggedIn,
    });
  });
};
