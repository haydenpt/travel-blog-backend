const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const placesRoutes = require("./route/places-routes");
const usersRoutes = require("./route/users-routes");
const HttpError = require("./models/http-error");
// const usersRoutes = require("./route/users-routes");

const app = express();

app.use(bodyParser.json());

// NO CORS ERROR ON BROWSER
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  next();
});

// add placesRoutes as middleware
// only reach when request is from /api/places
// ROUTES FOR PLACES
app.use("/api/places", placesRoutes);

// ROUTES FOR USERS
app.use("/api/users", usersRoutes);

// Handling unsupportedf routes
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  throw error;
});

// Error handler; Execute if any middleware in front of it yields an error
app.use((error, req, res, next) => {
  // if placesRoutes pass 4 params, then get to this special function
  // error handling middleware
  if (res.headerSent) {
    // check if response was sent
    console(res.headerSent);
    return next(error);
  }
  res.status(error.code || 500); // error code or 500 sth went wrong code
  res.json({ message: error.message || "An unknown error occurred!" });
});

mongoose
  .connect(
    "mongodb+srv://hayden-admin:BearEctor@cluster0.2miet.mongodb.net/mern?retryWrites=true&w=majority"
  )
  .then(() => {
    app.listen(5000);
  })
  .catch((error) => {
    console.log(error);
  });
