const express = require("express");
const hostController = require("../controllers/hostController");
const upload = require("../utils/multerCloudinary");


const hostRouter = express.Router();

/* ---------------- GET: Show add home form ---------------- */
hostRouter.get("/add-home", hostController.getAddHome);

/* ---------------- POST: Add new home ---------------- */
hostRouter.post(
  "/add-home",
  upload.array("photos", 5),
  hostController.postAddHome
);

/* ---------------- GET: Host homes list ---------------- */
hostRouter.get("/host-home-list", hostController.getHostHomes);

/* ---------------- GET: Edit home form ---------------- */
hostRouter.get("/edit-home/:homeId", hostController.getEditHome);

/* ---------------- POST: Update home ---------------- */
hostRouter.post(
  "/edit-home",
  upload.array("photos", 5),
  hostController.postEditHome
);

/* ---------------- POST: Delete home ---------------- */
hostRouter.post(
  "/delete-home/:homeId",
  hostController.postDeleteHome
);

module.exports = hostRouter;
