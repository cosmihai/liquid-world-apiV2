const config = require("config");
const jwt = require("jsonwebtoken");
const setResponse = require("../helpers/setResponse");

function auth(req, res, next) {
  const token = req.header("x-auth-token");
  if (!token)
    return res
      .status(401)
      .send(setResponse(false, "Access denied. No token provided."));
  try {
    const decoded = jwt.verify(token, config.get("jwtKey"));
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).send(setResponse(false, "Invalid token provided."));
  }
}

module.exports = auth;
