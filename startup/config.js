const logger = require("../startup/logger");
const config = require('config');

module.exports = function(app) {
  if(!config.get('jwtKey')) {
    throw new Error('FATAL ERROR: jwtKey is not defined.');
  }
  logger.info(`App: ${config.get("appName")}; Env: ${app.get("env")}; DB: ${config.get("db")}`);
}