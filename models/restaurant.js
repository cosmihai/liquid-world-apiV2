const config = require("config");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Joi = require("joi");

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 255,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 255,
    trim: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 1024,
  },
  address: {
    type: {
      street: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 255,
        trim: true,
      },
      number: {
        type: String,
        minlength: 1,
        maxlength: 255,
        trim: true,
      },
      city: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 255,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 255,
        trim: true,
      },
    },
    required: true,
  },
  phone: {
    type: String,
    required: true,
    minlength: 6,
    maxlength: 50,
    match: /^[0-9]+$/,
  },
  description: {
    type: String,
  },
  images: [
    {
      imgName: {
        type: String,
        required: true,
      },
      imgPath: {
        type: String,
        required: true,
      },
    },
  ],
  rating: {
    votes: {
      type: Number,
      default: 0,
    },
    stars: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
      get: (v) => Math.round(v * 10) / 10,
      set: (v) => Math.round(v * 10) / 10,
    },
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
  capacity: {
    type: Number,
    min: 0,
    required: true,
  },
  cuisine: {
    type: String,
    required: true,
    minlength: 4,
    maxlength: 255,
  },
  role: {
    type: String,
    default: "restaurant",
  },
});

restaurantSchema.methods.generateToken = function () {
  return jwt.sign({ _id: this._id, role: this.role }, config.get("jwtKey"));
};

restaurantSchema.methods.validateRestaurant = function (restaurant) {
  const addressSchema = Joi.object({
    street: Joi.string().min(2).max(255).required(),
    number: Joi.string().min(1).max(255).required(),
    city: Joi.string().min(2).max(255).required(),
    country: Joi.string().min(2).max(255).required(),
  });
  const schema = Joi.object({
    name: Joi.string().min(2).max(255).required(),
    email: Joi.string().min(6).max(255).email().required(),
    password: Joi.string().min(6).max(255),
    address: addressSchema.required(),
    phone: Joi.string()
      .min(6)
      .max(50)
      .required()
      .regex(/^[0-9]+$/),
    description: Joi.string(),
    capacity: Joi.number().min(0).required(),
    cuisine: Joi.string().min(4).max(255).required(),
  });
  const { error } = Joi.validate(restaurant, schema);
  return error;
};

restaurantSchema.methods.validatePassword = function (pass) {
  const passSchema = Joi.object({
    password: Joi.string().min(6).max(255).required(),
  });
  const { error } = Joi.validate(pass, passSchema);
  return error;
};

restaurantSchema.methods.validateImage = function (img) {
  const imgSchema = Joi.object({
    imgName: Joi.string().required(),
    imgPath: Joi.string().required(),
  });
  const { error } = Joi.validate(img, imgSchema);
  return error;
};

const Restaurant = mongoose.model("Restaurant", restaurantSchema);
module.exports.Restaurant = Restaurant;
