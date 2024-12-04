const express = require("express"),
      router = express.Router();


router.post('api/collection/add', (req, res) => {
 addCard(req.body, req.user.collection);
})

router.post('api/collection/remove', (req, res) => {
  removeCard(req.body, req.user.collection);
})

module.exports = router;