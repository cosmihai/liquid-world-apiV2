const mongoose = require('mongoose');
const Joi = require('joi');

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  author: {
    type: new mongoose.Schema({
      username: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 255,
        lowercase: true,
        trim: true
      },
      role: {
        type: String,
        required: true
      }
    })
  },
  recipient: {
    type: new mongoose.Schema({
      name: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 255,
        lowercase: true,
        trim: true
      },
      city: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 255,
        trim: true,
        lowercase: true
      },
      role: {
        type: String,
        required: true
      }
    })
  }
});

function validateComment(comment) {
  const schema = Joi.object({
    text: Joi.string().required(),
    customerId: Joi.objectId().required(),
    restaurantId: Joi.objectId().required()
  });
  const { error } = Joi.validate(comment, schema);
  return error;
};

const Comment = mongoose.model('Comment', commentSchema);

module.exports.Comment = Comment;
module.exports.validateComment = validateComment;