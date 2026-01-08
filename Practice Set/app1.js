// ================= CORE MODULES =================
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, ".env")
});

const fs = require("fs");


// ================= EXTERNAL MODULES =================
const express = require("express");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const multer = require("multer");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const upload = require("./utils/multer");


// ================= LOCAL MODULES =================
const storeRouter = require("./routes/storeRouter");
const hostRouter = require("./routes/hostRouter");
const authRouter = require("./routes/authRouter");
const rootDir = require("./utils/pathUtil");
const errorController = require("./controllers/error");
const reviewRoutes = require("./routes/reviewRouter");

// ================= APP INIT =================
const app1 = express();

// ================= ENV =================
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3012;

// ================= VIEW ENGINE =================
app1.set("view engine", "ejs");
app1.set("views", path.join(__dirname, "views"));

// ================= SESSION STORE =================
const store = new MongoDBStore({
  uri: MONGO_URI,
  collection: "sessions",
});

store.on("error", (err) => {
  console.error("Session store error:", err);
});

// ================= MULTER CONFIG =================
const randomString = (length) => {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(rootDir, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, randomString(10) + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app1.use(upload.array("photos", 5));

// ================= GLOBAL MIDDLEWARE =================
app1.use(express.urlencoded({ extended: true }));
app1.use(express.json());

app1.use(express.static(path.join(__dirname, "public")));
app1.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= SESSION =================
app1.use(
  session({
    secret: "Mayur learning MERN Stack",
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: "lax",
    },
  })
);

// ================= FLASH =================
app1.use(flash());

app1.use((req, res, next) => {
  res.locals.success_msg = req.flash("success");
  res.locals.error_msg = req.flash("error");
  res.locals.info_msg = req.flash("info");
  next();
});

// ================= SESSION → LOCALS =================
app1.use((req, res, next) => {
  req.isLoggedIn = req.session.isLoggedIn || false;
  res.locals.isLoggedIn = req.isLoggedIn;
  res.locals.user = req.session.user || null;
  res.locals.userType = req.session.userType || null;
  next();
});

// ================= ROUTES =================
app1.use(authRouter);
app1.use(reviewRoutes);

// ================= AUTH GUARD =================
app1.use((req, res, next) => {
  const publicPaths = ["/signup", "/login", "/logout"];

  const allowedRoutes = [
    /^\/$/,
    /^\/homes$/,
    /^\/homes\/[^/]+$/,
    /^\/homes\/[^/]+\/book$/,
    /^\/homes\/[^/]+\/review$/,
    /^\/uploads/,
    /^\/public/,
  ];

  const isAllowed =
    publicPaths.includes(req.path) ||
    allowedRoutes.some((route) => route.test(req.path));

  if (!req.isLoggedIn && !isAllowed) {
    return res.redirect("/login");
  }

  next();
});

// ================= STORE ROUTES =================
app1.use(storeRouter);

// ================= HOST ROUTES =================
app1.use("/host", (req, res, next) => {
  if (!req.isLoggedIn) {
    return res.redirect("/login");
  }
  next();
});

app1.use("/host", hostRouter);

// ================= HOME PAGE =================
app1.get("/", (req, res) => {
  res.render("home", {
    pageTitle: "Home Page",
    registeredHomes,
  });
});

// ================= 404 =================
app1.use(errorController.pageNotFound);

// ================= START SERVER =================
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    console.log("Mongo URI:", process.env.MONGO_URI); // debug

    app1.listen(PORT, () => {
      console.log("Server running on port " + PORT);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
