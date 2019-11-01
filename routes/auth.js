const { Bartender } = require('../models/bartender');
const { Customer } = require('../models/customer');
const { Restaurant } = require('../models/restaurant');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();

router.post('/restaurants/login', async (req, res) => {
  //validate the body of the request
  const error = validateInput(req.body);
  if(error) return res.status(400).send(error.details[0].message) ;
  //check for the restaurant user with the given email
  const restaurant = await Restaurant.findOne({email: req.body.email});
  if(!restaurant) return res.status(400).send('Password or email incorrect!');
  //check if password match
  const matchPassword = await bcrypt.compare(req.body.password, restaurant.password);
  if(!matchPassword) return res.status(400).send('Password or email incorrect!');
  //generate token and send the response
  const token = restaurant.generateToken();
  res.send(token);
});

router.post('/customers/login', async (req, res) => {
  //validate the body of the request
  const error = validateInput(req.body);
  if(error) return res.status(400).send(error.details[0].message) ;
  //check for the customer user with the given email
  const customer = await Customer.findOne({email: req.body.email});
  if(!customer) return res.status(400).send('Password or email incorrect!');
  //check if password match
  const matchPassword = await bcrypt.compare(req.body.password, customer.password);
  if(!matchPassword) return res.status(400).send('Password or email incorrect!');
  //generate token and send the response
  const token = customer.generateToken();
  res.send(token);
});

router.post('/bartenders/login', async (req, res) => {
  //validate the body of the request
  const error = validateInput(req.body);
  if(error) return res.status(400).send(error.details[0].message) ;
  //check for the bartender user with the given email
  const bartender = await Bartender.findOne({email: req.body.email});
  if(!bartender) return res.status(400).send('Password or email incorrect!');
  //check if password match
  const matchPassword = await bcrypt.compare(req.body.password, bartender.password);
  if(!matchPassword) return res.status(400).send('Password or email incorrect!');
  //generate token and send the response
  const token = bartender.generateToken();
  res.send(token);
});

function validateInput(req) {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });
  const { error } = Joi.validate(req, schema);
  return error
}

module.exports = router;