const { Comment } = require('../../models/comment');
const { Customer } = require('../../models/customer');
const { Restaurant } = require('../../models/restaurant');
const { Bartender } = require('../../models/bartender');
const mongoose = require('mongoose');
const request = require("supertest");
let server; 

describe("/api/comments", () => {
  let customer;
  let restaurant;
  let customerToken;
  let payload;
  beforeEach(async () => {
    server = require('../../app');
    restaurant = await Restaurant.create({
      name: 'restaurantTest',
      email: 'restaurantTest@gmail.com',
      password: '123456',
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
    });
    customer = await Customer.create({
      username: 'customerTest',
      email: 'customerTest@gmail.com',
      password: '123456'
    });
    customerToken = customer.generateToken();
    payload = {
      text: 'this is a test comment',
      restaurantId: restaurant._id
    }
  });
  afterEach(async () => {
    await Comment.deleteMany({});
    await Customer.deleteMany({});
    await Restaurant.deleteMany({});
    server.close();
  });
  describe("GET /", () => {
    it("Should return a list with all comments", async () => {
      await Comment.insertMany([
        {
          text: 'text of comment number 1',
          author: {
            _id: customer._id,
            username: customer.username,
            role: customer.role
          },
          recipient: {
            _id: restaurant._id,
            name: restaurant.name,
            city: restaurant.address.city,
            role: restaurant.role
          }
        },
        {
          text: 'text of comment number 2',
          author: {
            _id: customer._id,
            username: customer.username,
            role: customer.role
          },
          recipient: {
            _id: restaurant._id,
            name: restaurant.name,
            city: restaurant.address.city,
            role: restaurant.role
          }
        }
      ]);
      const res = await request(server)
      .get('/api/comments');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2)
      expect(res.body.data.some(c => c.text === 'text of comment number 1')).toBeTruthy();
      expect(res.body.data.some(c => c.text === 'text of comment number 2')).toBeTruthy();
    });
  });
  describe("GET /:id", () => {
    let comment;
    beforeEach(async () => {
      comment = await Comment.create(        {
        text: 'text of comment number 1',
        author: {
          _id: customer._id,
          username: customer.username,
          role: customer.role
        },
        recipient: {
          _id: restaurant._id,
          name: restaurant.name,
          city: restaurant.address.city,
          role: restaurant.role
        }
      });
    });
    it("Should return 404 if invalid comment is sent", async () => {
      const res = await request(server).get('/api/comments/1');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('Invalid id')
    });
    it("Should return 404 if no comment is found with the given id", async () => {
      const res = await request(server).get('/api/comments/' + new mongoose.Types.ObjectId());
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('No comment with this id')
    });
    it("Should return 200 if valid comment id is sent", async () => {
      const res = await request(server).get('/api/comments/' + comment._id);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('text', 'text of comment number 1')
    });
  });
  describe("POST /", () => {
    function exec(payload) {
      return request(server)
      .post('/api/comments')
      .set('x-auth-token', customerToken)
      .send(payload)
    };
    it("Should return 401 if logged in user has bartender role", async () => {
      const res = await request(server)
      .post('/api/comments')
      .set('x-auth-token', new Bartender().generateToken())
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('Only customers can add comments') 
    });
    it("Should return 401 if logged in user has restaurant role", async () => {
      const res = await request(server)
      .post('/api/comments')
      .set('x-auth-token', restaurant.generateToken())
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('Only customers can add comments') 
    });
    it("Should return 400 if text field is missing", async () => {
      payload.text = undefined;
      const res = await exec(payload);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"text" is required')
    });
    it("Should return 400 if text field is shorter than 10", async () => {
      payload.text = new Array(10).join('a');
      const res = await exec(payload);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"text" length must be at least 10')
    });
    it("Should return 400 if bad restaurant id is sent", async () => {
      payload.restaurantId = '1';
      const res = await exec(payload);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('fails to match the required pattern')
    });
    it("Should return 404 if no restaurant is found with the given id", async () => {
      payload.restaurantId = new mongoose.Types.ObjectId();
      const res = await exec(payload);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('No restaurant found');
    });
    it("Should return 200 if valid comment is sent", async () => {
      const res = await exec(payload);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('text', payload.text);
      expect(res.body.data).toHaveProperty('author._id', customer._id.toString());
      expect(res.body.data).toHaveProperty('recipient._id', restaurant._id.toString());
    });
    it("Should insert the comment into the restaurant's comments list", async () => {
      const res = await exec(payload);
      restaurant = await Restaurant.findById(restaurant._id);
      expect(restaurant.comments.length).toBe(1);
      expect(restaurant.comments[0].toString()).toMatch(res.body.data._id);
    });
    it("Should insert the comment into the customer's comments list", async () => {
      const res = await exec(payload);
      customer = await Customer.findById(customer._id);
      expect(customer.comments.length).toBe(1);
      expect(customer.comments[0].toString()).toMatch(res.body.data._id);
    });
  });
  describe("PUT /:id", () => {
    let comment;
    beforeEach(async () => {
      comment = await Comment.create(        {
        text: 'text of comment number 1',
        author: {
          _id: customer._id,
          username: customer.username,
          role: customer.role
        },
        recipient: {
          _id: restaurant._id,
          name: restaurant.name,
          city: restaurant.address.city,
          role: restaurant.role
        }
      });
      payload = {
        text: 'updated text for this comment',
        restaurantId: restaurant._id
      };
    });
    function exec(id, token, payload) {
      return request(server)
      .put('/api/comments/' + id)
      .set('x-auth-token', token)
      .send(payload);
    };
    it("Should return 401 if no token is sent", async () => {
      const res = await exec(comment._id, '', payload);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('No token provided');
    });
    it("Should return 400 if bad token is sent", async () => {
      const res = await exec(comment._id, 'bad token', payload);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('Invalid token');
    });
    it("Should return 404 if invalid comment id is sent", async () => {
      const res = await exec('1', customerToken, payload);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('Invalid id')
    });
    it("Should return 404 if no comment is found with the given id", async () => {
      const res = await exec(new mongoose.Types.ObjectId(), customerToken, payload);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('No comment with this id')
    });
    it("Should return 401 if the logged in customer is not the author of the comment", async () => {
      const otherToken = new Customer().generateToken();
      const res = await exec(comment._id, otherToken, payload);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('You are not authorized');
    });
    it("Should return 400 if invalid comment text is sent", async () => {
      payload.text = 'short com';
      const res = await exec(comment._id, customerToken, payload);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"text" length must be at least 10');
    });
    it("Should return the updated comment if valid payload is sent", async () => {
      const res = await exec(comment._id, customerToken, payload);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('text', 'updated text for this comment');
    });
  });
  describe("DELETE /:id", () => {
    let comment;
    beforeEach(async () => {
      comment = await Comment.create(        {
        text: 'text of comment number 1',
        author: {
          _id: customer._id,
          username: customer.username,
          role: customer.role
        },
        recipient: {
          _id: restaurant._id,
          name: restaurant.name,
          city: restaurant.address.city,
          role: restaurant.role
        }
      });
    })
    function exec(id, token) {
      return request(server).delete('/api/comments/' + id).set('x-auth-token', token);
    };
    it("Should return 401 if no token is sent", async () => {
      const res = await exec(comment._id, '');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('No token provided');
    });
    it("Should return 400 if bad token is sent", async () => {
      const res = await exec(comment._id, 'bad token');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('Invalid token');
    });
    it("Should return 404 if invalid comment id is sent", async () => {
      const res = await exec('1', customerToken);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('Invalid id')
    });
    it("Should return 404 if no comment is found with the given id", async () => {
      const res = await exec(new mongoose.Types.ObjectId(), customerToken);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('No comment with this id')
    });
    it("Should return 401 if the logged in customer is not the author of the comment", async () => {
      const otherToken = new Customer().generateToken();
      const res = await exec(comment._id, otherToken,);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('You are not authorized');
    });
    it("Should delete the comment with the given id", async () => {
      const res = await exec(comment._id, customerToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch('Successfully deleted');
      expect(res.body.data.deleted).toHaveProperty('text', comment.text)
    });
    it("Should remove the comment from restaurant's list of comments", async () => {
      const resComment = await request(server)
      .post('/api/comments')
      .set('x-auth-token', customerToken)
      .send({text: 'another comment', restaurantId: restaurant._id});
      restaurant = await Restaurant.findById(restaurant._id);
      expect(restaurant.comments.length).toBe(1);
      const res = await request(server).delete('/api/comments/' + resComment.body.data._id).set('x-auth-token', customerToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      restaurant = await Restaurant.findById(restaurant._id);
      expect(restaurant.comments.length).toBe(0);
    });
    it("Should remove the comment from customer's list of comments", async () => {
      const resComment = await request(server)
      .post('/api/comments')
      .set('x-auth-token', customerToken)
      .send({text: 'another comment', restaurantId: restaurant._id});
      customer = await Customer.findById(customer._id);
      expect(customer.comments.length).toBe(1);
      const res = await request(server).delete('/api/comments/' + resComment.body.data._id).set('x-auth-token', customerToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      customer = await Customer.findById(customer._id);
      expect(customer.comments.length).toBe(0);
    });
  });
});