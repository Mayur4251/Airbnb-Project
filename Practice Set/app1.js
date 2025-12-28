// Core Module
const path = require("path");

// External Module
const express = require("express");
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const multer = require('multer')
const fs = require('fs');
const DB_PATH = "mongodb+srv://kmayur23it_db_user:Mayur4251@cluster1.rchz191.mongodb.net/airbnb?appName=Cluster1";

// Local Modules
const storeRouter = require("./routes/storeRouter");
const { hostRouter, registeredHomes } = require("./routes/hostRouter");
const authRouter = require("./routes/authRouter");
const rootDir = require("./utils/pathUtil");
const errorController = require("./controllers/error");
const { default: mongoose } = require("mongoose");

const app1 = express();

// View Engine Setup
app1.set("view engine", "ejs");
app1.set("views", path.join(__dirname, "views")); // ✅ keep only one

// MongoDB session store
const store = new MongoDBStore({
  uri: DB_PATH,
  collection: 'sessions', // ✅ better naming
});

// Log session store errors
store.on('error', function(error) {
  console.error('Session store error:', error);
});

//Here we are saving the file which is upload by the user
const randomString = (length) => {
  const characters = 'abcdefghijklnopqrstuvwxyz';
  let result = '';
  for(let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

const storage = multer.diskStorage({
  destination: (req,file,cb) => {
   const uploadDir = path.join(rootDir, 'uploads');
   // ensure uploads dir exists
   if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
   }
   cb(null, uploadDir);
  },
   filename: (req,file,cb) => {
      cb(null, randomString(10) + '-' + file.originalname); //Her it will create the ramdon name of the file
   }
});

const fileFilter = (req,file,cb) => {
  if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null,true);
  } else {
    cb(null,false);
  }
}

const multerOptions = {
  storage,fileFilter,
};

// Middleware
app1.use(express.urlencoded({ extended: true }));
// Accept multiple uploaded files from input name "photos" (max 5 files)
app1.use(multer(multerOptions).array('photos', 5));
app1.use(express.json());
app1.use(express.static(path.join(rootDir, "public")));
// Serve uploaded files from the /uploads URL path (use leading slash)
app1.use('/uploads', express.static(path.join(rootDir, "uploads")));

// SESSION (CORRECT CONFIG)
app1.use(session({
  secret: "Mayur learning MERN Stack",
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    sameSite: 'lax'
  }
}));


// SESSION → LOCALS
app1.use((req, res, next) => {
  req.isLoggedIn = req.session.isLoggedIn || false;
  res.locals.isLoggedIn = req.session.isLoggedIn || false;
  res.locals.user = req.session.user || null;
  res.locals.userType = req.session.userType || null;

  console.log("Middleware - Session user:", req.session.user);
  next();
});

// Routes
app1.use(storeRouter);
app1.use(authRouter);

// 🔐 HOST ROUTE PROTECTION
app1.use("/host", (req, res, next) => {
  if (req.isLoggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
});
app1.use("/host", hostRouter);

// Home
app1.get("/", (req, res) => {
  res.render("home", {
    pageTitle: "Home Page",
    registeredHomes,
  });
});

// ❌ REMOVED BAD LOGOUT MIDDLEWARE

// 404 Page
app1.use(errorController.pageNotFound);

// Server
const PORT = 3012;

mongoose.connect(DB_PATH)
  .then(() => {
    console.log('Connected to Mongo');
    app1.listen(PORT, () => {
      console.log(`Server running on address http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.log('Error while connecting to Mongo: ', err);
  });
