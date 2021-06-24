const mongoose = require("mongoose");
const setResponse = require("../helpers/setResponse");

module.exports = function (req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id))
    return res.status(404).send(setResponse(false, "Invalid id provided."));
  next();
};
