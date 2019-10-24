const mongoose = require("mongoose");
const Joi = require("joi");
const categoryEnum = ['Before Dinner Cocktail', 'After Dinner Cocktail', 'All Day Cocktail', 'Sparkling Cocktail', 'Hot Drink'];
const unitEnum = ['cl', 'bar spoon', 'dashes', 'cube', 'other'];
const cocktailSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    min: 2,
    max: 255,
    trim: true
  },
  glass: {
    type: String,
    required: true,
    min: 2,
    max: 255,
    trim: true
  },
  category: {
    type: String,
    required: true,
    min: 2,
    max: 255,
    enum: categoryEnum
  },
  ingredients: {
    type: [{
      unit: {
        type: String,
        required: true,
        min: 2,
        max: 255,
        enum: unitEnum     
      },
      amount: {
        type: Number,
        required: true,
        min: 0,
      },
      ingredientName: {
        type: String,
        required: true,
        min: 2,
        max: 255,
        trim: true
      },
      label: {
        type: String,
        min: 2,
        max: 255,
        trim: true
      }
    }],
    validate: {
      validator: function() {
        return this.ingredients.length > 1 ? true : false
      },
      message: 'Must have at least 2 ingredients'
    }
  },
  garnish: {
    type: String,
    required: true,
    min: 2,
    max: 255,
    trim: true
  },
  preparation: {
    type: String,
    required: true,
    min: 10,
    max: 1024,
    trim: true
  },
  isIBA: {
    type:Boolean,
    default: false
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
      default: 'https://images.unsplash.com/photo-1509669803555-fd5edd8d5a41?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80'
    }
  },
  owner: {
    type: new mongoose.Schema({
      username: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 255,
        lowercase: true,
        trim: true
      },
      avatar: {
        imgName: {
          type: String,
          required: true
        },
        imgPath: {
          type: String,
          required: true
        }
      }
    }),
    required: true
  },
  likes: [{
    type: new mongoose.Schema({
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      username: {
        type: String,
        required: true,
        minlength: 2,
        maxlength: 255,
        lowercase: true,
        trim: true
      },
      avatar: {
        imgName: {
          type: String,
          required: true
        },
        imgPath: {
          type: String,
          required: true
        }
      }     
    })
  }]
});

const Cocktail = mongoose.model('Cocktail', cocktailSchema);

function validateCocktail(cocktail) {

  const ingredientSchema = Joi.object({
    unit: Joi.string().min(2).max(255).valid(...unitEnum).required(),
    amount: Joi.number().min(0).required(),
    ingredientName: Joi.string().min(2).max(255).required(),
    label: Joi.string().min(2).max(255)
  });

  const schema = Joi.object({
    name: Joi.string().min(2).max(255).required(),
    glass: Joi.string().min(2).max(255).required(),
    category: Joi.string().min(2).max(255).valid(...categoryEnum).required(),
    ingredients: Joi.array().min(2).items(ingredientSchema).required(),
    garnish: Joi.string().min(2).max(255).required(),
    preparation: Joi.string().min(10).max(1024).required()
  });

  const { error } = Joi.validate(cocktail, schema);
  return error
};

function validateId(id) {
  return mongoose.Types.ObjectId.isValid(id);
};

module.exports.Cocktail = Cocktail;
module.exports.validateCocktail = validateCocktail;
module.exports.validateId = validateId;