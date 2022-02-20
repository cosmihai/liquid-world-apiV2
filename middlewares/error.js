const logger = require("../startup/logger");
const setResponse = require("../helpers/setResponse");

module.exports = function (err, req, res, next) {
  logger.error(err.message);
  res.status(500).send(setResponse(false, "Internal server error: \n" + err));
};
