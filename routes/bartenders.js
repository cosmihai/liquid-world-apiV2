const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Bartenders route is under construction');
});

module.exports = router;