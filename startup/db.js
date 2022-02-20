const config = require('config');
const logger = require("../startup/logger");
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
    .then(() => logger.info(`connected to ${db} ...`))
    .catch(err => {throw new Error('DB ERROR: ' + err.message)})
} 