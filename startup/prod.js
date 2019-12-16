const helmet = require('helmet');
const compressionn = require('compression');

module.exports = function(app) {
  app.use(helmet());
  app.use(compressionn());
};