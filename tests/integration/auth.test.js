const bcrypt = require('bcrypt');
const { Bartender } = require('../../models/bartender');
const { Customer } = require('../../models/customer');
const { Restaurant } = require('../../models/restaurant');
const request = require("supertest");
let server;

describe("/api/auth", () => {

  beforeEach(() => {
    server = require('../../app');
  });
  afterEach(() => {
    server.close();
  });
  function exec(url, body) {
    return request(server)
    .post(url)
    .send(body)
  };
  describe("POST /bartenders/login", () => {
    const url = '/api/auth/bartenders/login'
    let bartender;
    let payload;
    beforeEach(async () => {
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
    it("Should return 400 if email is missing", async () => {
      payload.email = '';
      const res = await exec(url, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"email" is not allowed to be empty');
    });
    it("Should return 400 if password is missing", async () => {
      payload.password = '';
      const res = await exec(url, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"password" is not allowed to be empty');
    });
    it("Should return 400 if email is incorrect", async () => {
      payload.email = 'incorrect@email.com';
      const res = await exec(url, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('Password or email incorrect');
    });
    it("Should return 400 if password is incorrect", async () => {
      payload.password = '1234567';
      const res = await exec(url, payload);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('Password or email incorrect');
    });
    it("Should return 200 if password and email are correct", async () => {
      payload.password = '123456'
      const res = await exec(url, payload);
      expect(res.status).toBe(200);
      expect(res.body.token).not.toBe(null);
    });
  });
});