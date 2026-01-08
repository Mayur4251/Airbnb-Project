const Home = require("../models/home");
const cloudinary = require("../utils/cloudinary");

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

    if (!home) return res.redirect("/host/host-home-list");

    if (
      req.session.user &&
      home.hostId.toString() !== req.session.user._id.toString()
    ) {
      return res.status(403).render("error", {
        message: "You are not authorized to edit this home",
        isLoggedIn: req.isLoggedIn,
      });
    }

    res.render("host/edit-home", {
      pageTitle: "Edit Your Home",
      editing: true,
      home,
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
    const hostId = req.session.user._id;
    const registeredHomes = await Home.find({ hostId });

    res.render("host/host-home-list", {
      registeredHomes,
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
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect("/login");
    }

    const {
      houseName,
      location,
      price,
      description,
      propertyType,
      bedrooms,
      bathrooms,
      maxGuests,
      amenities,
    } = req.body;

    if (!houseName || !location || !price) {
      return res.status(422).render("error", {
        message: "House name, location, and price are required",
        isLoggedIn: req.isLoggedIn,
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(422).render("error", {
        message: "At least one image is required",
        isLoggedIn: req.isLoggedIn,
      });
    }

    // ✅ Cloudinary URLs
    const photos = req.files.map((f) => f.path);

    const amenitiesArray = Array.isArray(amenities)
      ? amenities
      : amenities
      ? [amenities]
      : [];

    const newHome = new Home({
      houseName,
      location,
      price: parseFloat(price),
      rating: 0,
      photo: photos,
      description: description || "",
      propertyType: propertyType || "house",
      bedrooms: parseInt(bedrooms) || 1,
      bathrooms: parseInt(bathrooms) || 1,
      maxGuests: parseInt(maxGuests) || 2,
      amenities: amenitiesArray,
      hostId: req.session.user._id,
      hostName: `${req.session.user.firstName} ${req.session.user.lastName}`,
    });

    await newHome.save();
    console.log("Home Saved Successfully");
    res.redirect("/host/host-home-list");
  } catch (err) {
    console.error("Error adding home:", err);
    next(err);
  }
};

/* ---------------- POST EDIT HOME ---------------- */
exports.postEditHome = async (req, res, next) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect("/login");
    }

    const {
      id,
      houseName,
      location,
      price,
      description,
      propertyType,
      bedrooms,
      bathrooms,
      maxGuests,
      amenities,
    } = req.body;

    const home = await Home.findById(id);
    if (!home) return res.redirect("/host/host-home-list");

    if (home.hostId.toString() !== req.session.user._id.toString()) {
      return res.status(403).render("error", {
        message: "You are not authorized to edit this home",
        isLoggedIn: req.isLoggedIn,
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

    if (amenities) {
      home.amenities = Array.isArray(amenities) ? amenities : [amenities];
    }

    // ✅ If new images uploaded → replace & delete old from Cloudinary
    if (req.files && req.files.length > 0) {
      const oldPhotos = [...home.photo]; // old Cloudinary URLs
      home.photo = req.files.map((f) => f.path);

      await home.save();

      // delete old images from Cloudinary
      for (let imgUrl of oldPhotos) {
        const publicId = imgUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`elite-dwell/${publicId}`);
      }

      console.log("Home updated with new photos");
    } else {
      await home.save();
      console.log("Home updated");
    }

    res.redirect("/host/host-home-list");
  } catch (err) {
    console.error("Error while updating home:", err);
    next(err);
  }
};

/* ---------------- POST DELETE HOME ---------------- */
exports.postDeleteHome = async (req, res, next) => {
  try {
    if (!req.session.isLoggedIn || !req.session.user) {
      return res.redirect("/login");
    }

    const homeId = req.params.homeId;
    const home = await Home.findById(homeId);
    if (!home) return res.redirect("/host/host-home-list");

    if (home.hostId.toString() !== req.session.user._id.toString()) {
      return res.status(403).render("error", {
        message: "You are not authorized to delete this home",
        isLoggedIn: req.isLoggedIn,
      });
    }

    // ✅ Delete images from Cloudinary
    if (home.photo && home.photo.length > 0) {
      for (let imgUrl of home.photo) {
        const publicId = imgUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`elite-dwell/${publicId}`);
      }
    }

    await Home.findByIdAndDelete(homeId);
    console.log("Home deleted successfully");

    res.redirect("/host/host-home-list");
  } catch (err) {
    console.error("Error while deleting home:", err);
    next(err);
  }
};
