// Core Module
const path = require('path');

// External Module
const express = require('express'); //We have import the express

//Local Module
const userRouter = require("./routes/userRouter")
const {hostRouter} = require("./routes/hostRouter") //Here we have done the Destructuring
const rootDir = require("./utils/pathUtil");

const app = express();

app.get("/", (req, res) => {
  res.render("home", {
    pageTitle: "Home Page",
    registeredHomes: [] // Prevents ReferenceError in EJS
  });
});

//Here we have use packa
app.set('view engine', 'ejs');
app.set('views','views');

app.use(express.urlencoded());
app.use(userRouter);
app.use("/host", hostRouter);

app.use(express.static(path.join(rootDir, 'public')))

app.use((req, res, next) => {
  res.status(404).render('404', {pageTitle: 'Page Not Found'});
})

const PORT = 3008;
app.listen(PORT, () => {
  console.log(`Server running on address http://localhost:${PORT}`);
});