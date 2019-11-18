const { Bartender } = require('../../models/bartender');
const request = require('supertest');
let server;

describe('/api/bartenders', () => {
  const bartenderList = [
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
  beforeEach(() => { server = require('../../app') });
  afterEach(async () => { 
    server.close();
    await Bartender.remove({})
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
      expect(res.status).toBe(400)
    })
  })
});
