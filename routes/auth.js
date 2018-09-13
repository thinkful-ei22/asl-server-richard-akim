const passport = require("passport");
const express = require("express");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRY } = require("../config");

const router = express.Router();

const options = { session: false, failWithError: true };

const localAuth = passport.authenticate("local", options);


function createAuthToken(user) {
  const {name, username, id} = user;

  return jwt.sign({ user: {name, username, id}}, JWT_SECRET, {
    subject: username,
    expiresIn: JWT_EXPIRY,
    algorithm: "HS256"
  });
}

router.post("/login", localAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

const jwtAuth = passport.authenticate("jwt", { session: false });

// The user exchanges a valid JWT for a new one with a later expiration
router.post("/refresh", jwtAuth, (req, res) => {
  const authToken = createAuthToken(req.user);
  res.json({ authToken });
});

module.exports = router;
