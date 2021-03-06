const mongoose = require("mongoose");
const Joi = require("joi");

const likeSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  cocktailId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
});

likeSchema.methods.validateLike = function (like) {
  const schema = Joi.object({
    cocktailId: Joi.objectId().required(),
  });
  const { error } = Joi.validate(like, schema);
  return error;
};

const Like = mongoose.model("Like", likeSchema);
module.exports.Like = Like;
