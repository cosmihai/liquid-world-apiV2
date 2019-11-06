const winston = require('winston');
const mongoose = require('mongoose');
const Fawn = require('fawn');
Fawn.init(mongoose);

module.exports = function() {
  //DB connection
  mongoose.connect('mongodb://localhost/LWApi', {
  useNewUrlParser: true,  
  useUnifiedTopology: true, 
  useCreateIndex: true,
  useFindAndModify: false})
  .then(() => winston.info('connected to DB ...'));
}