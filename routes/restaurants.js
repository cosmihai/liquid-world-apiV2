const validateId = require("../middlewares/validateId");
const auth = require("../middlewares/auth");
const Fawn = require("fawn");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const { Customer } = require("../models/customer");
const { Restaurant } = require("../models/restaurant");
const express = require("express");
const router = express.Router();
const setResponse = require("../helpers/setResponse");

//get all restaurants
router.get("/", async (req, res) => {
  const restaurants = await Restaurant.find({}, "-password");
  res.send(setResponse(restaurants));
});

//get the restaurant profile
router.get("/me", auth, async (req, res) => {
  //get the 'me' user
  const me = await Restaurant.findById(req.user._id, "-password").populate(
    "comments"
  );
  if (!me)
    return res.status(400).send(setResponse(false, `Invalid token provided`));
  res.send(setResponse(me));
});

//get one restaurant profile
router.get("/:id", validateId, async (req, res) => {
  //search for the restaurant by id
  let restaurant = await Restaurant.findById(
    req.params.id,
    "-password"
  ).populate("comments");
  if (!restaurant)
    return res
      .status(404)
      .send(setResponse(false, `No restaurant with this id: ${req.params.id}`));
  res.send(setResponse(restaurant));
});

//rate one restaurant
router.put("/:id/rate", auth, validateId, async (req, res) => {
  //authorize
  if (req.user.role !== "customer")
    return res
      .status(401)
      .send(setResponse(false, "Only customer users can rate restaurants"));
  //get the customer
  const customer = await Customer.findById(req.user._id);
  if (!customer)
    return res
      .status(400)
      .send(setResponse(false, "No customer found with this id."));
  //check for the rate object in the body of the request
  if (!req.body.rate || req.body.rate < 1 || req.body.rate > 5) {
    return res
      .status(400)
      .send(setResponse(false, "Rate must be a number between 1 and 5."));
  }
  //check if the customer already rated this restaurant
  let previousRate;
  const alreadyRated = customer.ratedRestaurants.find(
    (elem) => elem.restaurantId == req.params.id
  );
  if (alreadyRated) {
    previousRate = alreadyRated.rate;
    customer.ratedRestaurants = customer.ratedRestaurants.filter(
      (elem) => elem.restaurantId != req.params.id
    );
    await customer.save();
  }
  //get the restaurant
  const restaurant = await Restaurant.findById(req.params.id);
  let { votes, stars } = restaurant.rating;
  //delete the previous rate if exist
  if (alreadyRated) {
    if (votes === 1) {
      stars = 0;
      votes = 0;
    } else {
      stars = (stars * votes - previousRate) / (votes - 1);
      votes--;
    }
  }
  //update rating
  stars = (stars * votes + req.body.rate) / (votes + 1);
  votes++;
  try {
    new Fawn.Task()
      .update(
        "restaurants",
        { _id: restaurant._id },
        {
          rating: {
            votes: votes,
            stars: stars,
          },
        }
      )
      .update(
        "customers",
        { _id: customer._id },
        {
          $push: {
            ratedRestaurants: {
              restaurantId: restaurant._id,
              restaurantName: restaurant.name,
              rate: req.body.rate,
            },
          },
        }
      )
      .run()
      .then(() => {
        res.send(setResponse({ votes: votes, stars: stars }));
      });
  } catch (ex) {
    res.status(500).send(setResponse(false, "Exception: \n" + ex));
  }
});

//create a restaurant profile
router.post("/", async (req, res) => {
  //check if password exist in the body of the request
  if (!req.body.password)
    return res.status(400).send(setResponse(false, '"Password" is required.'));
  //search for errors in the body of the request
  const error = new Restaurant().validateRestaurant(req.body);
  if (error)
    return res.status(400).send(setResponse(false, error.details[0].message));
  // check if the email is available
  const exist = await Restaurant.findOne({ email: req.body.email });
  if (exist)
    return res
      .status(400)
      .send(setResponse(false, `"${exist.email}" already in use!`));
  //encrypt password
  const hash = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, hash);
  //save the new restaurant user
  req.body.password = hashPassword;
  let restaurant = new Restaurant(req.body);
  restaurant = await restaurant.save();
  //send response
  res.send(setResponse(_.pick(restaurant, ["_id", "name", "email", "role"])));
});

//edit the restaurant profile
router.put("/me", auth, async (req, res) => {
  //set the 'me' user
  const id = req.user._id;
  //search for errors in the body of the request
  const error = new Restaurant().validateRestaurant(req.body);
  if (error)
    return res.status(400).send(setResponse(false, error.details[0].message));
  //prevent password to be change
  if (req.body.password)
    return res
      .status(400)
      .send(setResponse(false, '"Password" is not allowed.'));
  //update the profile
  const me = await Restaurant.findByIdAndUpdate(id, req.body, { new: true });
  if (!me)
    return res.status(400).send(setResponse(false, `Invalid token provided`));
  res.send(
    setResponse(
      _.pick(me, [
        "_id",
        "name",
        "email",
        "address",
        "phone",
        "description",
        "capacity",
        "cuisine",
      ])
    )
  );
});

//change the restaurant password
router.put("/me/change-password", auth, async (req, res) => {
  //set the 'me' user
  const id = req.user._id;
  //vaidate password
  const error = new Restaurant().validatePassword(req.body);
  if (error)
    return res.status(400).send(setResponse(false, error.details[0].message));
  //check for the restaurant with this id
  const me = await Restaurant.findById(id);
  if (!me)
    return res.status(400).send(setResponse(false, `Invalid token provided`));
  //prevent establish the same password as before
  if (await bcrypt.compare(req.body.password, me.password))
    return res
      .status(400)
      .send(setResponse(false, "Can not set the same password"));
  //encrypt and set the new password
  const hash = await bcrypt.genSalt(10);
  me.password = await bcrypt.hash(req.body.password, hash);
  await me.save();
  res.send(setResponse(`Password changed for "${me.name}" user.`));
});

//add one photo to the restaurant gallery
router.put("/me/add-photo", auth, async (req, res) => {
  //set the 'me' user
  const id = req.user._id;
  //check the image object
  const error = new Restaurant().validateImage(req.body);
  if (error)
    return res.status(400).send(setResponse(false, error.details[0].message));
  //check for the restaurant with this id and push the new image
  const me = await Restaurant.updateOne(
    { _id: id },
    { $push: { images: req.body } }
  );
  if (!me.n)
    return res.status(400).send(setResponse(false, `Invalid token provided`));
  res.send(setResponse(me));
});

//remove one photo from the restaurant gallery
router.delete("/me/remove-photo/:id", auth, validateId, async (req, res) => {
  //set the 'me' user
  const id = req.user._id;
  //remove image from the array
  const me = await Restaurant.updateOne(
    { _id: id },
    { $pull: { images: { _id: req.params.id } } }
  );
  if (!me.n)
    return res.status(400).send(setResponse(false, `Invalid token provided`));
  if (!me.nModified)
    return res
      .status(404)
      .send(setResponse(false, `No image with this id: ${req.params.id}`));
  res.send(setResponse(me));
});

//remove the restaurant profile
router.delete("/me", auth, async (req, res) => {
  //set the 'me' user
  const id = req.user._id;
  //remove restaurant user from DB
  const me = await Restaurant.findByIdAndDelete(id);
  res.send(
    setResponse(`The "${me.name}" user was successfully removed from DB`)
  );
});

module.exports = router;
