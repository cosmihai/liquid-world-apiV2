const config = require('config');
const jwt = require('jsonwebtoken');
const mongoose = require("mongoose");
const Joi = require("joi");

const bartenderSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 255,
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
      default: 'https://images.unsplash.com/photo-1569879973648-3181113d2d1c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1247&q=80'
    }
  },
  personalInfo: {
    firstName: {
      type: String,
      minlength: 2,
      maxlength: 255,
      trim: true,
      default: null
    },
    lastName: {
      type: String,
      minlength: 2,
      maxlength: 255,
      trim: true,
      default: null
    },
    phone: {
      type: String,
      minlength: 6,
      maxlength: 50,
      match: /^[0-9]+$/,
      default: null
    },
    description: {
      type: String,
      default: null
    }
  },
  experience: [{
    place: {
      type: String,
      minlength: 2,
      maxlength: 255,
      trim: true,
      required: true
    },
    from: {
      type: Date,
      required: true
    },
    until: {
      type: Date,
      required: true
    },
    position:{
      type: String,
      required: true,
      minlength: 2,
      maxlength: 255,
      trim: true,
      required: true
    }
  }],
  personalCocktails: [{
    type: new mongoose.Schema({
      name: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 255,
        trim: true,
      },
      category: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 255,
        trim: true,
      },
      image: {
        imgName: {
          type: String,
          required: true,
          default: 'default image'
        },
        imgPath: {
          type: String,
          required: true,
          default: 'https://images.unsplash.com/photo-1560963689-10982c7b6559?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1262&q=80'
        }
      }
    })
  }],
  raiting: {
    type: Number,
    min: 0,
    default: 0
  },
  role: {
    type: String,
    default: 'bartender'
  }
});

bartenderSchema.methods.generateToken = function() {
  return jwt.sign({_id: this._id, role: this.role}, config.get('jwtKey'));
};

function validateBartender(bartender) {
  const personalInfoSchema = Joi.object({
    firstName: Joi.string().min(2).max(255).trim().required(),
    lastName: Joi.string().min(2).max(255).trim().required(),
    phone: Joi.string().min(6).regex(/^[0-9]+$/),
    description: Joi.string().min(10).max(2048).required()
  });
  const schema = Joi.object({
    username: Joi.string().min(2).max(255).required(),
    email: Joi.string().min(6).max(255).email().required(),
    password: Joi.string().min(6).max(255),
    personalInfo: personalInfoSchema.required()
  });
  const { error } = Joi.validate(bartender, schema);
  return error;
};

function validateExpirience(exp) {
  const experienceSchema = Joi.object({
    place: Joi.string().min(2).max(255).trim().required(),
    from: Joi.date().required(),
    until: Joi.date().required(),
    position: Joi.string().min(2).max(255).trim().required(),
  });
  const { error } = Joi.validate(exp, experienceSchema);
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

const Bartender = mongoose.model('Bartender', bartenderSchema);
module.exports.Bartender = Bartender;
module.exports.validateBartender = validateBartender;
module.exports.validateExpirience = validateExpirience;
module.exports.validateId = validateId;
module.exports.validatePassword = validatePassword;
module.exports.validateImage = validateImage;