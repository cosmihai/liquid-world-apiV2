const config = require('config');
const winston = require('winston');
const mongoose = require('mongoose');
const Fawn = require('fawn');
Fawn.init(mongoose);

module.exports = function () {
  let db = config.get('db')
  mongoose.connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
    .then(() => winston.info(`connected to ${db} ...`))
    .catch(err => {throw new Error('DB ERROR: ' + err.message)})
} 