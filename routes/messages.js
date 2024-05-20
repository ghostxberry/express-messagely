const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config"); 
const { authenticateJWT, ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth')


/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', authenticateJWT, ensureLoggedIn, ensureCorrectUser,  async (req, res, next) => {
    try {
        const { id } = req.params;
        const message = await Message.get(id)

         if (message.from_user !== req.user.username && message.to_user !== req.user.username) {
            throw new ExpressError("Unauthorized", 401);
        
    }  return res.json(message);
} catch(e) {
        next(e)
    }
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/:username', authenticateJWT, ensureLoggedIn, async (req, res, next) => {
    try {
        const {from_username, to_username, body} = req.body;

        if (!from_username || !to_username || !body) {
            throw new ExpressError("Missing required fields", 400);
        }

        const newMessage = await Message.create( {from_username, to_username, body });

        return res.status(201).json({ message: newMessage });
    }
    catch(e){
        next(e)
    }
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id', authenticateJWT, ensureCorrectUser, async (req, res, next) => {
    try { 
        const { id } = req.params;
        const readMessage = await Message.markRead(id);

        return res.json({ message: readMessage });
    }
    catch(e) {

    }
})

module.exports = router; 