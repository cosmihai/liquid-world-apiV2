const { Cocktail } = require('../../models/cocktail');
const { Bartender } = require('../../models/bartender');
const { Customer } = require('../../models/customer');
const { Restaurant } = require('../../models/restaurant');
const mongoose = require('mongoose');
const request = require('supertest');
let server;

describe("/api/cocktails", () => {
  let cocktailsList; 
  let bartender;
  let token;
  
  beforeEach(async () => {
    server = require('../../app');
    bartender = await new Bartender({
      username: "bartenderTest1",
      email: "bartenderTest1@gmail.com",
      password: "123456",
      personalInfo: {
        firstName: "firstNameTest1",
        lastName: "lastNameTest1",
        phone: "654321",
        description: "this is test description for bartenderTest1"
      }
    }).save();
    token = bartender.generateToken();
    cocktailsList = [
      {
        name: 'cocktail1',
        glass: 'glassType',
        category: 'Before Dinner Cocktail',
        ingredients: [
          {unit: 'cl', amount: 5, ingredientName: 'ingredient1'},
          {unit: 'cl', amount: 10, ingredientName: 'ingredient2'}
        ],
        garnish: 'garnish',
        preparation: 'preparation instruction',
        owner: {
          _id: bartender._id,
          username: bartender.username,
          avatar: bartender.avatar
        }       
      },
      {
        name: 'cocktail2',
        glass: 'glassType',
        category: 'Before Dinner Cocktail',
        ingredients: [
          {unit: 'cl', amount: 5, ingredientName: 'ingredient1'},
          {unit: 'cl', amount: 10, ingredientName: 'ingredient2'}
        ],
        garnish: 'garnish',
        preparation: 'preparation instruction',
        owner: {
          _id: bartender._id,
          username: bartender.username,
          avatar: bartender.avatar
        }      
      }
    ];
  });
  afterEach(async () => {
    server.close();
    await Bartender.deleteMany({});
    await Cocktail.deleteMany({});
  });
  describe("GET /", () => {

    it("Should return the list with all cocktails", async () => {
      await Cocktail.insertMany(cocktailsList);
      const res = await request(server).get('/api/cocktails');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some(c => c.name ==='cocktail1')).toBeTruthy();
      expect(res.body.some(c => c.name ==='cocktail2')).toBeTruthy();
    });
  });
  describe("GET /:id", () => {
    it("Should return 404 if invalid cocktail id is sent", async () => {
      const res = await request(server).get('/api/cocktails/' + '1');
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch('Invalid id');
    });
    it("Should return 404 if no cocktail is found", async () => {
      const res = await request(server).get('/api/cocktails/' + new mongoose.Types.ObjectId());
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch('No cocktail with this id');
    });
    it("Should return 404 if no cocktail is found", async () => {
      const cocktail = await new Cocktail(cocktailsList[0]).save();
      const res = await request(server).get('/api/cocktails/' + cocktail._id);
      expect(res.status).toBe(200);
      expect(res.body.currentCocktail).toHaveProperty('name', 'cocktail1');
    });
  });
  describe("POST /", () => {
    let payload;
    beforeEach(() => {
      payload = cocktailsList[0];
      payload.owner = undefined;
    });
    async function exec(tokenArg, cocktail) {
      return request(server)
      .post('/api/cocktails')
      .set('x-auth-token', tokenArg)
      .send(cocktail)
    };
    it("Should return 401 if no token is sent", async () => {
      let noToken = '';
      const res = await exec(noToken, payload);
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('Access denied');
    });
    it("Should return 401 if creator has customer rol", async () => {
      let customerToken = new Customer().generateToken();
      const res = await exec(customerToken, payload);
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('bartender can create');
    });
    it("Should return 401 if creator has restaurant rol", async () => {
      let restaurantToken = new Restaurant().generateToken();
      const res = await exec(restaurantToken, payload);
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('Only a bartender can create');
    });
    it("Should return 400 if cocktail name is shorter than 2", async () => {
      payload.name = "a";
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"name" length must be at least 2');
    });
    it("Should return 400 if cocktail name is larger than 255", async () => {
      payload.name = new Array(257).join("a");
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"name" length must be less than or equal to 255');
    });
    it("Should return 400 if cocktail name is missing", async () => {
      payload.name = '';
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"name" is not allowed to be empty');
    });
    it("Should return 400 if cocktail name is not unique", async () => {
      await new Cocktail(cocktailsList[1]).save();
      payload.name = 'cocktail2';
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('already in use');
    });
    it("Should return 400 if cocktail glass is shorter than 2", async () => {
      payload.glass = "a";
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"glass" length must be at least 2');
    });
    it("Should return 400 if cocktail glass is larger than 255", async () => {
      payload.glass = new Array(257).join("a");
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"glass" length must be less than or equal to 255');
    });
    it("Should return 400 if cocktail glass is missing", async () => {
      payload.glass = '';
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"glass" is not allowed to be empty');
    });
    it("Should return 400 if cocktail category is not: 'Before Dinner Cocktail', 'After Dinner Cocktail', 'All Day Cocktail', 'Sparkling Cocktail', 'Hot Drink'", async () => {
      payload.category = "invalid category";
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"category" must be one of');
    });
    it("Should return 400 if cocktail ingredients are missing", async () => {
      payload.ingredients = [];
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('must contain at least 2 items');
    });
    it("Should return 400 if cocktail ingredients has just 1 item", async () => {
      payload.ingredients = [{unit: 'cl', amount: 5, ingredientName: 'ingredient1'}];
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('must contain at least 2 items');
    });
    it("Should return 400 if cocktail  ingredientName is less than 2", async () => {
      payload.ingredients[0].ingredientName = 'a';
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('length must be at least 2');
    });
    it("Should return 400 if cocktail ingredientName is larger than 255", async () => {
      payload.ingredients[0].ingredientName = new Array(257).join("a");
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('length must be less than or equal to 255');
    });
    it("Should return 400 if ingredient unit is not 'cl', 'bar spoon', 'dashes', 'cube', 'other'", async () => {
      payload.ingredients[0].unit = 'invalid';
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('must be one of');
    });
    it("Should return 400 if ingredient unit is missing", async () => {
      payload.ingredients[0].unit = '';
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('not allowed to be empty');
    });
    it("Should return 400 if ingredient amount is less than 0", async () => {
      payload.ingredients[0].amount = -5;
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(' must be larger than or equal to 0');
    });
    it("Should return 400 if ingredient amount is missing", async () => {
      payload.ingredients[0].amount = null;
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('must be a number');
    });
    it("Should return 400 if cocktail garnish is shorter than 2", async () => {
      payload.garnish = "a";
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"garnish" length must be at least 2');
    });
    it("Should return 400 if cocktail garnish is larger than 255", async () => {
      payload.garnish = new Array(257).join("a");
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"garnish" length must be less than or equal to 255');
    });
    it("Should return 400 if cocktail garnish is missing", async () => {
      payload.garnish = '';
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"garnish" is not allowed to be empty');
    });
    it("Should return 400 if cocktail preparation is shorter than 10", async () => {
      payload.preparation = new Array(10).join("a");
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"preparation" length must be at least 10');
    });
    it("Should return 400 if cocktail preparation is larger than 1024", async () => {
      payload.preparation = new Array(1026).join("a");
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"preparation" length must be less than or equal to 1024');
    });
    it("Should return 400 if cocktail preparation is missing", async () => {
      payload.preparation = '';
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"preparation" is not allowed to be empty');
    });
    it("Should return 200 if cocktail is valid", async () => {
      const res = await exec(token, payload);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'cocktail1');
      expect(res.body.owner).toHaveProperty('_id', bartender._id.toString());
    });

    // MISSING ONE TEST. TEST IF COCKTAIL IS ALSO SAVED IN BARTENDER'S PERSONAL COCKTAILS
  });
  describe('PUT /:id', () => {
    let payload;
    let cocktail;
    beforeEach(async () => {
      cocktail = await Cocktail.create(cocktailsList[0]);
      payload = cocktailsList[0];
      payload.owner = undefined;
    });
    async function exec(tokenArg, cocktailArg) {
      return request(server)
      .put('/api/cocktails/' + cocktail._id)
      .set('x-auth-token', tokenArg)
      .send(cocktailArg)
    };
    it("Should return 401 if no token is provided", async () => {
      const res = await request(server)
      .put('/api/cocktails/' + cocktail._id)
      .send(payload);
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('Access denied');
    });
    it("Should return 400 if bad token is provided", async () => {
      const res = await exec('a', payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('Invalid token');
    });
    it("Should return 404 if bad cocktail id is provided", async () => {
      const res = await request(server)
      .put('/api/cocktails/1')
      .set('x-auth-token', token)
      .send(payload);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch('Invalid id');
    });
    it("Should return 401 if other that owner try to edit the cocktail", async () => {
      const anotherBartender = await new Bartender({
        username: "bartenderTest2",
        email: "bartenderTest2@gmail.com",
        password: "123456",
        personalInfo: {
          firstName: "firstNameTest2",
          lastName: "lastNameTest2",
          phone: "654321",
          description: "this is test description for bartenderTest2"
        }
      }).save();
      const anotherToken = anotherBartender.generateToken();
      const res = await exec(anotherToken, payload);
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('You are not authorized to edit this cocktail')
    });
    it("Should return 400 if invalid payload is sent", async () => {
      payload.name = 'a';
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"name" length must be at least 2')
    });
    it("Should return 200 if valid cocktail is sent to be updated", async () => {
      payload.name = 'updated name';
      const res = await exec(token, payload);
      const updatedCocktail = await Cocktail.find({name: 'updated name'});
      expect(res.status).toBe(200);
      expect(res.body.nModified).toBe(1);
      expect(updatedCocktail.length).toBe(1);
    });
  });
  describe("PUT /:id/set-image", () => {
    let payload;
    let cocktail;
    beforeEach(async () => {
      payload = {
        imgName: 'image name',
        imgPath : 'image path'
      };
      cocktail = await Cocktail.create(cocktailsList[0])
    });
    function exec(tokenArg, payloadArg) {
      return request(server)
      .put(`/api/cocktails/${cocktail._id}/set-image`)
      .set('x-auth-token', tokenArg)
      .send(payloadArg)
    };
    it("Should return 401 if no token is provided", async () => {
      const res = await request(server).put(`/api/cocktails/${cocktail._id}/set-image`).send(payload);
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('No token provided');
    });
    it("Should return 400 if bad token is provided", async () => {
      const res = await exec('a', payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('Invalid token provided');
    });
    it("Should return 404 if bad cocktail id is provided", async () => {
      const res = await request(server)
      .put(`/api/cocktails/${1}/set-image`)
      .set('x-auth-token', token)
      .send(payload);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch('Invalid id provided');
    });
    it("Should return 404 if no cocktail is is found with the given id", async () => {
      const res = await request(server)
      .put(`/api/cocktails/${new mongoose.Types.ObjectId()}/set-image`)
      .set('x-auth-token', token)
      .send(payload);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch('No cocktail with this id');
    });
    it("Should return 400 if photo name is not sent", async () => {
      payload.imgName = '';
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"imgName" is not allowed to be empty');
    });
    it("Should return 400 if photo path is not sent", async () => {
      payload.imgPath = '';
      const res = await exec(token, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"imgPath" is not allowed to be empty');
    });
    it("Should return 200 if valid image is sent", async () => {
      const res = await exec(token, payload);
      const updatedCocktail = await Cocktail.findById(cocktail._id);
      expect(res.status).toBe(200);
      expect(updatedCocktail.image).toHaveProperty('imgName', 'image name')
    });
  });
  describe("DELETE /api/cocktails/:id", () => {
    let cocktail;
    beforeEach(async () => {
      cocktail = await Cocktail.create(cocktailsList[0]);
    });
    it("Should return 401 if no token is sent", async () => {
      const res = await request(server).delete('/api/cocktails/' + cocktail._id);
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('No token provided');
    });
    it("Should return 404 if bad cocktail id sent", async () => {
      const res = await request(server)
      .delete('/api/cocktails/' + '1')
      .set('x-auth-token', token);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch('Invalid id provided');
    });
    it("Should return 404 if no cocktail is found with the given id", async () => {
      const res = await request(server)
      .delete('/api/cocktails/' + new mongoose.Types.ObjectId())
      .set('x-auth-token', token);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch('No cocktail with this id');
    });
    it("Should return 401 if the current bartender is not the owner", async () => {
      const anotherBartender = await new Bartender({
        username: "bartenderTest2",
        email: "bartenderTest2@gmail.com",
        password: "123456",
        personalInfo: {
          firstName: "firstNameTest2",
          lastName: "lastNameTest2",
          phone: "654321",
          description: "this is test description for bartenderTest2"
        }
      }).save();
      const anotherToken = anotherBartender.generateToken();
      const res = await request(server)
      .delete('/api/cocktails/' + cocktail._id)
      .set('x-auth-token', anotherToken);
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('not authorized');
    });
    it("Should return 200 and remove the cocktail if correct request is sent", async () => {
      // const res = await request(server)
      // .delete('/api/cocktails/' + cocktail._id)
      // .set('x-auth-token', token);
      // expect(res.status).toBe(200);
      const currentBartender = await Bartender.findById(bartender._id);
      expect(currentBartender.personalCocktails.length).toBe(1)
    });
  });
});