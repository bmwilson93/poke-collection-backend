const express = require("express"),
      router = express.Router();

const { addCard, removeCard } = require('../database/collection.js');

// Check if user is logged in first
router.use('/', (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.status(401).json({error: "Unauthorized. Please log in."});
  }
})

router.post('/add', async (req, res) => {
    req.user.collection = await addCard(req.body, req.user.collection, req.session.passport.user.id);
    res.json({user: req.user});
})

router.post('/remove', async (req, res) => {
  req.user.collection = await removeCard(req.body, req.user.collection, req.session.passport.user.id);
  res.json({user: req.user});
})

module.exports = router;