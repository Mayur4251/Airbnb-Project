//External Module
const express = require('express');
const storeRouter = express.Router();

//Local Module
const homesController = require("../controllers/storeContoller")

//Midlleware
storeRouter.get("/", homesController.getIndex);
storeRouter.get("/bookings", homesController.getBookings);
storeRouter.get("/homes", homesController.getHomes);
storeRouter.get("/favourites", homesController.getFavouriteList);

storeRouter.get("/homes/:homeId", homesController.getHomeDetails);
storeRouter.post("/favourites", homesController.postAddtoFavourite);
storeRouter.post("/favourites/delete/:homeId", homesController.postRemoveFromFavourite);

module.exports = storeRouter;