const express = require('express');
const router = express.Router();
const { Customer, validateCustomer } = require('../models/customer');
const bcrypt = require('bcrypt');
const _ = require('lodash');

router.get('/', async (req, res) => {
  const customers = await Customer.find();
  res.send(customers);
});

router.post('/', async (req, res) => {
  //check if password exist in the body of the request
  if(!req.body.password) res.status(400).send('"Password" is required!');
  //search for errors in the body of the request
  const error = validateCustomer(req.body);
  if(error) return res.status(400).send(error.details[0].message);
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
  res.send(_.pick(customer, ['_id', 'name', 'email', 'role']));  if(error) return res.status(400).send(error.details[0].message);
})

module.exports = router;