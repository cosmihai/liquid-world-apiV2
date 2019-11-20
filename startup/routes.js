const winston = require('winston');
const express = require('express');
const error = require('../middlewares/error');
const morgan = require('morgan');
const authRoute = require('../routes/auth');
const bartendersRoute = require('../routes/bartenders');
const cocktailsRoute = require('../routes/cocktails');
const commentsRoute = require('../routes/comments');
const customersRoute = require('../routes/customers');
const restaurantsRoute = require('../routes/restaurants');
const likesRoute = require('../routes/likes');

module.exports = function(app) {
  //middlewares
  app.use(express.json())
  if(app.get("env") === 'development') {
    app.use(morgan('tiny'));
    winston.info('morgan enabled...')
  };
  app.use('/api/auth', authRoute);
  app.use('/api/bartenders', bartendersRoute);
  app.use('/api/cocktails', cocktailsRoute);
  app.use('/api/comments', commentsRoute);
  app.use('/api/customers', customersRoute);
  app.use('/api/restaurants', restaurantsRoute);
  app.use('/api/likes', likesRoute);
  app.use('**', (req, res) => res.status(404).send({message:'Inexistent resource'}));
  app.use(error);
}