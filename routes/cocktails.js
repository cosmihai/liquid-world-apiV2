const Fawn = require("fawn");
const validateId = require("../middlewares/validateId");
const { Bartender } = require("../models/bartender");
const { Cocktail } = require("../models/cocktail");
const auth = require("../middlewares/auth");
const express = require("express");
const router = express.Router();
const setResponse = require("../helpers/setResponse");

//get all cocktails
router.get("/", async (req, res) => {
  const cocktails = await Cocktail.find();
  res.send(setResponse(cocktails));
});

//get one cocktail
router.get("/:id", validateId, async (req, res) => {
  const cocktail = await Cocktail.findById(req.params.id);
  if (!cocktail)
    return res
      .status(404)
      .send(setResponse(false, `No cocktail with this id: ${req.params.id}`));
  res.send(setResponse({ currentCocktail: cocktail, likes: cocktail.likesCounter }));
});

//create one cocktail
router.post("/", auth, async (req, res) => {
  //check if req.user has bartender rol
  if (req.user.role != "bartender")
    return res
      .status(401)
      .send(setResponse(false, `Only a bartender can create cocktails`));
  //get the owner
  const owner = await Bartender.findById(req.user._id, "-password");
  //check for errors in the body of the request
  const error = new Cocktail().validateCocktail(req.body);
  if (error) return res.status(400).send(setResponse(false, error.details[0].message));
  //check name availability
  const exist = await Cocktail.findOne({ name: req.body.name });
  if (exist)
    return res
      .status(400)
      .send(setResponse(false, `Name "${exist.name}" already in use!`));
  //create and save the new cocktail
  const cocktail = new Cocktail(req.body);
  cocktail.owner = {
    _id: owner._id,
    username: owner.username,
    avatar: owner.avatar,
  };
  try {
    new Fawn.Task()
      .save("cocktails", cocktail)
      .update(
        "bartenders",
        { _id: owner._id },
        {
          $push: {
            personalCocktails: {
              _id: cocktail._id,
              name: cocktail.name,
              category: cocktail.category,
              image: cocktail.image,
            },
          },
        }
      )
      .run()
      .then(() => {
        res.send(setResponse(cocktail));
      });
  } catch (ex) {
    res.status(500).send(setResponse(false, "Exception: \n" + ex));
  }
});

//edit one cocktail
router.put("/:id", auth, validateId, async (req, res) => {
  //get the cocktail from the DB
  const cocktail = await Cocktail.findById(req.params.id);
  if (!cocktail)
    return res
      .status(404)
      .send(setResponse(false, `No cocktail with this id: ${req.params.id}`));
  //authorize
  if (req.user._id != cocktail.owner._id)
    return res
      .status(401)
      .send(setResponse(false, `You are not authorized to edit this cocktail`));
  //validate the body of the request
  const error = new Cocktail().validateCocktail(req.body);
  if (error) return res.status(400).send(setResponse(false, error.details[0].message));
  //save the changes
  const result = await cocktail.updateOne(req.body);
  res.send(setResponse(result));
});

//set/edit cocktail's image
router.put("/:id/set-image", auth, validateId, async (req, res) => {
  //get the cocktail from the DB
  const cocktail = await Cocktail.findById(req.params.id);
  if (!cocktail)
    return res
      .status(404)
      .send(setResponse(false, `No cocktail with this id: ${req.params.id}`));
  //authorize
  if (req.user._id != cocktail.owner._id)
    return res
      .status(401)
      .send(setResponse(false, `You are not authorized to edit this cocktail`));
  //validate the body of the request
  const error = new Cocktail().validateImage(req.body);
  if (error) return res.status(400).send(setResponse(false, error.details[0].message));
  //save the changes
  const result = await cocktail.updateOne({ image: req.body });
  res.send(setResponse(result));
});

//delete cocktail
router.delete("/:id", auth, validateId, async (req, res) => {
  //get the cocktail from the DB
  const cocktail = await Cocktail.findById(req.params.id);
  if (!cocktail)
    return res
      .status(404)
      .send(setResponse(false, `No cocktail with this id: ${req.params.id}`));
  //authorize
  if (req.user._id != cocktail.owner._id)
    return res
      .status(401)
      .send(setResponse(false, `You are not authorized to delete this cocktail`));
  //remove the cocktail
  try {
    new Fawn.Task()
      .remove("cocktails", { _id: cocktail._id })
      .update(
        "bartenders",
        { _id: cocktail.owner._id },
        {
          $pull: { personalCocktails: { _id: cocktail._id } },
        }
      )
      .run()
      .then(() => {
        res.send(setResponse(`Cocktail "${cocktail.name}" was successfully removed from DB`));
      });
  } catch (ex) {
    res.status(500).send(setResponse(false, "Exception: \n" + ex));
  }
});

module.exports = router;
