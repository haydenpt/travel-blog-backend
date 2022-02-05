const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");


// GET PLACE BY  PLACE ID---------------------------------------------------------

const getPlaceById = async (req, res, next) => {
  // the path comes after the path we put in app.js
  const placeId = req.params.pid; // extract :pid from URL to key-value pair obj { pid: 'p1' }

  let place;

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(new HttpError("Could not find a place", 500));
  }

  if (!place) {
    // when there's no place found
    return next(
      new HttpError("Could not find a place for the provided place id.", 404)
    );
  }

  res.json({ place: place.toObject({ getters: true }) }); // convert mongoose object to JS object, getters get rid of _ before id
};

// GET PLACE BY USER ID---------------------------------------------------------

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let userPlaces;

  try {
    userPlaces = await Place.find({ creator: userId });
  } catch (err) {
    return next(new HttpError("Fetching place failed.", 500));
  }

  if (!userPlaces || userPlaces.length === 0) {
    // when there's no place found
    return next(
      new HttpError("Could not find a place for the provided user id.", 404)
    );
  }

  res.json({
    userPlaces: userPlaces.map((place) => place.toObject({ getters: true })),
  }); // find() return an array so we can't use toObject() directly on userPlaces
};

// CREATE A PLACE---------------------------------------------------------

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Please check your inputs again.", 422));
  }

  const { title, description, address, creator } = req.body;
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image:
      "https://media.wired.com/photos/593243ab9be5e55af6c23d82/master/pass/Screen-Shot-2015-06-15-at-2.09.54-PM.png",
    creator,
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    return new HttpError("Creating place failed", 500);
  }

  if (!user) {
    return new HttpError(
      "Could not find user for the provided ID. Failed to create place",
      500
    );
  }

  try {
    // session to create a new place in the database and ensure referential integrity
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();

  } catch (err) {
    const error = new HttpError("Failed to create place", 500);
    return next(error);
  }
  res.status(201).json({ place: createdPlace }); // normal standard success status code
  //res.json(createdPlace);
};

// UPDATE PLACE BY ID---------------------------------------------------------

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Please check your inputs again.", 422));
  }

  const { title, description } = req.body; // Only allow updates to title and description
  const placeId = req.params.pid;

  // Find the place by id
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    return next(new HttpError("Could not find a place", 500));
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    return next(
      new HttpError("Something went wrong. Could not update place.", 500)
    );
  }

  res.status(200).json({ place: place.toObject({ getters: true }) }); // 200 is successful with no new obj
};

// DELETE A PLACE BY ID---------------------------------------------------------

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator"); // populate tells what property in Place we want to work with. Here it's creator
  } catch (err) {
    return next(
      new HttpError("Something went wrong. Could not delete place. #1", 500)
    );
  }

  if (!place) {
    return new HttpError("Could not find place with the provided id", 404);
  }

  try {
    const ses = await mongoose.startSession();
    ses.startTransaction();
    await place.remove({ session: ses });
    place.creator.places.pull(place);
    await place.creator.save({ session: ses });
    await ses.commitTransaction();
  } catch (err) {
    return new HttpError(
      "Something went wrong. Could not delete place. #2",
      500
    );
  }

  res.status(200).json({ message: "Place deleted successfully!" });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
