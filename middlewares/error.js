const winston = require("winston");
const setResponse = require("../helpers/setResponse");

module.exports = function (err, req, res, next) {
  winston.error(err.message, err);
  res.status(500).send(setResponse(false, "Internal server error: \n" + err));
};
