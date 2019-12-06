const config = require('config');
const jwt = require('jsonwebtoken');
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
    imgName: {
      type: String,
      required: true,
      default: 'default image'
    },
    imgPath: {
      type: String,
      required: true,
      default: 'https://images.unsplash.com/photo-1511914678378-2906b1f69dcf?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=634&q=80'
    }
  },
  favRestaurants: [{
    type: new mongoose.Schema({
      name: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 255,
        trim: true
      },
      city: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 255,
        trim: true,
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
        trim: true
      },
      raiting: {
        type: Number,
      }
    })
  }],
  favCocktails: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cocktail'
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  ratedRestaurants: [{
    type: new mongoose.Schema({
      restaurantId: {
        type: String,
        required: true
      },
      restaurantName: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 255,
        trim: true
      },
      rate: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      }
    })
  }],
  role: {
    type: String,
    default: 'customer'
  }
});

customerSchema.methods.generateToken = function() {
  return jwt.sign({_id: this._id, role: this.role}, config.get('jwtKey'));
}

function validateCustomer(customer) {
  const schema = Joi.object({
    username: Joi.string().min(2).max(255).required(),
    email: Joi.string().min(6).max(255).email().required(),
    password: Joi.string().min(6).max(255),
  });
  const { error } = Joi.validate(customer, schema);
  return error;
};

function validateId(id) {
  return mongoose.Types.ObjectId.isValid(id);
};

function validatePassword(pass) {
  const passSchema = Joi.object({
    password: Joi.string().min(6).max(255).required()
  });
  const { error } = Joi.validate(pass, passSchema);
  return error;
};

function validateImage(img) {
  const imgSchema = Joi.object({
    imgName: Joi.string().required(),
    imgPath: Joi.string().required()
  });
  const { error } = Joi.validate(img, imgSchema);
  return error;
};

const Customer = mongoose.model('Customer', customerSchema);

module.exports.Customer = Customer;
module.exports.validateCustomer = validateCustomer;
module.exports.validateId = validateId;
module.exports.validatePassword = validatePassword;
module.exports.validateImage = validateImage;