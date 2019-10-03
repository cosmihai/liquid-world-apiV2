const mongoose = require("mongoose");
const Joi = require("joi");

const customerSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    min: 2,
    max: 255,
    trim: true
  },
  email: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 255,
    trim: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 1024
  },
  avatar: {
    type: {
      imgName: {
        type: String,
        required: true,
        default: 'default image'
      },
      imgPath: {
        type: String,
        required: true,
        imgPath: 'https://images.unsplash.com/photo-1511914678378-2906b1f69dcf?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=634&q=80'
      },
    }
  },
  favRestaurants: [{
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
      }
    })
  }],
  favBartenders: [{
    type: new mongoose.Schema({
      username: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 255,
        lowercase: true,
        trim: true
      },
      raiting: {
        type: Number,
      }
    })
  }],
  role: {
    type: String,
    default: 'customer'
  }
});

function validateCustomer(customer) {
  const schema = Joi.object({
    username: Joi.string().min(2).max(255).required(),
    email: Joi.string().min(6).max(255).email().required(),
    password: Joi.string().min(6).max(255),
  });
  const { error } = Joi.validate(customer, schema);
  return error
};

const Customer = mongoose.model('Customer', customerSchema);

module.exports.Customer = Customer;
module.exports.validateCustomer = validateCustomer;