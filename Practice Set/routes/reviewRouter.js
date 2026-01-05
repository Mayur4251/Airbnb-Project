const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/reviewController");
const isAuth = require("../middleware/is-auth");

router.get("/homes/:homeId/review", isAuth, reviewController.getAddReview);
router.post("/homes/:homeId/review", isAuth, reviewController.postReview);

module.exports = router;
