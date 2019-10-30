const Fawn = require('fawn');
const { Bartender } = require('../models/bartender');
const { Cocktail, validateCocktail, validateId, validateImage } = require('../models/cocktail');
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
  //check name availability
  const exist = await Cocktail.findOne({name: req.body.name});
  if(exist) return res.status(400).send(`"${exist.name}" already in use!`);
  //create and save the new cocktail
  const cocktail = new Cocktail(req.body);
  cocktail.owner = {
    _id: owner._id,
    username: owner.username,
    avatar: owner.avatar
  };
  try {
    new Fawn.Task()
    .save('cocktails', cocktail)
    .update('bartenders', { _id: owner._id }, {
      $push: { personalCocktails: {
        _id: cocktail._id,
        name: cocktail.name,
        category: cocktail.category,
        image: cocktail.image
      }}
    })
    .run()
    res.send(cocktail)
  }
  catch(ex) {
    res.status(500).send('Exception: \n' + ex);
  }
});

//edit one cocktail
router.put('/:id', auth, async (req, res) => {
  //validate the cocktail id
  if(!validateId(req.params.id)) return res.status(400).send(`The id ${req.params.id} is not valid`);
  //get the cocktail from the DB
  const cocktail = await Cocktail.findById(req.params.id);
  if(!cocktail) return res.status(400).send(`No cocktail with this id: ${req.params.id}`);
  //authorize
  if(req.user._id != cocktail.owner._id) return res.status(401).send(`You are not authorized to edit this cocktail`);
  //validate the body of the request
  const error = validateCocktail(req.body);
  if(error) return res.status(400).send(error.details[0].message);
  //save the changes
  const result = await cocktail.update(req.body);
  res.send(result);
});

//set/edit cocktail's image
router.put('/:id/set-image', auth, async (req, res) => {
  //validate the cocktail id
  if(!validateId(req.params.id)) return res.status(400).send(`The id ${req.params.id} is not valid`);
  //get the cocktail from the DB
  const cocktail = await Cocktail.findById(req.params.id);
  if(!cocktail) return res.status(400).send(`No cocktail with this id: ${req.params.id}`);
  //authorize
  if(req.user._id != cocktail.owner._id) return res.status(401).send(`You are not authorized to edit this cocktail`);
  //validate the body of the request
  const error = validateImage(req.body);
  if(error) return res.status(400).send(error.details[0].message);
  //save the changes
  const result = await cocktail.update({ image: req.body });
  res.send(result);
});

//delete cocktail
router.delete('/:id', auth, async (req, res) => {
  //validate the cocktail id
  if(!validateId(req.params.id)) return res.status(400).send(`The id ${ req.params.id } is not valid`);
  //get the cocktail from the DB
  const cocktail = await Cocktail.findById(req.params.id);
  if(!cocktail) return res.status(400).send(`No cocktail with this id: ${ req.params.id }`);
  //authorize
  if(req.user._id != cocktail.owner._id) return res.status(401).send(`You are not authorized to delete this cocktail`);
  //remove the cocktail
  const me = await Bartender.findById(req.user._id);
  if(!me) return res.send('not me')
  // cocktail.remove()
  // .then(async () => {
  //   await me.update({$pull :{ personalCocktails: {_id: cocktail._id}  }});
  //   res.send('done')
  // })
  try {
    new Fawn.Task()
    .remove('cocktails', { _id: cocktail._id })
    .update('bartenders', { _id: me._id }, {
      $pull: { personalCocktails: { name: cocktail.name }}
    })
    .run()
    res.send(`Cocktail "${cocktail.name}" was successfully removed from DB`);
  }
  catch(ex) {
    res.status(500).send('Exception: \n' + ex);
  }
});

module.exports = router;