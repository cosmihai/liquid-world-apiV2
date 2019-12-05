const { Cocktail } = require('../../models/cocktail');
const { Bartender } = require('../../models/bartender');
const { Customer } = require('../../models/customer');
const { Restaurant } = require('../../models/restaurant');
const mongoose = require('mongoose');
const request = require('supertest');
let server;

describe("/api/customers", () => {
  let cocktail;
  let bartender;
  let restaurant;
  let customersList;

  beforeEach(async () => {
    server = require('../../app');
    customersList = [
      {
        username: 'customer1',
        email: 'customer1@gmail.com',
        password: '123456'
      },
      {
        username: 'customer2',
        email: 'customer2@gmail.com',
        password: '123456'
      }
    ]
  });
  afterEach(async () => {
    await Customer.deleteMany();
    await Bartender.deleteMany();
    await Cocktail.deleteMany();
    await Restaurant.deleteMany();
    server.close();
  });
  describe("GET /", () => {
    it("Should return a list with 2 customers", async () => {
      await Customer.insertMany(customersList);
      const res = await request(server).get('/api/customers');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some((c) => c.username === 'customer1')).toBeTruthy();
      expect(res.body.some((c) => c.username === 'customer2')).toBeTruthy();
    });
  });
});