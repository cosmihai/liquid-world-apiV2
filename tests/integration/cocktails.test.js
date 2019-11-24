const { Cocktail } = require('../../models/cocktail');
const { Bartender } = require('../../models/bartender');
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
    await Cocktail.deleteMany({});
    await Bartender.deleteMany({});
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
});