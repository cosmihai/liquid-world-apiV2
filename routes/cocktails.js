const { Bartender } = require('../models/bartender');
const { Cocktail, validateCocktail, validateId } = require('../models/cocktail');
const auth = require('../middlewares/auth');
const express = require('express');
const router = express.Router();

//get all cocktails
router.get('/', async (req, res) => {
  const cocktails = await Cocktail.find();
  res.send(cocktails);
});

//get one cocktail
router.get('/:id', async (req, res) => {
  //validate id
  if(!validateId(req.params.id)) return res.status(400).send(`The id ${req.params.id} is not valid`);
  //get the cocktail 
  const cocktail = await Cocktail.findById(req.params.id);
  if(!cocktail) return res.status(400).send(`No cocktail with this id: ${req.params.id}`);
  res.send({currentCocktail: cocktail, likes: cocktail.likesCounter});
});

//create one cocktail
router.post('/', auth, async (req, res) => {
  //check if req.user has bartender rol
  if(req.user.role != 'bartender') return res.status(401).send(`Only a bartender can create cocktails`)
  //get the owner
  const owner = await Bartender.findById(req.user._id, "-password");
  //check for errors in the body of the request
  const error = validateCocktail(req.body);
  if(error) return res.status(400).send(error.details[0].message);
  //create and save the new cocktail
  const cocktail = new Cocktail(req.body);
  cocktail.owner = {
    _id: owner._id,
    username: owner.username,
    avatar: owner.avatar
  };
  await cocktail.save();
  res.send(cocktail);
});

module.exports = router;