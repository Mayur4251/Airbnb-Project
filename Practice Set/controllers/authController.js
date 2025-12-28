const { check, validationResult } = require("express-validator");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

/* ---------------- GET LOGIN ---------------- */
exports.getLogin = (req, res) => {
  res.render("auth/login", {
    pageTitle: "Login",
    currentPage: "login",
    isLoggedIn: false,
    errors: [],
    oldInput: {email: ""}
  });
};

/* ---------------- GET SIGNUP ---------------- */
exports.getSignUp = (req, res) => {
  res.render("auth/signup", {
    pageTitle: "Signup",
    currentPage: "signup",
    isLoggedIn: false,
    errors: [],
    oldInput: { firstName: "", lastName: "", email: "", userType: "" }
  });
};

/* ---------------- POST SIGNUP ---------------- */
exports.postSignUp = [

  // ✅ VALIDATIONS
  check("firstName")
    .notEmpty().withMessage("First Name is required")
    .trim()
    .isLength({ min: 2 }).withMessage("First Name must be at least 2 characters")
    .matches(/^[a-zA-Z\s]+$/).withMessage("First Name can only contain letters"),

  check("lastName")
    .matches(/^[a-zA-Z\s]*$/)
    .withMessage("Last Name can only contain letters"),

  check("email")
    .isEmail().withMessage("Please enter a valid email")
    .normalizeEmail(),

  check("password")
    .isLength({ min: 5 }).withMessage("Password must be at least 5 characters")
    .matches(/[a-z]/).withMessage("Password must contain a lowercase letter")
    .matches(/[A-Z]/).withMessage("Password must contain an uppercase letter")
    .matches(/[0-9]/).withMessage("Password must contain a number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain a special character"),

  check("confirmPassword")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  check("userType")
    .notEmpty().withMessage("User type is required")
    .isIn(["guest", "host"]).withMessage("Invalid user type"),

  check("terms")
    .equals("on")
    .withMessage("Please accept the terms and conditions"),

  // ✅ FINAL HANDLER
  async (req, res) => {
    const { firstName, lastName, email, password, userType } = req.body;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).render("auth/signup", {
        pageTitle: "Signup",
        currentPage: "signup",
        isLoggedIn: false,
        errors: errors.array(),
        oldInput: { firstName, lastName, email, userType }
      });
    }

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(422).render("auth/signup", {
          pageTitle: "Signup",
          currentPage: "signup",
          isLoggedIn: false,
          errors: [{ msg: "Email already registered" }],
          oldInput: { firstName, lastName, email, userType }
        });
      }

      //When the user sign up the page and putting the password it is not going to dispaly us in the database what the password the user has put and in the database it will show in the hased form
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        userType
      });

      await user.save();
      console.log("User signed up:", email);
      res.redirect("/login");

    } catch (err) {
      console.error(err);
      res.status(500).render("auth/signup", {
        pageTitle: "Signup",
        currentPage: "signup",
        isLoggedIn: false,
        errors: [{ msg: "Something went wrong. Please try again." }],
        oldInput: { firstName, lastName, email, userType }
      });
    }
  }
];

/* ---------------- POST LOGIN ---------------- */
exports.postLogin = async (req, res, next) => {
  const { userName, password } = req.body;
  console.log('POST /login called with:', { userName });

  try {
    const user = await User.findOne({ email: userName }); //Here we are checking the Email of user during login
    console.log('postLogin: user lookup result:', !!user);

    if (!user) { //If the user is not match it will show error and redirect to login page only
      return res.status(422).render("auth/login", {
        pageTitle: "Login",
        currentPage: "login",
        isLoggedIn: false,
        errors: [{ msg: "Email not found" }],
        oldInput: { userName }
      });
    }

    //Here we are checking the password which is enter by the user during login
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {  //If the user is not match it will show error and redirect to login page only
      return res.status(422).render("auth/login", {
        pageTitle: "Login",
        currentPage: "login",
        isLoggedIn: false,
        errors: [{ msg: "Invalid password" }],
        oldInput: { userName }
      });
    }

    console.log('postLogin: setting session for user:', user.email);
    req.session.isLoggedIn = true;
    req.session.userId = user._id.toString();
    req.session.user = {
      _id: user._id.toString(), // Convert ObjectId to string to avoid BSON serialization errors
      email: user.email,
      userType: user.userType,
      firstName: user.firstName,
      lastName: user.lastName
    };
    req.session.userEmail = user.email;
    req.session.userType = user.userType;
    req.session.userName = `${user.firstName} ${user.lastName}`;

    req.session.save(() => {
      console.log('postLogin: session after save:', req.session);
      res.redirect("/");
    });

  } catch (err) {
    next(err);
  }
};

/* ---------------- POST LOGOUT ---------------- */
exports.postLogout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
};
