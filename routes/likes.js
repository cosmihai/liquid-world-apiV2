const auth = require('../middlewares/auth');
const Fawn = require('fawn');
const { Customer } = require('../models/customer');
const { Cocktail } = require('../models/cocktail');
const { Like, validateLike } = require('../models/like');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  const likes = await Like.find();
  res.send(likes);
});

router.post('/', auth, async (req, res) => {
  //authorize
  if(req.user.role != 'customer') return res.status(401).send(`Only customers can give like to a cocktail`);
  //set the customer
  const customer = await Customer.findById(req.user._id)
  //validate the body of the request
  const error = validateLike(req.body);
  if(error) return res.status(400).send(error.details[0].message);
  const cocktail = await Cocktail.findById(req.body.cocktailId);
  if(!cocktail) return res.status(400).send(`No cocktail with this id`);
  //set the like
  const like = new Like({
    customerId: customer._id,
    cocktailId: cocktail._id
  });
  // save the like and add it to the cocktail list of likes
  try {
    new Fawn.Task()
    .save('likes', like)
    .update('cocktails', { _id: cocktail._id }, {
      $push: { likes: 
        {
          _id: like._id,
          customerId: customer._id,
          username: customer.username,
          avatar: customer.avatar
        } 
      }
    })
    .run()
    res.send(like);
  }
  catch(ex) {
    res.status(500).send('Exception: \n' + ex);
  }
});

module.exports = router;