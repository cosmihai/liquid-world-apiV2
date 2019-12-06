const validateId = require('../middlewares/validateId');
const auth = require('../middlewares/auth');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const { Bartender } = require('../models/bartender');
const { Restaurant } = require('../models/restaurant');
const { Customer, validateCustomer, validatePassword, validateImage } = require('../models/customer');
const express = require('express');
const router = express.Router();

//get all customers
router.get('/' ,async (req, res) => {
  const customers = await Customer.find({}, "-password");
  res.send(customers);
});

//get current customer
router.get('/me', auth, async (req, res) => {
  //set the 'me' user
  const id = req.user._id;
  //get the 'me' user
  const me = await Customer.findById(id, "-password");
  if(!me) return res.status(400).send({message: `Invalid token provided`});
  res.send(me);
});

//get one customer
router.get('/:id', validateId, async (req, res) => {
  //get the customer
  const customer = await Customer.findById(req.params.id, "-password");
  if(!customer) return res.status(404).send({message: `No customer with this id ${req.params.id}`});
  res.send(customer);  
});

//create customer
router.post('/', async (req, res) => {
  //search for errors in the body of the request
  const error = validateCustomer(req.body);
  if(error) return res.status(400).send(error.details[0]);
  //check if password exist in the body of the request
  if(!req.body.password) return res.status(400).send({message: '"Password" is required!'});
  // check if the email is available
  const exist = await Customer.findOne({email: req.body.email});
  if(exist) return res.status(400).send({message: `"${exist.email}" already in use!`});
  //encrypt password
  const hash = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, hash);
  //save the new customer user
  req.body.password = hashPassword;
  let customer = new Customer(req.body);
  customer = await customer.save();
  //send response
  res.send(_.pick(customer, ['_id', 'username', 'email', 'role']));  
});

//update customer
router.put('/me', auth, async (req, res) => {
  //set the 'me' user
  const id = req.user._id;
  //prevent password to be change
  if(req.body.password) return res.status(400).send({message: '"Password" is not allowed!'});
  //check for error in the body of the request
  const error = validateCustomer(req.body);
  if(error) return res.status(400).send(error.details[0]);
  //update the customer
  const me = await Customer.findByIdAndUpdate(id, req.body, {new: true});
  if(!me) return res.status(400).send(`Invalid token provided`);
  res.send(_.pick(me, ['_id', 'username', 'email']));
});

//update password
router.put('/me/change-password', auth, async (req, res) => {
  //set the 'me' user
  const id = req.user._id;
  //vaidate password 
  const error = validatePassword(req.body);
  if(error) return res.status(400).send(error.details[0]);
  //check for the customer with this id
  const me = await Customer.findById(id);
  if(!me) return res.status(400).send({message: `Invalid token provided`});
  //prevent establish the same password as before
  if(await bcrypt.compare(req.body.password, me.password)) return res.status(400).send({message: 'Can not set the same password'});
  //encrypt and set the new password
  const hash = await bcrypt.genSalt(10);
  me.password = await bcrypt.hash(req.body.password, hash);
  await me.save();
  res.send({message: `Password changed for "${me.username}" user.`});
});

//set the avatar
router.put('/me/set-avatar', auth, async (req, res) => {
  //set the 'me' user
  const id = req.user._id;  
  //validate avatar
  const error = validateImage(req.body);
  if(error) return res.status(400).send(error.details[0]);
  //set the avatar
  const me = await Customer.updateOne({_id: id}, { $set: { avatar: req.body } });
  if(!me.n) return res.status(400).send({message: `Invalid token provided`});
  res.send(me);
});

//add restaurant to favorite list
router.put('/me/add-fav_restaurants/:id', auth, validateId, async (req, res) => {
  //set the 'me' user
  const me = await Customer.findById(req.user._id);
  if(!me) return res.status(400).send({message: `Invalid token provided`});
  //get the restaurant with the provided id
  const restaurant = await Restaurant.findById(req.params.id);
  if(!restaurant) return res.status(404).send({message: `No restaurant with this id: ${req.params.id }`});
  //check if already is in favorite
  const exist = me.favRestaurants.find(rest => rest._id == req.params.id);
  if(exist) return res.status(400).send({message: 'This restaurant already exist in the list'});
  //set favorite restaurant
  const favRestaurant = {
    _id: req.params.id,
    name: restaurant.name,
    city: restaurant.address.city
  };
  //add to the favorite restaurant list
  me.favRestaurants.push(favRestaurant);
  await me.save();
  res.send(favRestaurant);
});

//remove restaurant from the favorite list
router.delete('/me/remove-fav_restaurants/:id', auth, validateId, async (req, res) => {
  //set the 'me' user
  const me = await Customer.findById(req.user._id);
  if(!me) return res.status(400).send({message: `Invalid token provided`});
  //get the restaurant from the favorite list
  const exist = me.favRestaurants.find(rest => rest._id == req.params.id);
  if(!exist) return res.status(404).send({message: 'This restaurant is not in the list'});
  //remove from the favorite restaurant list
  me.favRestaurants = me.favRestaurants.filter(restaurant => restaurant._id != req.params.id);
  await me.save();
  res.send({removed: exist});
});

// add bartender to favorites
router.put('/me/add-fav_bartenders/:bartenderId', auth, async (req, res) => {
  //set the 'me' user
  const me = await Customer.findById(req.user._id);
  if(!me) return res.status(400).send(`Invalid token provided`);
  //validate bartender id
  if(!validateId(req.params.bartenderId)) return res.status(400).send(`Invalid bartender id`);
  //get the bartender with the provided id
  const bartender = await Bartender.findById(req.params.bartenderId);
  if(!bartender) return res.status(400).send(`No bartender with this id: ${req.params.bartenderId}`);
  //check if already is in favorites
  const exist = me.favBartenders.find(bartender => bartender._id == req.params.bartenderId);
  if(exist) return res.status(400).send(`This bartender already exist in the list`);
  //set favorite bartender
  const favBartender = {
    _id: req.params.bartenderId,
    username: bartender.username,
    raiting: bartender.raiting 
  };
  //add to the favorites bartender list
  me.favBartenders.push(favBartender);
  await me.save();
  res.send(favBartender);
});

// remove bartender from favorites
router.delete('/me/remove-fav_bartenders/:bartenderId', auth, async (req, res) => {
  //set the 'me' user
  const me = await Customer.findById(req.user._id);
  if(!me) return res.status(400).send(`Invalid token provided`);
  //validate bartender id
  if(!validateId(req.params.bartenderId)) return res.status(400).send(`Invalid bartender id`);
  //get the bartender from the favorite list
  const exist = me.favBartenders.find(rest => rest._id == req.params.bartenderId);
  if(!exist) return res.status(400).send('This bartender is not in the list');
  //remove from the favorite bartender list
  me.favBartenders = me.favBartenders.filter(bartender => bartender._id != req.params.bartenderId);
  await me.save();
  res.send({removed: exist});
});

//delete restaurant account
router.delete('/me', auth, async (req, res) => {
  //get the 'me' id
  const id = req.user._id;
  //remove customer user from DB
  const me = await Customer.findByIdAndDelete(id);
  res.send(`"${me.username}" user was successfully removed from DB`)
});
module.exports = router;