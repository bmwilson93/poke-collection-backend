const express = require("express"),
      router = express.Router();

const { addCard, removeCard } = require('../database/collection.js');

// Check if user is logged in first
router.use('api/collection', (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.status(401).send();
  }
})

router.post('api/collection/add', (req, res) => {
 addCard(req.body, req.user.collection);
})

router.post('api/collection/remove', (req, res) => {
  removeCard(req.body, req.user.collection);
})

module.exports = router;