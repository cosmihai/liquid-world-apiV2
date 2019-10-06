const _ = require('lodash');
const bcrypt = require('bcrypt');
const { Customer, validateCustomer, validateId, validatePassword, validateImage } = require('../models/customer');
const express = require('express');
const router = express.Router();

router.get('/' ,async (req, res) => {
  const customers = await Customer.find({}, "-password");
  res.send(customers);
});

router.get('/:id', async (req, res) => {
  //validate Id
  if(!validateId(req.params.id)) return res.status(400).send(`The id ${req.params.id} is not valid`);
  const customer = await Customer.findById(req.params.id, "-password");
  if(!customer) return res.status(400).send(`No customer with this id: ${req.params.id}`);
  res.send(customer);
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

router.put('/:id', async (req, res) => {
  //validate Id
  if(!validateId(req.params.id)) return res.status(400).send(`The id ${req.params.id} is not valid`);
  //prevent password to be change
  if(req.body.password) return res.status(400).send('"Passowrd" is not allowed!');
  //check for error in the body of the request
  const error = validateCustomer(req.body);
  if(error) return res.status(400).send(error.details[0].message);
  //update the customer
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {new: true});
  if(!customer) return res.status(400).send(`No customer with this id: ${req.params.id}`);
  res.send(_.pick(customer, ['_id', 'username', 'email']));
});

router.put('/:id/change-password', async (req, res) => {
  //validate Id
  if(!validateId(req.params.id)) return res.status(400).send(`The id ${req.params.id} is not valid`);
  //vaidate password 
  const error = validatePassword(req.body);
  if(error) return res.status(400).send(error.details[0].message);
  //check for the customer with this id
  const customer = await Customer.findById(req.params.id);
  if(!customer) return res.status(400).send(`No customer with this id: ${req.params.id}`);
  //prevent establish the same password as before
  if(await bcrypt.compare(req.body.password, customer.password)) return res.status(400).send('Can not set the same password');
  //encrypt and set the new password
  const hash = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, hash);
  await Customer.findByIdAndUpdate(req.params.id, {$set: {password: hashPassword}});
  res.send(`Password changed for "${customer.username}" user.`);
});

router.put('/:id/set-avatar', async (req, res) => {
  //validate Id
  if(!validateId(req.params.id)) return res.status(400).send(`The id ${req.params.id} is not valid`);
  //validate avatar
  const error = validateImage(req.body);
  if(error) return res.status(400).send(error.details[0].message);
  const customer = await Customer.updateOne({_id: req.params.id}, { $set: { avatar: req.body } });
  if(!customer.n) return res.status(400).send(`No customer with this id: ${req.params.id}`);
  res.send(customer);
});
module.exports = router;