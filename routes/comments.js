const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Comments route is under construction');
});

module.exports = router;