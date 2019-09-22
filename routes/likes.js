const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  res.send('Likes route is under construction');
});

module.exports = router;