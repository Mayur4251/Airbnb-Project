const express = require('express');
const hostRouter = express.Router();

const homesController = require("../controllers/homes")

// GET: Show form
hostRouter.get('/add-home', homesController.getAddHome);

const registeredHomes = []; // Shared array for all homes

// POST: Handle form submission
hostRouter.post('/add-home', (req, res) => {
  const { houseName, location, rating, price, photoUrl } = req.body;

  const newHome = { houseName, location, rating, price, photoUrl };
  registeredHomes.push(newHome);

  console.log("New Home Added:", newHome);
  console.log("All Registered Homes:", registeredHomes);

  // ✅ Render confirmation page
  res.render('homeAdded', { pageTitle: 'Home Added Successfully' });
});

// Export router and shared array
exports.hostRouter = hostRouter;
exports.registeredHomes = registeredHomes;