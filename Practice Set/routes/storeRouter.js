//External Module
const express = require('express');
const storeRouter = express.Router();

//Local Module
const homesController = require("../controllers/storeController");

//Midlleware
storeRouter.get("/", homesController.getIndex);
storeRouter.get("/bookings", homesController.getBookings);
storeRouter.get("/bookings/:bookingId/confirm", homesController.getBookingConfirmation);
storeRouter.post("/bookings/:bookingId/cancel", homesController.postCancelBooking);
storeRouter.get("/homes", homesController.getHomes);
storeRouter.get("/favourites", homesController.getFavouriteList);
storeRouter.get("/recently-viewed", homesController.getRecentlyViewed);
storeRouter.get("/profile", homesController.getUserProfile);
storeRouter.post("/profile", homesController.postUpdateProfile);

storeRouter.get("/homes/:homeId", homesController.getHomeDetails);
storeRouter.get("/homes/:homeId/book", homesController.getBookHome);
storeRouter.post("/homes/:homeId/book", homesController.postBookHome);
storeRouter.get("/homes/:homeId/review", homesController.getAddReview);
storeRouter.post("/homes/:homeId/review", homesController.postAddReview);
storeRouter.post("/favourites", homesController.postAddtoFavourite);
storeRouter.post("/favourites/delete/:homeId", homesController.postRemoveFromFavourite);
storeRouter.get("/payment/:bookingId", homesController.getPaymentPage);
storeRouter.post("/payment/:bookingId", homesController.postPayment);
storeRouter.get("/past-bookings", homesController.getPastBookings);

module.exports = storeRouter;