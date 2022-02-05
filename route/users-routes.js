const express = require("express");
const { check } = require("express-validator");

const usersController = require("../controllers/users-controllers");

const router = express.Router();

router.get("/", usersController.getUserList);

router.post(
  "/signup",
  [
    check("name").not().isEmpty(),
    check("password").isLength({ min: 8 }),
    check("email").isEmail().normalizeEmail(),
  ],
  usersController.signup
);

router.post(
  "/login",
  [
    check("password").isLength({ min: 8 }),
    check("email").isEmail().normalizeEmail(),
  ],
  usersController.login
);

module.exports = router;
