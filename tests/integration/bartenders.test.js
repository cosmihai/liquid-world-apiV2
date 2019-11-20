const { Bartender } = require('../../models/bartender');
const request = require('supertest');
let server;

describe('/api/bartenders', () => {
  let bartenderList = [{
    username: 'bartenderTest1',
    email: 'bartenderTest1@gmail.com',
    password: '123456',
    personalInfo: {
      firstName: 'firstNameTest1',
      lastName: 'lastNameTest1',
      phone: '654321',
      description: 'this is test description for bartenderTest1'
    }
  },
  {
    username: 'bartenderTest2',
    email: 'bartenderTest2@gmail.com',
    password: '123456',
    personalInfo: {
      firstName: 'firstNameTest2',
      lastName: 'lastNameTest2',
      phone: '654321',
      description: 'this is test description for bartenderTest2'
    }
  }];
  beforeEach(() => { server = require('../../app') });
  afterEach(async () => { 
    server.close();
    await Bartender.remove({})
    bartenderList = [
      {
        username: 'bartenderTest1',
        email: 'bartenderTest1@gmail.com',
        password: '123456',
        personalInfo: {
          firstName: 'firstNameTest1',
          lastName: 'lastNameTest1',
          phone: '654321',
          description: 'this is test description for bartenderTest1'
        }
      },
      {
        username: 'bartenderTest2',
        email: 'bartenderTest2@gmail.com',
        password: '123456',
        personalInfo: {
          firstName: 'firstNameTest2',
          lastName: 'lastNameTest2',
          phone: '654321',
          description: 'this is test description for bartenderTest2'
        }
      }
    ]
  });

  describe('GET /', () => {
    it('Should return a list with all bartenders', async () => {
      await Bartender.insertMany(bartenderList);
      const res = await request(server).get('/api/bartenders');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some(b => b.username === 'bartenderTest1')).toBeTruthy();
      expect(res.body.some(b => b.username === 'bartenderTest2')).toBeTruthy();
    });
  });

  describe('GET /:id', () => {
    it('Should return the bartender with the given id', async() => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const res = await request(server).get('/api/bartenders/' + bartender._id);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('username', bartender.username);
    });

    it('Should return 404 if invalid id is provided', async() => {
      const res = await request(server).get('/api/bartenders/1');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /', () => {
    it('Should return 400 if username is shorter than 2', async () => {
      let bartender = bartenderList[0];
      bartender.username = 'a';
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"username" length must be at least 2 characters long');
    });
    it('Should return 400 if username is greater than 255', async () => {
      let bartender = bartenderList[0];
      bartender.username = new Array(257).join('a');
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"username" length must be less than or equal to 255 characters long');
    });
    it('Should return 400 if username is missing', async () => {
      let bartender = bartenderList[0];
      bartender.username = '';
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"username" is not allowed to be empty');
    });
    it('Should return 400 if password is shorter than 6', async () => {
      let bartender = bartenderList[0];
      bartender.password = '12345';
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"password" length must be at least 6 characters long');
    });
    it('Should return 400 if password is greater than 255', async () => {
      let bartender = bartenderList[0];
      bartender.password = new Array(257).join('a');
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"password" length must be less than or equal to 255 characters long');
    });
    it('Should return 400 if password is missing', async () => {
      let bartender = bartenderList[0];
      bartender.password = '';
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"password" is not allowed to be empty');
    });
    it('Should return 400 if email is shorter than 6', async () => {
      let bartender = bartenderList[0];
      bartender.email = 'a@a.a';
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"email" length must be at least 6 characters long');

    });
    it('Should return 400 if email is greater than 255', async () => {
      let bartender = bartenderList[0];
      bartender.email = new Array(253).join('@a.a');
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"email" length must be less than or equal to 255 characters long');

    });
    it('Should return 400 if email is missing', async () => {
      let bartender = bartenderList[0];
      bartender.email = '';
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"email" is not allowed to be empty');
    });
    it('Should return 400 if email is invalid', async () => {
      let bartender = bartenderList[0];
      bartender.email = 'invalidemail';
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('\"email\" must be a valid email');
    });
    it('Shoukd return 400 if personalInfo is missing', async () => {
      let bartender = bartenderList[0];
      bartender.personalInfo = {};
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
    });
    it('Should return 400 if firstName is shorter than 2', async () => {
      let bartender = bartenderList[0];
      bartender.personalInfo.firstName = 'a';
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"firstName" length must be at least 2 characters long')
    });
    it('Should return 400 if firstName is greater than 255', async () => {
      let bartender = bartenderList[0];
      bartender.personalInfo.firstName = new Array(257).join('a');
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"firstName" length must be less than or equal to 255 characters long');
    });
    it('Should return 400 if firstName is missing', async () => {
      let bartender = bartenderList[0];
      bartender.personalInfo.firstName = '';
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"firstName" is not allowed to be empty');
    });
    it('Should return 400 if lastName is shorter than 2', async () => {
      let bartender = bartenderList[0];
      bartender.personalInfo.lastName = 'a';
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"lastName" length must be at least 2 characters long')
    });
    it('Should return 400 if lastName is greater than 255', async () => {
      let bartender = bartenderList[0];
      bartender.personalInfo.lastName = new Array(257).join('a');
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"lastName" length must be less than or equal to 255 characters long');
    });
    it('Should return 400 if lastName is missing', async () => {
      let bartender = bartenderList[0];
      bartender.personalInfo.lastName = '';
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"lastName" is not allowed to be empty');
    });
    it('Should return 400 if phone is shorter than 6', async () => {
      let bartender = bartenderList[0];
      bartender.personalInfo.phone = '1';
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"phone" length must be at least 6 characters long');
    });
    it('Should return 400 if phone is greater than 50', async () => {
      let bartender = bartenderList[0];
      bartender.personalInfo.phone = new Array(52).join('1');
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"phone" length must be less than or equal to 50 characters long');
    });
    it('Should return 400 if phone containes more than numbers', async () => {
      let bartender = bartenderList[0];
      bartender.personalInfo.phone = '12345a';
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"phone" with value "12345a" fails to match the required pattern: /^[0-9]+$/');
    });
    it('Should return 400 if description is shorter than 10', async () => {
      let bartender = bartenderList[0];
      bartender.personalInfo.description = '123456789';
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"description" length must be at least 10 characters long');
    });
    it('Should return 400 if description is greater than 2048', async () => {
      let bartender = bartenderList[0];
      bartender.personalInfo.description = new Array(2050).join('a');
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"description" length must be less than or equal to 2048 characters long');
    });
    it('Should return 400 if description is missing', async () => {
      let bartender = bartenderList[0];
      bartender.personalInfo.description = '';
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartender);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"description" is not allowed to be empty');
    });
    it('Should return 400 if email is not unique', async () => {
      await Bartender.create(bartenderList[0]);
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('already in use!');
    });
    it('Should save the bartender user in DB if it is valid', async () => {
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartenderList[0]);
      expect(res.status).toBe(200);
      const user = await Bartender.find({email: bartenderList[0].email});
      expect(user).not.toBeNull();
    });
    it('Should return the new bartender if it is valid', async () => {
      const res = await request(server)
      .post('/api/bartenders')
      .send(bartenderList[0]);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('email', bartenderList[0].email);
    });
  });

  describe('PUT /me', () => {
    it('Should return 401 if no token is provided', async () => {
      const res = await request(server).put('/api/bartenders/me');
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch('No token provided');
    });
    it('Should return 400 if no token is provided', async () => {
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': 'a'})
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('Invalid token');
    });
    //----------------------------------------------------------
    it('Should return 400 if username is shorter than 2', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].username = 'a';
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"username" length must be at least 2 characters long');
    });
    it('Should return 400 if username is greater than 255', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].username = new Array(270).join('a');
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"username" length must be less than or equal to 255 characters long');
    });
    it('Should return 400 if username is missing', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].username = '';
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"username" is not allowed to be empty');
    });
    it('Should return 400 if password is in the body of the request', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"Passowrd" is not allowed!');
    });
    it('Should return 400 if email is shorter than 6', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].email = 'a@a.a';
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"email" length must be at least 6 characters long');
    });
    it('Should return 400 if email is greater than 255', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].email = new Array(253).join('a') + '@a.a';
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"email" length must be less than or equal to 255 characters long');
    });
    it('Should return 400 if email is missing', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].email = '';
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"email" is not allowed to be empty');
    });
    it('Should return 400 if email is invalid', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].email = 'aaaaaaa';
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"email" must be a valid email');
    });
    it('Shoukd return 400 if personalInfo is missing', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo = '';
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('object')
    });
    it('Should return 400 if firstName is shorter than 2', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.firstName = 'a';
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"firstName" length must be at least 2 characters long')
    });
    it('Should return 400 if firstName is greater than 255', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.firstName = new Array(257).join('a');
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"firstName" length must be less than or equal to 255 characters long');
    });
    it('Should return 400 if firstName is missing', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.firstName = '';
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"firstName" is not allowed to be empty');
    });
    it('Should return 400 if lastName is shorter than 2', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.lastName = 'a';
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"lastName" length must be at least 2 characters long')
    });
    it('Should return 400 if lastName is greater than 255', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.lastName = new Array(257).join('a');
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"lastName" length must be less than or equal to 255 characters long');
    });
    it('Should return 400 if lastName is missing', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.lastName = '';
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"lastName" is not allowed to be empty');
    });
    it('Should return 400 if phone is shorter than 6', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.phone = '12345';
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"phone" length must be at least 6 characters long');
    });
    it('Should return 400 if phone is greater than 50', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.phone = new Array(52).join('1');
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"phone" length must be less than or equal to 50 characters long');
    });
    it('Should return 400 if phone containes more than numbers', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.phone = '12345a';
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('fails to match the required pattern: /^[0-9]+$/');
    });
    it('Should return 400 if description is shorter than 10', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.description = new Array(10).join('a');
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"description" length must be at least 10 characters long');
    });
    it('Should return 400 if description is greater than 2048', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.description = new Array(2050).join('a');
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"description" length must be less than or equal to 2048 characters long');
    });
    it('Should return 400 if description is missing', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.description = '';
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('"description" is not allowed to be empty');
    });
    it('Should return 400 if email is not unique', async () => {
      await Bartender.create(bartenderList[0]);
      const bartender = new Bartender(bartenderList[1]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[1].password = undefined;
      bartenderList[1].email = bartenderList[0].email;
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[1]);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch('already in use!');
    });
    it('Should save the bartender user in DB if it is valid', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].username = 'new username';
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(200);
      const user = await Bartender.find({email: bartenderList[0].email});
      expect(user).not.toBeNull();
    });
    it('Should return the updated bartender if it is valid', async () => {
      const bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      const token = bartender.generateToken();
      bartenderList[0].password = undefined;
      bartenderList[0].username = 'new username';
      const res = await request(server)
      .put('/api/bartenders/me')
      .set({'x-auth-token': token})
      .send(bartenderList[0]);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('username', 'new username');
    });
  });
});
