const _ = require('lodash');
const bcrypt = require('bcrypt');
const { Restaurant, validateRestaurant, validateId, validatePassword } = require('../models/restaurant');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const restaurants = await Restaurant.find();
  res.send(restaurants);
});

router.get('/:id', async (req, res) => {
  //check if id is valid
  if(!validateId(req.params.id)) return res.status(400).send(`${req.params.id} is not a valid id!`);
  //search for the restaurant by id
  const restaurant = await Restaurant.findById(req.params.id, "-password");
  if(!restaurant) return res.status(400).send(`No restaurant with this id: ${req.params.id}`);
  res.send(restaurant);
});

router.post('/', async (req, res) => {
  //check if password exist in the body of the request
  if(!req.body.password) res.status(400).send('"Password" is required!');
  //search for errors in the body of the request
  const error = validateRestaurant(req.body);
  if(error) return res.status(400).send(error.details[0].message);
  // check if the email is available
  const exist = await Restaurant.findOne({email: req.body.email});
  if(exist) return res.status(400).send(`"${exist.email}" already in use!`);
  //encrypt password
  const hash = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, hash);
  //save the new restaurant user
  req.body.password = hashPassword;
  let restaurant = new Restaurant(req.body);
  restaurant = await restaurant.save();
  //send response
  res.send(_.pick(restaurant, ['_id', 'name', 'email', 'role']));
});

router.put('/:id', async (req, res) => {
  //check if id is valid
  if(!validateId(req.params.id)) return res.status(400).send(`${req.params.id} is not a valid id!`);
  //search for errors in the body of the request
  const error = validateRestaurant(req.body);
  //prevent password to be change
  if(req.body.password) return res.status(400).send('"Passowrd" is not allowed!')
  if(error) return res.status(400).send(error.details[0].message);
  //update the requested restaurant
  const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {new: true});
  if(!restaurant)return res.status(400).send(`No restaurant with this id: ${req.params.id}`);
  res.send(restaurant);
});

router.put('/:id/change-password', async (req, res) => {
  //check if id is valid
  if(!validateId(req.params.id)) return res.status(400).send(`${req.params.id} is not a valid id!`);
  //vaidate password 
  const error = validatePassword(req.body);
  if(error) res.status(400).send(error.details[0].message);
  const restaurant = await Restaurant.findById(req.params.id);
  if(!restaurant) return res.status(400).send(`No restaurant with this id: ${req.params.id}`);
  if(await bcrypt.compare(req.body.password, restaurant.password)) return res.status(400).send('Can not set the same password');
  const hash = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, hash);
  await Restaurant.findByIdAndUpdate(req.params.id, {$set: {password: hashPassword}});
  res.send(`Password changed for "${restaurant.name}" user.`)
});

router.delete('/:id', async (req, res) => {
  //check if id is valid
  if(!validateId(req.params.id)) return res.status(400).send(`${req.params.id} is not a valid id!`);
  const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
  if(!restaurant) return res.status(400).send(`No restaurant with this id: ${req.params.id}`);
  res.send(`The "${restaurant.name}" user was successfully removed from DB`)
})

module.exports = router;