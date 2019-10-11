const auth = require('../middlewares/auth');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const { Customer, validateCustomer, validateId, validatePassword, validateImage } = require('../models/customer');
const express = require('express');
const router = express.Router();

router.get('/' ,async (req, res) => {
  const customers = await Customer.find({}, "-password");
  res.send(customers);
});

router.get('/me', auth, async (req, res) => {
  //set the 'me' user
  const id = req.user._id;
  //get the 'me' user
  const me = await Customer.findById(id, "-password");
  if(!me) return res.status(400).send(`Invalid token provided`);
  res.send(me);
});

router.post('/', async (req, res) => {
  //search for errors in the body of the request
  const error = validateCustomer(req.body);
  if(error) return res.status(400).send(error.details[0].message);
  //check if password exist in the body of the request
  if(!req.body.password) return res.status(400).send('"Password" is required!');
  // check if the email is available
  const exist = await Customer.findOne({email: req.body.email});
  if(exist) return res.status(400).send(`"${exist.email}" already in use!`);
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

router.put('/me', auth, async (req, res) => {
  //set the 'me' user
  const id = req.user._id;
  //prevent password to be change
  if(req.body.password) return res.status(400).send('"Passowrd" is not allowed!');
  //check for error in the body of the request
  const error = validateCustomer(req.body);
  if(error) return res.status(400).send(error.details[0].message);
  //update the customer
  const me = await Customer.findByIdAndUpdate(id, req.body, {new: true});
  if(!me) return res.status(400).send(`Invalid token provided`);
  res.send(_.pick(me, ['_id', 'username', 'email']));
});

router.put('/me/change-password', auth, async (req, res) => {
  //set the 'me' user
  const id = req.user._id;
  //vaidate password 
  const error = validatePassword(req.body);
  if(error) return res.status(400).send(error.details[0].message);
  //check for the customer with this id
  const me = await Customer.findById(id);
  if(!me) return res.status(400).send(`Invalid token provided`);
  //prevent establish the same password as before
  if(await bcrypt.compare(req.body.password, me.password)) return res.status(400).send('Can not set the same password');
  //encrypt and set the new password
  const hash = await bcrypt.genSalt(10);
  me.password = await bcrypt.hash(req.body.password, hash);
  await me.save();
  res.send(`Password changed for "${me.username}" user.`);
});

router.put('/me/set-avatar', auth, async (req, res) => {
  //set the 'me' user
  const id = req.user._id;  
  //validate avatar
  const error = validateImage(req.body);
  if(error) return res.status(400).send(error.details[0].message);
  //set the avatar
  const me = await Customer.updateOne({_id: id}, { $set: { avatar: req.body } });
  if(!me.n) return res.status(400).send(`Invalid token provided`);
  res.send(me);
});
module.exports = router;