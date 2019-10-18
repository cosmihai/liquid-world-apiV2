const auth = require('../middlewares/auth');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const { Bartender, validateBartender, validateId, validateExpirience, validateImage, validatePassword } = require('../models/bartender');
const express = require('express');
const router = express.Router();

//get all bartenders
router.get('/', async (req, res) => {
  const bartenders = await Bartender.find({}, "-password").sort("username");
  res.send(bartenders);
});

//get current bartender
router.get('/me', auth, async (req, res) => {
  //get the 'me' user
  const me = await Bartender.findById(req.user._id, "-password");
  if(!me) return res.status(400).send(`Invalid token provided`);
  res.send(me);
});

//get a specific bartender
router.get('/:id', async (req, res) => {
  //check if id is valid
  if(!validateId(req.params.id)) return res.status(400).send(`The id ${req.params.id} is not valid`); 
  //get the bartender
  const bartender = await Bartender.findById(req.params.id, "-password");
  //check if there is a bartender with the given id
  if(!bartender) return res.status(400).send(`No bartender with this id ${req.params.id}`);
  res.send(bartender);
});

//create bartender
router.post('/', async (req, res) => {
  //search for errors in the body of the request
  const error = validateBartender(req.body);
  if(error) return res.status(400).send(error.details[0].message);
  //check if password exist in the body of the request
  if(!req.body.password) res.status(400).send('"Password" is required!');
  // check if the email is available
  const exist = await Bartender.findOne({email: req.body.email});
  if(exist) return res.status(400).send(`"${exist.email}" already in use!`);
  //encrypt password
  const hash = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, hash);
  req.body.password = hashPassword;
  //save the new bartender user
  let bartender = new Bartender(req.body);
  bartender = await bartender.save();
  //send response
  res.send(_.pick(bartender, ['_id', 'username', 'email', 'role']));
});

//edit the profile
router.put('/me', auth, async (req, res) => {
  //set the 'me' user
  const id = req.user._id;
  //prevent password to be changed
  if(req.body.password) return res.status(400).send('"Passowrd" is not allowed!');
  //search for errors in the body of the request
  const error = validateBartender(req.body);
  if(error) return res.status(400).send(error.details[0].message);
  //update the profile
  const me = await Bartender.findByIdAndUpdate(id, req.body, {new: true});
  if(!me) return res.status(400).send(`Invalid token provided`);
  res.send(_.pick(me, ['_id', 'username', 'email', 'personalInfo']));
});

//update password
router.put('/me/change-password', auth, async (req, res) => {
  //set the 'me' user
  const id = req.user._id;
  //validate password
  const error = validatePassword(req.body);
  if(error) return res.status(400).send(error.details[0].message);
  //check for the bartender with the provided id
  const me = await Bartender.findById(id);
  if(!me) return res.status(400).send(`Invalid token`);
  //prevent establish the same password as before
  if(await bcrypt.compare(req.body.password, me.password)) return res.status(400).send(`Can not set the same password`);
  //encrypt and set the new password
  const hash = await bcrypt.genSalt(10);
  me.password = await bcrypt.hash(req.body.password, hash);
  await me.save();
  res.send(`Password changed for "${me.username}" user.`)
});

//set the avatar
router.put('/me/set-avatar', auth, async (req, res) => {
  //set the 'me' user
  const id = req.user._id;  
  //validate avatar
  const error = validateImage(req.body);
  if(error) return res.status(400).send(error.details[0].message);
  //set the avatar
  const me = await Bartender.updateOne({_id: id}, { $set: { avatar: req.body } });
  if(!me.n) return res.status(400).send(`Invalid token provided`);
  res.send(me);
});
//delete bartender user

module.exports = router;