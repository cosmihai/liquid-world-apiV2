const auth = require('../middlewares/auth');
const Fawn = require('fawn');
const mongoose = require('mongoose');
const { Cocktail } = require('../models/cocktail');
const { Like, validateLike } = require('../models/like');
const express = require('express');
const router = express.Router();
Fawn.init(mongoose);

router.get('/', async (req, res) => {
  const likes = await Like.find();
  res.send(likes);
});

router.post('/', auth, async (req, res) => {
  //authorize
  if(req.user.role != 'customer') return res.status(401).send(`Only customers can give like to a cocktail`);
  //validate the body of the request
  const error = validateLike(req.body);
  if(error) return res.status(400).send(error.details[0].message);
  const like = new Like({
    customerId: req.user._id,
    cocktailId: req.body.cocktailId
  });
  // save the like and add it to the cocktail list of likes
  try {
    new Fawn.Task()
    .save('likes', like)
    .update('cocktails', { _id: req.body.cocktalId }, {
      $push: { likes: like._id }
    })
    .run()
    res.send(like);
  }
  catch(ex) {
    res.status(500).send('Exception: \n' + ex);
  }
})

module.exports = router;