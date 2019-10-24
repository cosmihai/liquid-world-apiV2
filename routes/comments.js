const auth = require('../middlewares/auth');
const Fawn = require('fawn');
const mongoose = require('mongoose');
const { Restaurant } = require('../models/restaurant');
const { Customer } = require('../models/customer');
const { Comment, validateComment, validateId } = require('../models/comment');
const express = require('express');
const router = express.Router();

// Fawn.init(mongoose);

router.get('/', async (req, res) => {
  const comments = await Comment.find();
  res.send(comments);
});

router.get('/:id', async (req, res) => {
  if(!validateId(req.params.id)) return res.status(400).send(`The id ${req.params.id} is not valid`);
  const comment = await Comment.findById(req.params.id);
  if(!comment) return res.status(400).send(`No comment with this id ${req.params.id}`);
  res.send(comment);
});

router.post('/', auth, async (req, res) => {
  //check authorization
  if(req.user.role != 'customer') return res.status(401).send(`Only customers can add comments`);
  //set the customer id
  req.body.customerId = req.user._id
  //validate the body of the request
  const error = validateComment(req.body);
  if(error) return res.status(400).send(error.details[0].message);
  //check if restaurant or customer with the specified id
  const restaurant = await Restaurant.findById(req.body.restaurantId);
  if(!restaurant) return res.status(400).send('No restaurant found with this id!');
  const customer = await Customer.findById(req.body.customerId);
  if(!customer) return res.status(400).send('No customer found with this id!');
  //create the new comment and save it
  const comment = new Comment({
    text: req.body.text,
    author: {
      _id: customer._id,
      username: customer.username,
      role: customer.role
    },
    recipient: {
      _id: restaurant._id,
      name: restaurant.name,
      city: restaurant.address.city,
      role: restaurant.role
    },
  });
  // save the comment and add it to the restaurant list of comments
  try {
    new Fawn.Task()
    .save('comments', comment)
    .update('restaurants', { _id: restaurant._id }, {
      $push: { comments: comment._id }
    })
    .run()
    res.send(comment);
  }
  catch(ex) {
    res.status(500).send('Exception: \n' + ex);
  }
});

router.put('/:id', auth, async (req, res) => {
  //check if id is valid
  if(!validateId) return res.status(400).send(`The id ${req.params.id} is not valid`);
  //get the comment
  let comment = await Comment.findById(req.params.id);
  if(!comment) return res.status(400).send('No comment with this id');
  //check the owner and authorize the change
  if(req.user._id != comment.author._id) res.status(401).send('Unauthorized');
  //set the customer and restaurant id
  req.body.customerId = comment.author._id.toString();
  req.body.restaurantId = comment.recipient._id.toString();
  //validate the body of the request
  const error = validateComment(req.body);
  if(error) return res.status(400).send(error.details[0].message);
  //update the comment
  comment.text = req.body.text;
  await comment.save();
  res.send(comment);
});

router.delete('/:id', auth, async (req, res) => {
  //check if id is valid
  if(!validateId(req.params.id)) return res.status(400).send(`The id ${req.params.id} is not valid`);
  //get the comment
  const comment = await Comment.findById(req.params.id);
  if(!comment) return res.status(400).send(`No comment with this id ${req.params.id}`);
  //check the owner and authorize the remove
  if(req.user._id != comment.author._id) return res.status(401).send('Unauthorized')
  // remove the comment from the DB and from the restaurant's list of comments
  try {
    new Fawn.Task()
    .remove('comments', { _id: comment._id })
    .update('restaurants', { _id: comment.recipient._id }, {
      $pull: { comments: comment._id }
    })
    .run()
    res.send(comment);
  }
  catch(ex){
    res.status(500).send('Exception: \n' + ex);
  }
});

module.exports = router;