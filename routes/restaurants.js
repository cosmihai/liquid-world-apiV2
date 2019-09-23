const _ = require('lodash');
const bcrypt = require('bcrypt');
const { Restaurant, validateRestaurant, validateId } = require('../models/restaurant');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const restaurants = await Restaurant.find();
  res.send(restaurants);
});

router.post('/', async (req, res) => {
  //search for errors in the body of the request
  const error = validateRestaurant(req.body, 'post');
  if(error) return res.status(400).send(error.details[0].message);
  // check if the email is available
  const exist = await Restaurant.findOne({email: req.body.email});
  if(exist) return res.status(400).send(`${exist.email} already in use!`);
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

router.get('/:id', async (req, res) => {
  //check if id is valid
  if(!validateId(req.params.id)) return res.status(400).send(`${req.params.id} is not a valid id!`);
  //search for the restaurant by id
  const restaurant = await Restaurant.findById(req.params.id, "-password");
  if(!restaurant) return res.status(400).send(`No restaurant with this id: ${req.params.id}`);
  res.send(restaurant);
});

router.put('/:id', async (req, res) => {
  //check if id is valid
  if(!validateId(req.params.id)) return res.status(400).send(`${req.params.id} is not a valid id!`);
  //search for errors in the body of the request
  const error = validateRestaurant(req.body, 'put');
  if(error) return res.status(400).send(error.details[0].message);
  //update the requested restaurant
  const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {new: true});
  if(!restaurant)return res.status(400).send(`No restaurant with this id: ${req.params.id}`);
  res.send(restaurant);
});

router.put('/:id/change-password', async (req, res) => {
  //check if id is valid
  if(!validateId(req.params.id)) return res.status(400).send(`${req.params.id} is not a valid id!`);
  //falta validar password
  const restaurant = await Restaurant.findById(req.params.id);
  if(!restaurant) return res.status(400).send(`No restaurant with this id: ${req.params.id}`);
  if(await bcrypt.compare(req.body.password, restaurant.password)) return res.status(400).send('Can not set the same password');
  const hash = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, hash);
  await Restaurant.findByIdAndUpdate(req.params.id, {$set: {password: hashPassword}});
  res.send(`Password changed for "${restaurant.name}" user.`)
});

module.exports = router;