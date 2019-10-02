const express = require('express');
const router = express.Router();
const { Comment, validateComment } = require('../models/comment');
const Customer = require('../models/customer');
const { Restaurant } = require('../models/restaurant');

router.get('/', (req, res) => {
  res.send('Comments route is under construction');
});

router.post('/', async (req, res) => {
  const error = validateComment(req.body);
  // if(error) return res.status(400).send(error.details[0].message);
  const restaurant = await Restaurant.findById(req.body.restaurantId);
  const customer = await Customer.findById(req.body.customerId);
  const comment = new Comment({
    text: req.body.text,
    author: {
      _id: customer._id,
      username: customer.username,
      role: customer.role
    },
    recipient: {
      _id: restaurant_id,
      name: restaurant.name,
      city: restaurant.address.city
    },
    role: restaurant.role
  });
  await comment.save()
  res.send(comment)
})

module.exports = router;