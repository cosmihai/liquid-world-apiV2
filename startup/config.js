const winston = require('winston');
const config = require('config');

module.exports = function(app) {
  if(!config.get('jwtKey')) {
    throw new Error('FATAL ERROR: jwtKey is not defined.');
  }
  winston.info(`App: ${config.get("appName")}; Env: ${app.get("env")}`);
}