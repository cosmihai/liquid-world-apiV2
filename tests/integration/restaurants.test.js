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
  let payload;

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
      restaurantsList[0].password = undefined;
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
    it("Should return 400 if city is shorter than 2", async () => {
      restaurantsList[0].address.city = 'a';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"city" length must be at least 2');
    });
    it("Should return 400 if city is larger than 255", async () => {
      restaurantsList[0].address.city = new Array(257).join('a');
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"city" length must be less than or equal to 255');
    });
    it("Should return 400 if city is missing", async () => {
      restaurantsList[0].address.city = '';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"city" is not allowed to be empty');
    }); 
    it("Should return 400 if country is shorter than 2", async () => {
      restaurantsList[0].address.country = 'a';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"country" length must be at least 2');
    });
    it("Should return 400 if country is larger than 255", async () => {
      restaurantsList[0].address.country = new Array(257).join('a');
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"country" length must be less than or equal to 255');
    });
    it("Should return 400 if country is missing", async () => {
      restaurantsList[0].address.country = '';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"country" is not allowed to be empty');
    }); 
    it("Should return 400 if phone is shorter than 6", async () => {
      restaurantsList[0].phone = '1';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"phone" length must be at least 6');
    });
    it("Should return 400 if phone is larger than 50", async () => {
      restaurantsList[0].phone = new Array(57).join('1');
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"phone" length must be less than or equal to 50');
    });
    it("Should return 400 if phone is invalid", async () => {
      restaurantsList[0].phone = '12345a';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('fails to match the required pattern');
    });
    it("Should return 400 if phone is missing", async () => {
      restaurantsList[0].phone = '';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"phone" is not allowed to be empty');
    }); 
    it("Should return 400 if capacity is missing", async () => {
      restaurantsList[0].capacity = undefined;
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"capacity" is required');
    }); 
    it("Should return 400 if capacity is a negative number", async () => {
      restaurantsList[0].capacity = -1;
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"capacity" must be larger than or equal to 0');
    }); 
    it("Should return 400 if cuisine is shorter than 4", async () => {
      restaurantsList[0].cuisine = 'abc';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"cuisine" length must be at least 4');
    });
    it("Should return 400 if cuisine is larger than 255", async () => {
      restaurantsList[0].cuisine = new Array(257).join('a');
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"cuisine" length must be less than or equal to 255');
    });
    it("Should return 400 if cuisine is missing", async () => {
      restaurantsList[0].cuisine = '';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"cuisine" is not allowed to be empty');
    }); 
    it("Should return 400 if email is already in use", async () => {
      await Restaurant.create(restaurantsList[1]);
      restaurantsList[0].email = restaurantsList[1].email;
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('already in use')
    });
    it("Should return 200 if valid restaurant object is sent", async () => {
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', restaurantsList[0].name)
    });
  });
  
  describe("PUT /me", () => {
    beforeEach(async () => {
      restaurant = await Restaurant.create(restaurantsList[0]);
      token = restaurant.generateToken();
    });
    function exec(payload) {
      return request(server)
      .put('/api/restaurants/me')
      .set('x-auth-token', token)
      .send(payload);
    };
    it("Should return 401 if no token is provided", async () => {
      const res = await request(server).get('/api/restaurants/me');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('No token provided');
    });
    it("Should return 400 if bad token is provided", async () => {
      const res = await request(server)
      .get('/api/restaurants/me')
      .set('x-auth-token', 'a');
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('Invalid token provided');
    });
    it("Should return 400 if invalid restaurant object is sent", async () => {
      restaurantsList[0].password = undefined;
      restaurantsList[0].name = 'a';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('must be at least 2');
    });
    it("Should return 400 if the sent object contain password ", async () => {
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"Password" is not allowed');
    });
    it("Should return 200 if valid updated restaurant object is sent", async () => {
      restaurantsList[0].password = undefined;
      restaurantsList[0].name = 'updated name';
      const res = await exec(restaurantsList[0]);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'updated name');
    });
  });
  describe("PUT /me/change-password", () => {
    beforeEach(async () => {
      restaurant = await Restaurant.create(restaurantsList[0]);
      token = restaurant.generateToken();
    });
    function exec(payload) {
      return request(server)
      .put('/api/restaurants/me/change-password')
      .set('x-auth-token', token)
      .send(payload)
    };
    it("Should return 401 if no token is provided", async () => {
      const res = await request(server).put('/api/restaurants/me/change-password');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('No token provided');
    });
    it("Should return 400 if bad token is provided", async () => {
      const res = await request(server)
      .put('/api/restaurants/me/change-password')
      .set('x-auth-token', 'a');
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('Invalid token provided');
    });
    it("Should return 400 if new password is not a string", async () => {
      const res = await exec({password: 123456});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"password" must be a string');
    });
    it("Should return 400 if new password is shorter than 6", async () => {
      const res = await exec({password: '12345'});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"password" length must be at least 6');
    });
    it("Should return 400 if new password is larger than 255", async () => {
      const res = await exec({password: new Array(257).join('a')});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"password" length must be less than or equal to 255');
    });
    it("Should return 400 if new password is missing", async () => {
      const res = await exec({});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"password" is required');
    });
    it("Should return 400 if new password is the same as before", async () => {
      const res = await exec({password: '123456'});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('Can not set the same');
    });
    it("Should return 200 if new password is valid", async () => {
      const res = await exec({password: '1234567'});
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch('Password changed');
    });
  });
  describe("PUT /me/add-photo", () => {
    beforeEach(async () => {
      restaurant = await Restaurant.create(restaurantsList[0]);
      token = restaurant.generateToken();
      payload = {
        imgName: "name",
        imgPath: "path"
      };
    });
    function exec(payload) {
      return request(server)
      .put('/api/restaurants/me/add-photo')
      .set('x-auth-token', token)
      .send(payload);
    };
    it("Should return 401 if no token is provided", async () => {
      const res = await request(server).put('/api/restaurants/me/add-photo');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('No token provided');
    });
    it("Should return 400 if bad token is provided", async () => {
      const res = await request(server)
      .put('/api/restaurants/me/add-photo')
      .set('x-auth-token', 'a');
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('Invalid token provided');
    });
    it("Should return 400 if imgPath is not a string", async () => {
      payload.imgPath = 1;
      const res = await exec(payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"imgPath" must be a string');
    });
    it("Should return 400 if imgPath is missing", async () => {
      payload.imgPath = "";
      const res = await exec(payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"imgPath" is not allowed to be empty');
    });
    it("Should return 400 if imgName is not a string", async () => {
      payload.imgName = 1;
      const res = await exec(payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"imgName" must be a string');
    });
    it("Should return 400 if imgName is missing", async () => {
      payload.imgName = "";
      const res = await exec(payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"imgName" is not allowed to be empty');
    });
    it("Should return 200 if imgName and imgPath are valid", async () => {
      const res = await exec(payload);
      expect(res.status).toBe(200);
      expect(res.body.nModified).toBe(1);
    });
  });
  describe("DELETE /me/remove-photo/:id", () => {
    beforeEach(async () => {
      restaurant = await Restaurant.create(restaurantsList[0]);
      token = restaurant.generateToken();
    });
    it("Should return 401 if no token is provided", async () => {
      const res = await request(server).delete('/api/restaurants/me/remove-photo/1');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('No token provided');
    });
    it("Should return 400 if bad token is provided", async () => {
      const res = await request(server)
      .delete('/api/restaurants/me/remove-photo/1')
      .set('x-auth-token', 'a');
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('Invalid token provided');
    });
    it("Should return 404 if bad photo id is sent", async () => {
      const res = await request(server)
      .delete('/api/restaurants/me/remove-photo/1')
      .set('x-auth-token', token);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch('Invalid id provided');
    });
    it("Should return 404 if no photo is found with the given id", async () => {
      const res = await request(server)
      .delete('/api/restaurants/me/remove-photo/' + new mongoose.Types.ObjectId())
      .set('x-auth-token', token);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch('No image with this id');
    });
    it("Should return 200 if photo was deleted", async () => {
      await request(server)
      .put('/api/restaurants/me/add-photo')
      .set('x-auth-token', token)
      .send({imgName: "name", imgPath: "path"});
      const updatedRestaurant = await Restaurant.findById(restaurant._id);
      const photoId = updatedRestaurant.images[0]._id;
      const res = await request(server)
      .delete('/api/restaurants/me/remove-photo/' + photoId)
      .set('x-auth-token', token);
      expect(res.status).toBe(200);
      expect(res.body.nModified).toBe(1);
    });
  });
  describe("DELETE /me", () => {
    beforeEach(async () => {
      restaurant = await Restaurant.create(restaurantsList[0]);
      token = restaurant.generateToken();
    });
    it("Should return 401 if no token is provided", async () => {
      const res = await request(server).delete('/api/restaurants/me/');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('No token provided');
    });
    it("Should return 400 if bad token is provided", async () => {
      const res = await request(server)
      .delete('/api/restaurants/me/')
      .set('x-auth-token', 'a');
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('Invalid token provided');
    });
    it("Should return 200 if restaurant user was deleted from DB", async () => {
      const res = await request(server)
      .delete('/api/restaurants/me/')
      .set('x-auth-token', token);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch('The "restaurantTest1" user was successfully removed from DB');
    });
  });
});
