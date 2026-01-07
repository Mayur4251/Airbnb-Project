const express = require('express');
const hostRouter = express.Router();
const upload = require("../utils/multer");

const hostController = require("../controllers/hostController")

// GET: Show form
hostRouter.get('/add-home', hostController.getAddHome);

// POST: Handle form submission
hostRouter.post("/add-home", upload.array("photo", 5), hostController.postAddHome);

hostRouter.get('/host-home-list', hostController.getHostHomes);

hostRouter.get('/edit-home/:homeId', hostController.getEditHome);

hostRouter.post('/edit-home', hostController.postEditHome);

hostRouter.post('/delete-home/:homeId', hostController.postDeleteHome);
// Export router and shared array
exports.hostRouter = hostRouter;
