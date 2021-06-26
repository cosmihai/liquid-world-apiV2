const auth = require("../middlewares/auth");
const Fawn = require("fawn");
const { Customer } = require("../models/customer");
const { Cocktail } = require("../models/cocktail");
const { Like } = require("../models/like");
const express = require("express");
const router = express.Router();
const setResponse = require("../helpers/setResponse");

//list all likes
router.get("/", async (req, res) => {
  const likes = await Like.find();
  res.send(setResponse(likes));
});

//give like to a cocktail
router.post("/", auth, async (req, res) => {
  //authorize
  if (req.user.role != "customer")
    return res
      .status(401)
      .send(setResponse(false, `Only customers can give like to a cocktail`));
  //set the customer
  const customer = await Customer.findById(req.user._id);
  if (!customer)
    return res
      .status(400)
      .send(setResponse(false, `No customer user with this id`));
  //validate the body of the request
  const error = new Like().validateLike(req.body);
  if (error)
    return res.status(400).send(setResponse(false, error.details[0].message));
  const cocktail = await Cocktail.findById(req.body.cocktailId);
  if (!cocktail)
    return res.status(404).send(setResponse(false, `No cocktail with this id`));
  //check if already is in favCocktail list
  if (customer.favCocktails.indexOf(cocktail._id) > -1)
    return res
      .status(400)
      .send(setResponse(false, `You already like this cocktail`));
  //set the like
  const like = new Like({
    customerId: customer._id,
    cocktailId: cocktail._id,
  });
  // save the like and add it to the cocktail list of likes
  try {
    new Fawn.Task()
      .save("likes", like)
      .update(
        "cocktails",
        { _id: cocktail._id },
        {
          $push: {
            likes: {
              _id: like._id,
              customerId: customer._id,
              username: customer.username,
              avatar: customer.avatar,
            },
          },
        }
      )
      .update(
        "customers",
        { _id: customer._id },
        {
          $push: { favCocktails: cocktail._id },
        }
      )
      .update(
        "bartenders",
        { _id: cocktail.owner._id },
        {
          $inc: { raiting: 1 },
        }
      )
      .run()
      .then(() => {
        res.send(setResponse(like));
      });
  } catch (ex) {
    res.status(500).send(setResponse(false, "Exception: \n" + ex));
  }
});

//remove the like
router.delete("/", auth, async (req, res) => {
  //authorize
  if (req.user.role != "customer")
    return res
      .status(401)
      .send(setResponse(false, `Only customers can access this resource`));
  //set the customer
  const customer = await Customer.findById(req.user._id);
  if (!customer)
    return res
      .status(404)
      .send(setResponse(false, `No customer user with this id`));
  //validate the body of the request
  const error = new Like().validateLike(req.body);
  if (error)
    return res.status(400).send(setResponse(false, error.details[0].message));
  //get the cocktail
  const cocktail = await Cocktail.findById(req.body.cocktailId);
  if (!cocktail)
    return res.status(404).send(setResponse(false, `No cocktail with this id`));
  //search for this cocktail in favorites list
  if (customer.favCocktails.indexOf(cocktail._id) < 0)
    return res
      .status(400)
      .send(setResponse(false, `This cocktail is not in your favorite list`));
  const like = await Like.findOne({
    $and: [{ customerId: customer._id }, { cocktailId: cocktail._id }],
  });
  // delete the like and remove it from the cocktail list of likes
  try {
    new Fawn.Task()
      .remove("likes", { _id: like._id })
      .update(
        "cocktails",
        { _id: cocktail._id },
        {
          $pull: { likes: { _id: like._id } },
        }
      )
      .update(
        "customers",
        { _id: customer._id },
        {
          $pull: { favCocktails: cocktail._id },
        }
      )
      .update(
        "bartenders",
        { _id: cocktail.owner._id },
        {
          $inc: { raiting: -1 },
        }
      )
      .run()
      .then(() => {
        res.send(
          setResponse(
            `Cocktail ${cocktail.name} is no longer in your favorite list`
          )
        );
      });
  } catch (ex) {
    res.status(500).send(setResponse(false, "Exception: \n" + ex));
  }
});

module.exports = router;
