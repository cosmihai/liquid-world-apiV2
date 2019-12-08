const bcrypt = require("bcrypt");
const { Restaurant } = require("../../models/restaurant");
const { Customer } = require("../../models/customer");
const { Bartender } = require("../../models/bartender");
const mongoose = require("mongoose");
const request = require("supertest");
let server;

describe("/api/restaurants", () => {
  let restaurantsList;
  let restaurant;
  let customer;
  let bartender;
  let token;

  beforeEach(async () => {
    server = require("../../app");
    restaurantsList = [
      {
        name: "restaurantTest1",
        email: "restaurantTest1@gmail.com",
        password: bcrypt.hashSync("123456", bcrypt.genSaltSync(10)),
        address: {
          street: "main st.",
          number: "00",
          city: "City",
          country: "Country"
        },
        phone: "000000",
        description: "test description for restaurantTest1",
        capacity: 100,
        cuisine: "test cuisine"
      },
      {
        name: "restaurantTest2",
        email: "restaurantTest2@gmail.com",
        password: bcrypt.hashSync("123456", bcrypt.genSaltSync(10)),
        address: {
          street: "main st.",
          number: "00",
          city: "City",
          country: "Country"
        },
        phone: "000000",
        description: "test description for restaurantTest2",
        capacity: 100,
        cuisine: "test cuisine"
      }
    ];
  });
  afterEach(async () => {
    await Customer.deleteMany();
    await Restaurant.deleteMany();
    await Bartender.deleteMany();
    server.close();
  });
  describe("GET /", () => {
    it("Should return a list with all restaurants", async () => {
      await Restaurant.insertMany(restaurantsList);
      const res = await request(server).get('/api/restaurants');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some(r => r.name === "restaurantTest1")).toBeTruthy();
      expect(res.body.some(r => r.name === "restaurantTest2")).toBeTruthy();
    });
  });
  describe("GET /:id", () => {
    it("Should return 404 if invalid restaurant id is sent", async () => {
      const res = await request(server).get('/api/restaurants/1');
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch('Invalid id provided')
    });
    it("Should return 404 if no restaurant is found with the provided id", async () => {
      const res = await request(server).get('/api/restaurants/' + new mongoose.Types.ObjectId());
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch('No restaurant with this id')
    });
    it("Should return 200 if valid restaurant id is sent", async () => {
      restaurant = await Restaurant.create(restaurantsList[0]);
      const res = await request(server).get('/api/restaurants/' + restaurant._id);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'restaurantTest1')
    });
  });
  describe("GET /me", () => {
    it("Should return 401 if no token is provided", async () => {
      const res = await request(server).get('/api/restaurants/me');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('No token provided')
    });
    it("Should return 400 if bad token is provided", async () => {
      const res = await request(server)
      .get('/api/restaurants/me')
      .set('x-auth-token', 'a');
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('Invalid token provided')
    });
    it("Should return 200 if valid token is provided", async () => {
      restaurant = await Restaurant.create(restaurantsList[0]);
      token = restaurant.generateToken();
      const res = await request(server)
      .get('/api/restaurants/me')
      .set('x-auth-token', token);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'restaurantTest1')
    });
  });
  describe("PUT /:id/rate", () => {
    beforeEach(async () => {
      restaurant = await Restaurant.create(restaurantsList[0]);
      customer = await Customer.create({
        username: 'customerTest1',
        email: 'customerTest1@gmail.com',
        password: bcrypt.hashSync('123456', bcrypt.genSaltSync(10))
      });
      token = customer.generateToken();
    });
    function exec(tokenArg, rateArg) {
      return request(server)
      .put(`/api/restaurants/${restaurant._id}/rate`)
      .set('x-auth-token', tokenArg)
      .send(rateArg)
    };
    it("Should return 401 if no token is provided", async () => {
      const res = await request(server).put(`/api/restaurants/${restaurant._id}/rate`);
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('No token provided')
    });
    it("Should return 401 if logged in user is 'bartender'", async () => {
      bartender = await Bartender.create({
        username: "bartenderTest1",
        email: "bartenderTest1@gmail.com",
        password: bcrypt.hashSync('123456', bcrypt.genSaltSync(10)),
        personalInfo: {
          firstName: "firstNameTest1",
          lastName: "lastNameTest1",
          phone: "654321",
          description: "this is test description for bartenderTest1"
        }
      });
      const bartenderToken = bartender.generateToken();
      const res = await exec(bartenderToken, {rate: 5});
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('Only customer users can rate restaurants');
    });
    it("Should return 401 if logged in user is 'restaurant'", async () => {
      const restaurantToken = restaurant.generateToken();
      const res = await exec(restaurantToken, {rate: 5});
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('Only customer users can rate restaurants');
    });
    it("Should return 404 if invalid restaurant id is sent", async () => {
      const res = await request(server)
      .put('/api/restaurants/1/rate')
      .set('x-auth-token', token)
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch('Invalid id provided');
    });
    it("Should return 400 if rate is less than 1", async () => {
      const res = await exec(token, {rate: 0});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('must be a number between 1 and 5');
    });
    it("Should return 400 if rate is greater than 5", async () => {
      const res = await exec(token, {rate: 6});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('must be a number between 1 and 5');
    });
    it("Should return the restaurant rate", async () => {
      const res = await exec(token, {rate: 5});
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('votes', 1);
      expect(res.body).toHaveProperty('stars', 5);
    });
    it("Should return the restaurant new rate if already rated before", async () => {
      const customer2 = await Customer.create({
        username: 'customerTest2',
        email: 'customerTest2@gmail.com',
        password: bcrypt.hashSync('123456', bcrypt.genSaltSync(10))
      });
      const token2 = customer2.generateToken();
      await exec(token2, {rate: 2});
      await exec(token, {rate: 5});
      const res = await exec(token, {rate: 3});
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('votes', 2);
      expect(res.body).toHaveProperty('stars', 2.5);
    });
  });
  describe("POST /", () => {
    function exec(payload) {
      return request(server)
      .post('/api/restaurants')
      .send(payload)
    };
    it("Should return 400 if name is shorter than 2", async () => {
      restaurantsList[0].name = 'a';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"name" length must be at least 2');
    });
    it("Should return 400 if name is larger than 255", async () => {
      restaurantsList[0].name = new Array(257).join('a');
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"name" length must be less than or equal to 255');
    });
    it("Should return 400 if name is missing", async () => {
      restaurantsList[0].name = '';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"name" is not allowed to be empty');
    }); 
    it("Should return 400 if email is shorter than 6", async () => {
      restaurantsList[0].email = 'a@a.a';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"email" length must be at least 6');
    });
    it("Should return 400 if email is larger than 255", async () => {
      restaurantsList[0].email = new Array(253).join('a') + '@a.a';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"email" length must be less than or equal to 255');
    });
    it("Should return 400 if email is missing", async () => {
      restaurantsList[0].email = '';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"email" is not allowed to be empty');
    }); 
    it("Should return 400 if email is not valid", async () => {
      restaurantsList[0].email = 'invalid_email';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"email" must be a valid email');
    }); 
    it("Should return 400 if password is shorter than 6", async () => {
      restaurantsList[0].password = 'a';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"password" length must be at least 6');
    });
    it("Should return 400 if password is larger than 255", async () => {
      restaurantsList[0].password = new Array(257).join('a');
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"password" length must be less than or equal to 255');
    });
    it("Should return 400 if password is missing", async () => {
      restaurantsList[0].password = '';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"Password" is required');
    }); 
    it("Should return 400 if address is missing", async () => {
      restaurantsList[0].address = '';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"address" must be an object');
    }); 
    it("Should return 400 if street is shorter than 2", async () => {
      restaurantsList[0].address.street = 'a';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"street" length must be at least 2');
    });
    it("Should return 400 if street is larger than 255", async () => {
      restaurantsList[0].address.street = new Array(257).join('a');
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"street" length must be less than or equal to 255');
    });
    it("Should return 400 if street is missing", async () => {
      restaurantsList[0].address.street = '';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"street" is not allowed to be empty');
    }); 
    it("Should return 400 if street number is shorter than 1", async () => {
      restaurantsList[0].address.number = '';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"number" is not allowed to be empty');
    });
    it("Should return 400 if street number is larger than 255", async () => {
      restaurantsList[0].address.number = new Array(257).join('1');
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"number" length must be less than or equal to 255');
    });
    it("Should return 400 if street number is missing", async () => {
      restaurantsList[0].address.number = undefined;
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"number" is required');
    }); 
  });
});
