const validateId = require("../middlewares/validateId");
const auth = require("../middlewares/auth");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const { Bartender } = require("../models/bartender");
const { Restaurant } = require("../models/restaurant");
const { Customer } = require("../models/customer");
const express = require("express");
const router = express.Router();
const setResponse = require("../helpers/setResponse");

//get all customers
router.get("/", async (req, res) => {
  const customers = await Customer.find({}, "-password");
  res.send(setResponse(customers));
});

//get current customer
router.get("/me", auth, async (req, res) => {
  //set the 'me' user
  const id = req.user._id;
  //get the 'me' user
  const me = await Customer.findById(id, "-password");
  if (!me) return res.status(400).send(setResponse(false, `Invalid token provided`));
  res.send(setResponse(me));
});

//get one customer
router.get("/:id", validateId, async (req, res) => {
  //get the customer
  const customer = await Customer.findById(req.params.id, "-password");
  if (!customer)
    return res
      .status(404)
      .send(setResponse(false, `No customer with this id ${req.params.id}`));
  res.send(setResponse(customer));
});

//create customer
router.post("/", async (req, res) => {
  //search for errors in the body of the request
  const error = new Customer().validateCustomer(req.body);
  if (error) return res.status(400).send(setResponse(false, error.details[0].message));
  //check if password exist in the body of the request
  if (!req.body.password)
    return res.status(400).send(setResponse(false, '"Password" is required!'));
  // check if the email is available
  const exist = await Customer.findOne({ email: req.body.email });
  if (exist)
    return res
      .status(400)
      .send(setResponse(false, `"${exist.email}" already in use!`));
  //encrypt password
  const hash = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, hash);
  //save the new customer user
  req.body.password = hashPassword;
  let customer = new Customer(req.body);
  customer = await customer.save();
  //send response
  res.send(setResponse(_.pick(customer, ["_id", "username", "email", "role"])));
});

//update customer
router.put("/me", auth, async (req, res) => {
  //set the 'me' user
  const id = req.user._id;
  //prevent password to be change
  if (req.body.password)
    return res.status(400).send(setResponse(false, '"Password" is not allowed!'));
  //check for error in the body of the request
  const error = new Customer().validateCustomer(req.body);
  if (error) return res.status(400).send(setResponse(false, error.details[0].message));
  //update the customer
  const me = await Customer.findByIdAndUpdate(id, req.body, { new: true });
  if (!me) return res.status(400).send(setResponse(false, `Invalid token provided)`));
  res.send(setResponse(_.pick(me, ["_id", "username", "email"])));
});

//update password
router.put("/me/change-password", auth, async (req, res) => {
  //set the 'me' user
  const id = req.user._id;
  //vaidate password
  const error = new Customer().validatePassword(req.body);
  if (error) return res.status(400).send(setResponse(false, error.details[0].message));
  //check for the customer with this id
  const me = await Customer.findById(id);
  if (!me) return res.status(400).send(setResponse(false, `Invalid token provided`));
  //prevent establish the same password as before
  if (await bcrypt.compare(req.body.password, me.password))
    return res.status(400).send(setResponse(false, "Can not set the same password"));
  //encrypt and set the new password
  const hash = await bcrypt.genSalt(10);
  me.password = await bcrypt.hash(req.body.password, hash);
  await me.save();
  res.send(setResponse(`Password changed for "${me.username}" user.`));
});

//set the avatar
router.put("/me/set-avatar", auth, async (req, res) => {
  //set the 'me' user
  const id = req.user._id;
  //validate avatar
  const error = new Customer().validateImage(req.body);
  if (error) return res.status(400).send(setResponse(false, error.details[0].message));
  //set the avatar
  const me = await Customer.updateOne(
    { _id: id },
    { $set: { avatar: req.body } }
  );
  if (!me.n) return res.status(400).send(setResponse(false, `Invalid token provided`));
  res.send(setResponse(me));
});

//add restaurant to favorite list
router.put(
  "/me/add-fav_restaurants/:id",
  auth,
  validateId,
  async (req, res) => {
    //set the 'me' user
    const me = await Customer.findById(req.user._id);
    if (!me) return res.status(400).send(setResponse(false, `Invalid token provided`));
    //get the restaurant with the provided id
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant)
      return res
        .status(404)
        .send(setResponse(false, `No restaurant with this id: ${req.params.id}`));
    //check if already is in favorite
    const exist = me.favRestaurants.find((rest) => rest._id == req.params.id);
    if (exist)
      return res
        .status(400)
        .send(setResponse(false, "This restaurant already exist in the list"));
    //set favorite restaurant
    const favRestaurant = {
      _id: req.params.id,
      name: restaurant.name,
      city: restaurant.address.city,
    };
    //add to the favorite restaurant list
    me.favRestaurants.push(favRestaurant);
    await me.save();
    res.send(setResponse(favRestaurant));
  }
);

//remove restaurant from the favorite list
router.delete(
  "/me/remove-fav_restaurants/:id",
  auth,
  validateId,
  async (req, res) => {
    //set the 'me' user
    const me = await Customer.findById(req.user._id);
    if (!me) return res.status(400).send(setResponse(false, `Invalid token provided`));
    //get the restaurant from the favorite list
    const exist = me.favRestaurants.find((rest) => rest._id == req.params.id);
    if (!exist)
      return res
        .status(404)
        .send(setResponse(false, "This restaurant is not in the list"));
    //remove from the favorite restaurant list
    me.favRestaurants = me.favRestaurants.filter(
      (restaurant) => restaurant._id != req.params.id
    );
    await me.save();
    res.send(setResponse({ removed: exist }));
  }
);

// add bartender to favorites
router.put("/me/add-fav_bartenders/:id", auth, validateId, async (req, res) => {
  //set the 'me' user
  const me = await Customer.findById(req.user._id);
  if (!me) return res.status(400).send(setResponse(false, `Invalid token provided`));
  //get the bartender with the provided id
  const bartender = await Bartender.findById(req.params.id);
  if (!bartender)
    return res
      .status(404)
      .send(setResponse(false, `No bartender with this id: ${req.params.id}`));
  //check if already is in favorites
  const exist = me.favBartenders.find(
    (bartender) => bartender._id == req.params.id
  );
  if (exist)
    return res
      .status(400)
      .send(setResponse(false, `This bartender already exist in the list`));
  //set favorite bartender
  const favBartender = {
    _id: req.params.id,
    username: bartender.username,
    raiting: bartender.raiting,
  };
  //add to the favorites bartender list
  me.favBartenders.push(favBartender);
  await me.save();
  res.send(setResponse(favBartender));
});

// remove bartender from favorites
router.delete(
  "/me/remove-fav_bartenders/:id",
  auth,
  validateId,
  async (req, res) => {
    //set the 'me' user
    const me = await Customer.findById(req.user._id);
    if (!me) return res.status(400).send(setResponse(false, `Invalid token provided`));
    //get the bartender from the favorite list
    const exist = me.favBartenders.find((rest) => rest._id == req.params.id);
    if (!exist)
      return res
        .status(404)
        .send(setResponse(false, "This bartender is not in the list"));
    //remove from the favorite bartender list
    me.favBartenders = me.favBartenders.filter(
      (bartender) => bartender._id != req.params.id
    );
    await me.save();
    res.send(setResponse({ removed: exist }));
  }
);

//delete restaurant account
router.delete("/me", auth, async (req, res) => {
  //get the 'me' id
  const id = req.user._id;
  //remove customer user from DB
  const me = await Customer.findByIdAndDelete(id);
  res.send(setResponse(`"${me.username}" user was successfully removed from DB`));
});
module.exports = router;
