const { Restaurant, validateRestaurant } = require('../models/restaurant');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const restaurants = await Restaurant.find();
  res.send(restaurants);
});

router.post('/', async (req, res) => {
  const error = validateRestaurant(req.body);
  if(error) return res.status(400).send(error.details[0].message);
  let restaurant = new Restaurant(req.body);
  restaurant = await restaurant.save();
  res.send(restaurant);
})

module.exports = router;