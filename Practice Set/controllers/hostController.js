const Home = require("../models/home");
const fs = require("fs");

exports.getAddHome = (req, res, next) => {
  res.render("host/edit-home", {
    pageTitle: "Add Home to Airbnb",
    editing: false,
    home: {},
    isLoggedIn: req.isLoggedIn,
  });
};

exports.getEditHome = (req, res, next) => {
  const homeId = req.params.homeId;
  Home.findById(homeId).then(home => {
    if (!home) {
      return res.redirect("/host/host-home-list");
    }
    res.render("host/edit-home", {
      pageTitle: "Edit Your Home",
      editing: true,
      home: home,
      isLoggedIn: req.isLoggedIn,
    });
  });
};

exports.getHostHomes = (req, res, next) => {
  Home.find().then(registeredHomes => {
    res.render("host/host-home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "Host Home List",
      isLoggedIn: req.isLoggedIn,
    });
  });
};

exports.postAddHome = (req, res, next) => {
  const { houseName, location, price, rating, description } = req.body;
  console.log(houseName, location, price, rating, description);
  console.log(req.files);

  if(!req.files || req.files.length === 0) {
    return res.status(422).send("No image provided");
  }

  // Save only filenames (not full paths) to keep DB OS-agnostic
  const photos = req.files.map(f => f.filename);

  const newHome = new Home({
    houseName,
    location,
    price,
    rating,
    photo: photos,
    description,
  });
  console.log(newHome);
  newHome.save().then(() => { //Here we have used the promise
    console.log('Home Saved Successfully');
  });
  res.redirect("/host/host-home-list");
};

exports.postEditHome = (req, res, next) => {
  const { id, houseName, location, price, rating, description } = req.body;

  Home.findById(id).then((home) => {
    home.houseName = houseName;
    home.location = location;
    home.price = price;
    home.rating = rating;
    home.description = description;

    // If new files were uploaded, replace photo array with new filenames
    if(req.files && req.files.length > 0) {
      fs.unlink(home.photo, (err) => {
        if(err) {
          console.log("Error while deleting file ", err);
        }
      });
      home.photo = req.files.map(f => f.filename);
    }

     home.save().then(result => {
    console.log('Home updated', result);
  }).catch(err => {
    console.log('Error while Updating ', err);
  })
  res.redirect("/host/host-home-list");
  }).catch(err => {
    console.log('Error while finding Home ', err);
  });
};

exports.postDeleteHome = (req, res, next) => {
  const homeId = req.params.homeId;
  console.log('Came to delete: ', homeId);
  Home.findByIdAndDelete(homeId)
  .then(() => {
    res.redirect("/host/host-home-list");
  }).catch(error => {
    console.log('Error while deleting ', error);
  })
};