const bcrypt = require('bcrypt');
const { Bartender } = require('../../models/bartender');
const { Customer } = require('../../models/customer');
const { Restaurant } = require('../../models/restaurant');
const request = require("supertest");
let server;

describe("/api/auth", () => {
  let payload;
  let url;
  beforeEach(() => {
    server = require('../../app');
  });
  afterEach(() => {
    server.close();
  });
  function exec(endPoint, body) {
    return request(server)
    .post(endPoint)
    .send(body)
  };
  function runTests() {
    it("Should return 400 if email is missing", async () => {
      payload.email = '';
      const res = await exec(url, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"email" is not allowed to be empty');
      expect(res.body.success).toBe(false);
    });
    it("Should return 400 if password is missing", async () => {
      payload.password = '';
      const res = await exec(url, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"password" is not allowed to be empty');
      expect(res.body.success).toBe(false);
    });
    it("Should return 400 if email is incorrect", async () => {
      payload.email = 'incorrect@email.com';
      const res = await exec(url, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('Password or email incorrect');
      expect(res.body.success).toBe(false);
    });
    it("Should return 400 if password is incorrect", async () => {
      payload.password = '1234567';
      const res = await exec(url, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('Password or email incorrect');
      expect(res.body.success).toBe(false);
    });
    it("Should return 200 if password and email are correct", async () => {
      const res = await exec(url, payload);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/(\..*){2,}/);
      expect(res.body.success).toBe(true);
    });
  }

  describe("POST /bartenders/login", () => {
    let bartender;
    beforeEach(async () => {
      url = '/api/auth/bartenders/login';
      bartender = {
        username: "bartenderTest1",
        email: "bartenderTest1@gmail.com",
        password: bcrypt.hashSync('123456', bcrypt.genSaltSync(10)),
        personalInfo: {
          firstName: "firstNameTest1",
          lastName: "lastNameTest1",
          phone: "654321",
          description: "this is test description for bartenderTest1"
        }
      };
      payload = {
        email: "bartenderTest1@gmail.com",
        password: "123456"
      };
      await Bartender.create(bartender);
    });
    afterEach(async () => {
      await Bartender.deleteMany({});
    })
    runTests();
  });

  describe("POST /restaurants/login", () => {
    let restaurant;
    beforeEach(async () => {
      url = '/api/auth/restaurants/login';
      restaurant = {
        name: 'restaurantTest1',
        email: 'restaurantTest1@gmail.com',
        password: bcrypt.hashSync('123456', bcrypt.genSaltSync(10)),
        address: {
          street: "main st.",
          number: '00',
          city: 'City',
          country: 'Country'
        },
        phone: '000000',
        description: 'test description for restaurantTest1',
        capacity: 100,
        cuisine: 'test cuisine'
      };
      payload = {
        email: 'restaurantTest1@gmail.com',
        password: '123456'
      };
      await Restaurant.create(restaurant);
    });
    afterEach(async () => {
      await Restaurant.deleteMany({});
    });
    runTests();
  });

  describe("POST /api/customers/login", () => {
    let customer;
    beforeEach(async () => {
      url = '/api/auth/customers/login';
      customer = {
        username: 'customerTest1',
        email: 'customerTest1@gmail.com',
        password: bcrypt.hashSync('123456', bcrypt.genSaltSync(10))
      };
      payload = {
        email: 'customerTest1@gmail.com',
        password: '123456'
      };
      await Customer.create(customer);
    });
    afterEach(async () => {
      await Customer.deleteMany({});
    });
    runTests();
  });
});