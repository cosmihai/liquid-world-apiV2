const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Customers route is under construction');
});

module.exports = router;