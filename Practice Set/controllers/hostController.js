const Home = require("../models/home");
const fs = require("fs");
const path = require("path");

/* ---------------- GET ADD HOME FORM ---------------- */
exports.getAddHome = (req, res, next) => {
  res.render("host/edit-home", {
    pageTitle: "Add Home to Elitedwell",
    editing: false,
    home: {},
    isLoggedIn: req.isLoggedIn,
  });
};

/* ---------------- GET EDIT HOME FORM ---------------- */
exports.getEditHome = async (req, res, next) => {
  try {
    const homeId = req.params.homeId;
    const home = await Home.findById(homeId);
    
    if (!home) {
      return res.redirect("/host/host-home-list");
    }
    
    // ADDED: Check if the logged-in user is the host of this home
    if (req.session.user && home.hostId.toString() !== req.session.user._id.toString()) {
      return res.status(403).render("error", { 
        message: "You are not authorized to edit this home",
        isLoggedIn: req.isLoggedIn 
      });
    }
    
    res.render("host/edit-home", {
      pageTitle: "Edit Your Home",
      editing: true,
      home: home,
      isLoggedIn: req.isLoggedIn,
    });
  } catch (err) {
    console.error("Error fetching home for edit:", err);
    next(err);
  }
};

/* ---------------- GET HOST'S HOMES LIST ---------------- */
exports.getHostHomes = async (req, res, next) => {
  try {
    // FIXED: Filter homes by logged-in host instead of showing all homes
    const hostId = req.session.user._id;
    const registeredHomes = await Home.find({ hostId: hostId });
    
    res.render("host/host-home-list", {
      registeredHomes: registeredHomes,
      pageTitle: "Host Home List",
      isLoggedIn: req.isLoggedIn,
    });
  } catch (err) {
    console.error("Error fetching host homes:", err);
    next(err);
  }
};

/* ---------------- POST ADD HOME ---------------- */
exports.postAddHome = async (req, res, next) => {
  try {
    // ADDED: Check if user is logged in
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect("/login");
    }

    const { houseName, location, price, description, propertyType, bedrooms, bathrooms, maxGuests, amenities } = req.body;
    
    // ADDED: Input validation
    if (!houseName || !location || !price) {
      return res.status(422).render("error", {
        message: "House name, location, and price are required",
        isLoggedIn: req.isLoggedIn
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(422).render("error", {
        message: "At least one image is required",
        isLoggedIn: req.isLoggedIn
      });
    }

    // Save only filenames (not full paths) to keep DB OS-agnostic
    const photos = req.files.map(f => f.filename);
    
    // Parse amenities array
    const amenitiesArray = Array.isArray(amenities) ? amenities : (amenities ? [amenities] : []);

    const newHome = new Home({
      houseName,
      location,
      price: parseFloat(price),
      rating: 0,
      photo: photos,
      description: description || '',
      propertyType: propertyType || 'house',
      bedrooms: parseInt(bedrooms) || 1,
      bathrooms: parseInt(bathrooms) || 1,
      maxGuests: parseInt(maxGuests) || 2,
      amenities: amenitiesArray,
      hostId: req.session.user._id,
      hostName: `${req.session.user.firstName} ${req.session.user.lastName}`
    });
    
    await newHome.save();
    console.log('Home Saved Successfully');
    res.redirect("/host/host-home-list");
  } catch (err) {
    console.error("Error adding home:", err);
    
    // ADDED: Clean up uploaded files if database save fails
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const filePath = path.join(__dirname, '../uploads', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting file after failed save:", unlinkErr);
          });
        }
      });
    }
    
    next(err);
  }
};

/* ---------------- POST EDIT HOME ---------------- */
exports.postEditHome = async (req, res, next) => {
  try {
    // ADDED: Check if user is logged in
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect("/login");
    }

    const { id, houseName, location, price, description, propertyType, bedrooms, bathrooms, maxGuests, amenities } = req.body;

    const home = await Home.findById(id);
    if (!home) {
      return res.redirect("/host/host-home-list");
    }

    // ADDED: Authorization check - ensure the logged-in user is the host
    if (home.hostId.toString() !== req.session.user._id.toString()) {
      return res.status(403).render("error", { 
        message: "You are not authorized to edit this home",
        isLoggedIn: req.isLoggedIn 
      });
    }

    // ADDED: Input validation
    if (!houseName || !location || !price) {
      return res.status(422).render("error", {
        message: "House name, location, and price are required",
        isLoggedIn: req.isLoggedIn
      });
    }

    home.houseName = houseName;
    home.location = location;
    home.price = parseFloat(price);
    home.description = description || home.description;
    home.propertyType = propertyType || home.propertyType;
    home.bedrooms = parseInt(bedrooms) || home.bedrooms;
    home.bathrooms = parseInt(bathrooms) || home.bathrooms;
    home.maxGuests = parseInt(maxGuests) || home.maxGuests;
    
    // Parse amenities array
    if (amenities) {
      home.amenities = Array.isArray(amenities) ? amenities : [amenities];
    }

    // If new files were uploaded, replace photo array with new filenames
    if (req.files && req.files.length > 0) {
      // Store old photos for deletion
      const oldPhotos = [...home.photo];
      
      // Update with new photos
      home.photo = req.files.map(f => f.filename);
      
      // Save first, then delete old photos
      await home.save();
      
      // Delete old photos after successful save
      oldPhotos.forEach(photo => {
        // FIXED: Use proper path resolution
        const photoPath = path.join(__dirname, '../uploads', photo);
        if (fs.existsSync(photoPath)) {
          fs.unlink(photoPath, (err) => {
            if (err) console.error("Error while deleting old photo:", err);
          });
        }
      });
      
      console.log('Home updated with new photos');
    } else {
      await home.save();
      console.log('Home updated');
    }

    res.redirect("/host/host-home-list");
  } catch (err) {
    console.error('Error while updating home:', err);
    
    // ADDED: Clean up newly uploaded files if update fails
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        const filePath = path.join(__dirname, '../uploads', file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting file after failed update:", unlinkErr);
          });
        }
      });
    }
    
    next(err);
  }
};

/* ---------------- POST DELETE HOME ---------------- */
exports.postDeleteHome = async (req, res, next) => {
  try {
    // ADDED: Check if user is logged in
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect("/login");
    }

    const homeId = req.params.homeId;
    console.log('Attempting to delete home:', homeId);
    
    const home = await Home.findById(homeId);
    
    if (!home) {
      console.log('Home not found');
      return res.redirect("/host/host-home-list");
    }

    // ADDED: Authorization check - ensure the logged-in user is the host
    if (home.hostId.toString() !== req.session.user._id.toString()) {
      return res.status(403).render("error", { 
        message: "You are not authorized to delete this home",
        isLoggedIn: req.isLoggedIn 
      });
    }

    // ADDED: Delete associated photos before deleting the home
    if (home.photo && home.photo.length > 0) {
      home.photo.forEach(photo => {
        const photoPath = path.join(__dirname, '../uploads', photo);
        if (fs.existsSync(photoPath)) {
          fs.unlink(photoPath, (err) => {
            if (err) console.error("Error while deleting photo:", err);
            else console.log("Photo deleted:", photo);
          });
        }
      });
    }

    // Delete the home from database
    await Home.findByIdAndDelete(homeId);
    console.log('Home deleted successfully');
    
    res.redirect("/host/host-home-list");
  } catch (err) {
    console.error('Error while deleting home:', err);
    next(err);
  }
};