const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const db = require("../db");
const User = require("../models/user")
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config")
const { authenticateJWT, ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");

router.get('/', (req, res, next) => {
  res.send("APP IS WORKING LOL")
})

router.post('/register', async (req, res, next) => {
try {
  const {username, password, first_name, last_name, phone} = req.body;

  const newUser = await User.register({username, password, first_name, last_name, phone});
  res.json({message: "User registered succesfully", user: newUser});
} catch (e) {
  next(e);
    }
});

router.post('/login', async (req, res, next) => {
   try {
    const { username, password } = req.body;

    const authenticated = await User.authenticate(username, password);

    if (authenticated) {
      await User.updateLoginTimestamp(username);
      const token = jwt.sign({ username }, SECRET_KEY )
      return res.json({ message: "Login succesful", token });
    } else {
      throw new ExpressError("Invalid username or password", 401);
    }

   }
   catch(e) {
    next(e)
   }
})



module.exports = router; 