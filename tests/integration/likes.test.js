const { Cocktail } = require('../../models/cocktail');
const { Bartender } = require('../../models/bartender');
const { Customer } = require('../../models/customer');
const { Like } = require('../../models/like');
const { Restaurant } = require('../../models/restaurant');
const mongoose = require('mongoose');
const request = require("supertest");
let server;

describe("/api/likes", () => {
  let customer;
  let bartender;
  let customerToken;
  let cocktail;
  beforeEach(async () => {
    server = require('../../app');
    customer = await Customer.create({
      username: 'customerTest1',
      email: 'customerTest1@gmail.com',
      password: '123456'
    });
    customerToken = customer.generateToken();
    bartender = await Bartender.create({
      username: "bartenderTest1",
      email: "bartenderTest1@gmail.com",
      password: '123456',
      personalInfo: {
        firstName: "firstNameTest1",
        lastName: "lastNameTest1",
        phone: "654321",
        description: "this is test description for bartenderTest1"
      }
    });
    cocktail = await Cocktail.create({
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
    })
  });
  afterEach(async () => {
    await Cocktail.deleteMany({});
    await Bartender.deleteMany({});
    await Customer.deleteMany({});
    await Like.deleteMany({});
    server.close();
  });
  function exec(token, payload) {
    return request(server)
    .post('/api/likes')
    .set('x-auth-token', token)
    .send(payload)
  };
  describe("POST /", () => {
    it("Should return 401 if no token is provided", async () => {
      const res = await exec('', {cocktailId: cocktail._id});
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('No token provided');
    });
    it("Should return 400 if bad token is provided", async () => {
      const res = await exec('bad token', {cocktailId: cocktail._id});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('Invalid token provided');
    });
    it("Should return 401 if logged user has restaurant role", async () => {
      const res = await exec(new Restaurant().generateToken(), {cocktailId: cocktail._id});
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('Only customers can give like');
    });
    it("Should return 401 if logged user has bartender role", async () => {
      const res = await exec(new Bartender().generateToken(), {cocktailId: cocktail._id});
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('Only customers can give like');
    });
    it("Should return 400 if invalid cocktail id is sent", async () => {
      const res = await exec(customerToken, {cocktailId: 'invalidId'});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('fails to match the required pattern');
    });
    it("Should return 404 if no cocktail is found with the given id", async () => {
      const res = await exec(customerToken, {cocktailId: new mongoose.Types.ObjectId()});
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch('No cocktail with this id');
    });
    it("Should return 400 if already liked this cocktail", async () => {
      await exec(customerToken, {cocktailId: cocktail._id});
      const res = await exec(customerToken, {cocktailId: cocktail._id});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('You already like this cocktail');
    });
    it("Should return 200 when customer hit like on a cocktail", async () => {
      const res = await exec(customerToken, {cocktailId: cocktail._id});
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('customerId', customer._id.toString());
      expect(res.body).toHaveProperty('cocktailId', cocktail._id.toString());
    });
    it("Should update the rating of the owner of the cocktail", async () => {
      await exec(customerToken, {cocktailId: cocktail._id});
      bartender = await Bartender.findById(bartender._id);
      expect(bartender.raiting).toBe(1)
    });
    it("Should update the number of likes of this cocktail", async () => {
      await exec(customerToken, {cocktailId: cocktail._id});
      cocktail = await Cocktail.findById(cocktail._id);
      expect(cocktail.likes.length).toBe(1);
      expect(cocktail.likes[0]).toHaveProperty('customerId', customer._id);
    });
    it("Should add this cocktail to customer's fav cocktails list", async () => {
      await exec(customerToken, {cocktailId: cocktail._id});
      customer = await Customer.findById(customer._id);
      expect(customer.favCocktails.length).toBe(1);
      expect(customer.favCocktails[0].toString()).toMatch(cocktail._id.toString());
    });
  });
  describe("DELETE /", () => {
    beforeEach(async () => {
      await exec(customerToken, {cocktailId: cocktail._id})
    });
    function execDel(token, payload) {
      return request(server)
      .delete('/api/likes')
      .set('x-auth-token', token)
      .send(payload)
    };
    it("Should return 401 if no token is provided", async () => {
      const res = await execDel('', {cocktailId: cocktail._id});
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('No token provided');
    });
    it("Should return 400 if bad token is provided", async () => {
      const res = await execDel('bad token', {cocktailId: cocktail._id});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('Invalid token provided');
    });
    it("Should return 401 if logged user has restaurant role", async () => {
      const res = await execDel(new Restaurant().generateToken(), {cocktailId: cocktail._id});
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('Only customers can access this resource');
    });
    it("Should return 401 if logged user has bartender role", async () => {
      const res = await execDel(new Bartender().generateToken(), {cocktailId: cocktail._id});
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('Only customers can access this resource');
    });
    it("Should return 400 if invalid cocktail id is sent", async () => {
      const res = await execDel(customerToken, {cocktailId: 'invalidId'});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('fails to match the required pattern');
    });
    it("Should return 404 if no cocktail is found with the given id", async () => {
      const res = await execDel(customerToken, {cocktailId: new mongoose.Types.ObjectId()});
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch('No cocktail with this id');
    });
    it("Should return 400 if the cocktail is not in fav cocktails list", async () => {
      const cocktail2 = await Cocktail.create({
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
      });
      const res = await execDel(customerToken, {cocktailId: cocktail2._id});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('This cocktail is not in your favorite list');
    });
    it("Should remove the like from the DB", async () => {
      const res = await execDel(customerToken, {cocktailId: cocktail._id});
      const likesList = await Like.find({});
      expect(likesList.length).toBe(0);
      expect(res.body.message).toMatch('is no longer in your favorite list')
    });
    it("Should remove the cocktail from customer's fav cocktails list", async () => {
      await execDel(customerToken, {cocktailId: cocktail._id});
      customer = await Customer.findById(customer._id);
      expect(customer.favCocktails.length).toBe(0);
    });
    it("Should update the bartender's raiting", async () => {
      await execDel(customerToken, {cocktailId: cocktail._id});
      bartender = await Bartender.findById(bartender._id);
      expect(bartender.raiting).toBe(0);
    });

  });
  describe("GET /", () => {
    it("Should return a list with all likes", async () => {
      await exec(customerToken, {cocktailId: cocktail._id});
      const res = await request(server).get('/api/likes');
      expect(res.status).toBe(200)
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty('customerId', customer._id.toString());
      expect(res.body[0]).toHaveProperty('cocktailId', cocktail._id.toString());
    });
  });
});