const bcrypt = require("bcrypt");
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
  let customer;
  let token;

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
  describe("GET /:id", () => {
    it("Should return 404 if invalid customer id is sent", async () => {
      const res = await request(server).get('/api/customers/1');
      expect(res.status).toBe(404)
      expect(res.body.message).toMatch('Invalid id')
    });
    it("Should return 404 if no customer is found with the provided id", async () => {
      const res = await request(server).get('/api/customers/' + new mongoose.Types.ObjectId());
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch('No customer with this id');
    });
    it("Should return 200 if valid id is provided", async () => {
      customer = await Customer.create(customersList[0]);
      const res = await request(server).get('/api/customers/' + customer._id);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('username', 'customer1');
    });
  });
  describe("GET /me", () => {
    it("Should return 401 if no token is provided", async () => {
      const res = await request(server).get('/api/customers/me');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('Access denied');
    });
    it("Should return 400 if bad token is provided", async () => {
      const res = await request(server)
      .get('/api/customers/me')
      .set('x-auth-token', 'a');
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('Invalid token provided');
    });
    it("Should return the logged in customer if valid token is sent", async () => {
      customer = await Customer.create(customersList[0]);
      token = customer.generateToken();
      const res = await request(server)
      .get('/api/customers/me')
      .set('x-auth-token', token);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('username', 'customer1');
    });
  });
  describe("POST /", () => {
    beforeEach(() => {
      customer = customersList[0];
    });
    function exec(payload) {
      return request(server)
      .post('/api/customers')
      .send(payload)
    };
    it("Should return 400 if username is less than 2", async () => {
      customer.username = 'a';
      const res = await exec(customer);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"username" length must be at least 2');
    });
    it("Should return 400 if username is greater than 255", async () => {
      customer.username = new Array(257).join('a');
      const res = await exec(customer);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"username" length must be less than or equal to 255');
    });
    it("Should return 400 if username is missing", async () => {
      customer.username = '';
      const res = await exec(customer);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"username" is not allowed to be empty');
    });
    it("Should return 400 if email is less than 6", async () => {
      customer.email = 'a@a.a';
      const res = await exec(customer);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"email" length must be at least 6');
    });
    it("Should return 400 if email is greater than 255", async () => {
      customer.email = new Array(253).join('a') + '@a.a';
      const res = await exec(customer);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"email" length must be less than or equal to 255');
    });
    it("Should return 400 if email is missing", async () => {
      customer.email = '';
      const res = await exec(customer);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"email" is not allowed to be empty');
    });
    it("Should return 400 if invalid email is sent", async () => {
      customer.email = 'aaaaaa';
      const res = await exec(customer);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"email" must be a valid email');
    });
    it("Should return 400 if duplicate email is sent", async () => {
      await Customer.create(customersList[1]);
      customer.email = 'customer2@gmail.com';
      const res = await exec(customer);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('already in use');
    });
    it("Should return 400 if password is less than 6", async () => {
      customer.password = '12345';
      const res = await exec(customer);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"password" length must be at least 6');
    });
    it("Should return 400 if password is greater than 255", async () => {
      customer.password = new Array(257).join('1');
      const res = await exec(customer);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"password" length must be less than or equal to 255');
    });
    it("Should return 400 if password is missing", async () => {
      customer.password = '';
      const res = await exec(customer);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"password" is not allowed to be empty');
    });
    it("Should return 200 if correct customer object is sent", async () => {
      const res = await exec(customer);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', 'customer1@gmail.com');
    });
  });
  describe("PUT /me", () => {
    beforeEach(async () => {
      customer = await Customer.create(customersList[0]);
      token = customer.generateToken();
    });
    function exec(payload) {
      return request(server)
      .put('/api/customers/me')
      .set('x-auth-token', token)
      .send(payload)
    };
    it("Should return 401 if no token is provided", async () => {
      const res = await request(server).put('/api/customers/me');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('Access denied');
    });
    it("Should return 400 if password is sent in the body of the request", async () => {
      const res = await exec(customersList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"Password" is not allowed');
    });
    it("Should return 400 if invalid updated values are sent", async () => {
      customersList[0].password = undefined;
      customersList[0].email = '';
      const res = await exec(customersList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"email" is not allowed to be empty');
    });
    it("Should return 200 if valid updated values are sent", async () => {
      customersList[0].password = undefined;
      customersList[0].username = 'updated username';
      const res = await exec(customersList[0]);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('username', 'updated username');
    });
  });
  describe("PUT /me/change-password", () => {
    beforeEach(async () => {
      customersList[0].password = bcrypt.hashSync('123456', bcrypt.genSaltSync(10))
      customer = await Customer.create(customersList[0]);
      token = customer.generateToken();
    });
    function exec(payload) {
      return request(server)
      .put('/api/customers/me/change-password')
      .set('x-auth-token', token)
      .send(payload)
    };
    it("Should return 401 if no token is provided", async () => {
      const res = await request(server).put('/api/customers/me');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('Access denied');
    }); 
    it("Should return 400 if new password is less than 6", async () => {
      const res = await exec({password: '12345'});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"password" length must be at least 6');
    });
    it("Should return 400 if new password is greater than 255", async () => {
      const res = await exec({password: new Array(257).join('1')});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"password" length must be less than or equal to 255');
    });
    it("Should return 400 if new password is missing", async () => {
      const res = await exec({password: ''});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"password" is not allowed to be empty');
    });
    it("Should return 400 if new password is the same as before", async () => {
      const res = await exec({password: '123456'});
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('Can not set the same password');
    });
    it("Should return 200 if new password is valid", async () => {
      const res = await exec({password: '1234567'});
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch('Password changed for "customer1" user');
    });
  });
  describe("PUT /me/set-avatar", () => {
    let avatar;
    beforeEach(async () => {
      customer = await Customer.create(customersList[0]);
      token = customer.generateToken();
      avatar = {
        imgName: 'avatar',
        imgPath: 'avatar/path'
      }
    });
    function exec() {
      return request(server)
      .put('/api/customers/me/set-avatar')
      .set('x-auth-token', token)
      .send(avatar)
    };
    it("Should return 401 if no token is provided", async () => {
      const res = await request(server).put('/api/customers/me');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('Access denied');
    }); 
    it("Should return 400 if imgName is not a string", async () => {
      avatar.imgName = 1;
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"imgName" must be a string');
    });
    it("Should return 400 if imgPath is not a string", async () => {
      avatar.imgPath = 1;
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"imgPath" must be a string');
    });
    it("Should return 400 if imgPath is missing", async () => {
      avatar.imgPath = "";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"imgPath" is not allowed to be empty');
    });
    it("Should return 400 if imgName is missing", async () => {
      avatar.imgName = "";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"imgName" is not allowed to be empty');
    });
    it("Should return 200 if imgName and imgPath are valid", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body.nModified).toBe(1);
    });
  });
  describe("PUT /me/add-fav_restaurants/:id", () => {
    beforeEach( async () => {
      customer = await Customer.create(customersList[0]);
      token = customer.generateToken();
      restaurant = await Restaurant.create({
        name: 'restaurantTest1',
        email: 'restaurantTest1@gmail.com',
        password: bcrypt.hashSync('123456', bcrypt.genSaltSync(10)),
        address: {
          street: "main st.",
          number: '00',
          city: 'Barcelona',
          country: 'Country'
        },
        phone: '000000',
        description: 'test description for restaurantTest1',
        capacity: 100,
        cuisine: 'test cuisine'
      });
    });
    function exec() {
      return request(server)
      .put('/api/customers/me/add-fav_restaurants/' + restaurant._id)
      .set('x-auth-token', token)
    };
    it("Should return 401 if no token is provided", async () => {
      const res = await request(server).put('/api/customers/me/add-fav_restaurants/' + restaurant._id);
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('Access denied');
    }); 
    it("Should return 404 if invalid restaurant id is sent", async () => {
      const res = await request(server)
      .put('/api/customers/me/add-fav_restaurants/1')
      .set('x-auth-token', token);
      expect(res.status).toBe(404)
      expect(res.body.message).toMatch('Invalid id')
    });
    it("Should return 404 if no restaurant is found with the provided id", async () => {
      const res = await request(server)
      .put('/api/customers/me/add-fav_restaurants/' + new mongoose.Types.ObjectId())
      .set('x-auth-token', token);
      expect(res.status).toBe(404)
      expect(res.body.message).toMatch('No restaurant with this id')
    });
    it("Should return 400 if the restaurant is already in the fav list", async () => {
      await exec();
      const res = await exec();
      expect(res.status).toBe(400)
      expect(res.body.message).toMatch('restaurant already exist')
    });
    it("Should return 200 if restaurant is added to the fav list", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      const updatedCustomer = await Customer.findById(customer._id);
      expect(updatedCustomer.favRestaurants.length).toBe(1);
      expect(updatedCustomer.favRestaurants[0].name).toMatch('restaurantTest1');
    });
  });
  describe("DELETE /me/remove-fav_restaurants/:id", () => {
    beforeEach( async () => {
      customer = await Customer.create(customersList[0]);
      token = customer.generateToken();
      restaurant = await Restaurant.create({
        name: 'restaurantTest1',
        email: 'restaurantTest1@gmail.com',
        password: bcrypt.hashSync('123456', bcrypt.genSaltSync(10)),
        address: {
          street: "main st.",
          number: '00',
          city: 'Barcelona',
          country: 'Country'
        },
        phone: '000000',
        description: 'test description for restaurantTest1',
        capacity: 100,
        cuisine: 'test cuisine'
      });
      await request(server)
      .put('/api/customers/me/add-fav_restaurants/' + restaurant._id)
      .set('x-auth-token', token)
    });
    function exec() {
      return request(server)
      .delete('/api/customers/me/remove-fav_restaurants/' + restaurant._id)
      .set('x-auth-token', token)
    };
    it("Should return 401 if no token is provided", async () => {
      const res = await request(server).delete('/api/customers/me/remove-fav_restaurants/' + restaurant._id);
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('Access denied');
    }); 
    it("Should return 404 if invalid restaurant id is sent", async () => {
      const res = await request(server)
      .delete('/api/customers/me/remove-fav_restaurants/1')
      .set('x-auth-token', token);
      expect(res.status).toBe(404)
      expect(res.body.message).toMatch('Invalid id')
    });
    it("Should return 404 if no restaurant is found with the provided id in the fav list", async () => {
      const res = await request(server)
      .delete('/api/customers/me/remove-fav_restaurants/' + new mongoose.Types.ObjectId())
      .set('x-auth-token', token);
      expect(res.status).toBe(404)
      expect(res.body.message).toMatch('restaurant is not in the list')
    });
    it("Should return 200 if restaurant is removed from the fav list", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body.removed).toHaveProperty('name', 'restaurantTest1')
      const updatedCustomer = await Customer.findById(customer._id);
      expect(updatedCustomer.favRestaurants.length).toBe(0);
    });
  });
  describe("PUT /me/add-fav_bartenders/:id", () => {
    beforeEach( async () => {
      customer = await Customer.create(customersList[0]);
      token = customer.generateToken();
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
    });
    function exec() {
      return request(server)
      .put('/api/customers/me/add-fav_bartenders/' + bartender._id)
      .set('x-auth-token', token)
    };
    it("Should return 401 if no token is provided", async () => {
      const res = await request(server).put('/api/customers/me/add-fav_bartenders/' + bartender._id);
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('Access denied');
    }); 
    it("Should return 404 if invalid bartender id is sent", async () => {
      const res = await request(server)
      .put('/api/customers/me/add-fav_bartenders/1')
      .set('x-auth-token', token);
      expect(res.status).toBe(404)
      expect(res.body.message).toMatch('Invalid id')
    });
    it("Should return 404 if no bartender is found with the provided id", async () => {
      const res = await request(server)
      .put('/api/customers/me/add-fav_bartenders/' + new mongoose.Types.ObjectId())
      .set('x-auth-token', token);
      expect(res.status).toBe(404)
      expect(res.body.message).toMatch('No bartender with this id')
    });
    it("Should return 400 if the bartender is already in the fav list", async () => {
      await exec();
      const res = await exec();
      expect(res.status).toBe(400)
      expect(res.body.message).toMatch('bartender already exist')
    });
    it("Should return 200 if bartender is added to the fav list", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      const updatedCustomer = await Customer.findById(customer._id);
      expect(updatedCustomer.favBartenders.length).toBe(1);
      expect(updatedCustomer.favBartenders[0].username).toMatch('bartenderTest1');
    });
  });
  describe("DELETE /me/remove-fav_bartenders/:id", () => {
    beforeEach( async () => {
      customer = await Customer.create(customersList[0]);
      token = customer.generateToken();
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
      await request(server)
      .put('/api/customers/me/add-fav_bartenders/' + bartender._id)
      .set('x-auth-token', token)
    });
    function exec() {
      return request(server)
      .delete('/api/customers/me/remove-fav_bartenders/' + bartender._id)
      .set('x-auth-token', token)
    };
    it("Should return 401 if no token is provided", async () => {
      const res = await request(server).delete('/api/customers/me/remove-fav_bartenders/' + bartender._id);
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('Access denied');
    }); 
    it("Should return 404 if invalid bartender id is sent", async () => {
      const res = await request(server)
      .delete('/api/customers/me/remove-fav_bartenders/1')
      .set('x-auth-token', token);
      expect(res.status).toBe(404)
      expect(res.body.message).toMatch('Invalid id')
    });
    it("Should return 404 if no bartender is found with the provided id in the fav list", async () => {
      const res = await request(server)
      .delete('/api/customers/me/remove-fav_bartenders/' + new mongoose.Types.ObjectId())
      .set('x-auth-token', token);
      expect(res.status).toBe(404)
      expect(res.body.message).toMatch('bartender is not in the list')
    });
    it("Should return 200 if bartender is removed from the fav list", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body.removed).toHaveProperty('username', 'bartenderTest1')
      const updatedCustomer = await Customer.findById(customer._id);
      expect(updatedCustomer.favBartenders.length).toBe(0);
    });
  });
  describe("DELETE /me", () => {
    beforeEach(async () => {
      customer = await Customer.create(customersList[0]);
      token = customer.generateToken();
    });
    it("Should return 401 if no token is provided", async () => {
      const res = await request(server).delete('/api/customers/me');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('Access denied');
    }); 
    it("Should return 200 if customer user was successfully deleted from db", async () => {
      const res = await request(server)
      .delete('/api/customers/me')
      .set('x-auth-token', token);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch('"customer1" user was successfully removed');
    }); 
  });
});