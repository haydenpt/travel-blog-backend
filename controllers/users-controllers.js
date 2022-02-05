const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const User = require("../models/user");

// GET USER ------------------------------------------------------------------------------

const getUserList = async (req, res, next) => {
  let userList;
  try {
    userList = await User.find({}, "-password"); // get all except password property or can use 'email password' to get only email and password
  } catch (err) {
    return new HttpError("Something went wrong. Cannot get users. #1", 500);
  }

  // if (!userList || userList.length === 0) {
  //   return new HttpError("There is no user exists.", 500);
  // }

  res.json({
    userList: userList.map((user) => user.toObject({ getters: true })),
  });
};

// SIGNUP------------------------------------------------------------------------------

const signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Please check your inputs again. #1", 422));
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email }); // check if a user with this email already exists
  } catch (err) {
    return next(
      new HttpError("Something went wrong. Cannot create user. #1", 500)
    );
  }

  if (existingUser) {
    return next(new HttpError("User already exists.", 422));
  }

  const newUser = new User({
    name,
    email,
    password,
    image: "https://cg3.cgsociety.org/uploads/images/medium/admirhrnjica-commander-shepard-2-2c46b5b0-ecjs.jpg",
    places: [], // new user will have 0 places
  });

  try {
    await newUser.save();
  } catch (err) {
    return next(
      new HttpError("Something went wrong. Cannot create user. #2", 500)
    );
  }
  res.status(201).json({ user: newUser.toObject({ getters: true }) });
};

// LOGIN------------------------------------------------------------------------------
const login = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(new HttpError("Please check your inputs again. #2", 422));
  }

  const { email, password } = req.body;

  let foundUser;
  try {
    foundUser = await User.findOne({ email: email });
  } catch (err) {
    return next(
      new HttpError("Something went wrong. Cannot login user. #1", 500)
    );
  }

  if (!foundUser || foundUser.password != password) {
    return next(new HttpError("Incorrect username or password", 401));
  }
  res.status(200).json({ message: "Successfully log in", user: foundUser });
};

exports.getUserList = getUserList;
exports.signup = signup;
exports.login = login;
