const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { Bartender } = require("../../models/bartender");
const request = require("supertest");
let server;

describe("/api/bartenders", () => {
  let bartenderList;
  beforeEach(() => {
    server = require("../../app");
    bartenderList = [
      {
        username: "bartenderTest1",
        email: "bartenderTest1@gmail.com",
        password: "123456",
        personalInfo: {
          firstName: "firstNameTest1",
          lastName: "lastNameTest1",
          phone: "654321",
          description: "this is test description for bartenderTest1"
        }
      },
      {
        username: "bartenderTest2",
        email: "bartenderTest2@gmail.com",
        password: "123456",
        personalInfo: {
          firstName: "firstNameTest2",
          lastName: "lastNameTest2",
          phone: "654321",
          description: "this is test description for bartenderTest2"
        }
      }
    ];
  });
  afterEach(async () => {
    await Bartender.deleteMany({});
    server.close();
  });

  describe("GET /", () => {
    it("Should return a list with all bartenders", async () => {
      await Bartender.insertMany(bartenderList);
      const res = await request(server).get("/api/bartenders");
      expect(res.body.success).toBe(true);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data.some(b => b.username === "bartenderTest1")).toBeTruthy();
      expect(res.body.data.some(b => b.username === "bartenderTest2")).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    it("Should return the bartender with the given id", async () => {
      const bartender = await new Bartender(bartenderList[0]).save();
      const res = await request(server).get("/api/bartenders/" + bartender._id);
      expect(res.body.success).toBe(true);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("username", bartender.username);
    });
    it("Should return 404 if invalid id is provided", async () => {
      const res = await request(server).get("/api/bartenders/1");
      expect(res.body.success).toBe(false);
      expect(res.status).toBe(404);
      expect(res.body.message).toMatch("Invalid id");
    });
  });

  describe("GET /me", () => {
    it("Should return 401 if no token is provided", async () => {
      const res = await request(server).get("/api/bartenders/me");
      expect(res.body.success).toBe(false);
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch("No token provided");
    });
    it("Should return 400 if invalid token is provided", async () => {
      const res = await request(server)
        .get("/api/bartenders/me")
        .set("x-auth-token", "a");
      expect(res.body.success).toBe(false);
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch("Invalid token provided");
    });
    it("Should return the logged in bartender if correct token is sent", async () => {
      const bartender = await new Bartender(bartenderList[0]).save();
      const token = bartender.generateToken();
      const res = await request(server)
        .get("/api/bartenders/me")
        .set("x-auth-token", token);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("email", bartenderList[0].email);
    });
  });

  describe("POST /", () => {
    let bartender;
    beforeEach(() => {
      bartender = bartenderList[0];
    });
    function exec() {
      return request(server)
        .post("/api/bartenders")
        .send(bartender);
    };
    it("Should return 400 if username is shorter than 2", async () => {
      bartender.username = "a";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"username" length must be at least 2 characters long'
      );
    });
    it("Should return 400 if username is greater than 255", async () => {
      bartender.username = new Array(257).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"username" length must be less than or equal to 255 characters long'
      );
    });
    it("Should return 400 if username is missing", async () => {
      bartender.username = "";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"username" is not allowed to be empty');
    });
    it("Should return 400 if password is shorter than 6", async () => {
      bartender.password = "12345";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"password" length must be at least 6 characters long'
      );
    });
    it("Should return 400 if password is greater than 255", async () => {
      bartender.password = new Array(257).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"password" length must be less than or equal to 255 characters long'
      );
    });
    it("Should return 400 if password is missing", async () => {
      bartender.password = "";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"password" is not allowed to be empty');
    });
    it("Should return 400 if email is shorter than 6", async () => {
      bartender.email = "a@a.a";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"email" length must be at least 6 characters long'
      );
    });
    it("Should return 400 if email is greater than 255", async () => {
      bartender.email = new Array(253).join("@a.a");
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"email" length must be less than or equal to 255 characters long'
      );
    });
    it("Should return 400 if email is missing", async () => {
      bartender.email = "";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"email" is not allowed to be empty');
    });
    it("Should return 400 if email is invalid", async () => {
      bartender.email = "invalidemail";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"email" must be a valid email');
    });
    it("Should return 400 if personalInfo is missing", async () => {
      bartender.personalInfo = {};
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
    it("Should return 400 if firstName is shorter than 2", async () => {
      bartender.personalInfo.firstName = "a";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"firstName" length must be at least 2 characters long'
      );
    });
    it("Should return 400 if firstName is greater than 255", async () => {
      bartender.personalInfo.firstName = new Array(257).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"firstName" length must be less than or equal to 255 characters long'
      );
    });
    it("Should return 400 if firstName is missing", async () => {
      bartender.personalInfo.firstName = "";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"firstName" is not allowed to be empty'
      );
    });
    it("Should return 400 if lastName is shorter than 2", async () => {
      bartender.personalInfo.lastName = "a";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"lastName" length must be at least 2 characters long'
      );
    });
    it("Should return 400 if lastName is greater than 255", async () => {
      bartender.personalInfo.lastName = new Array(257).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"lastName" length must be less than or equal to 255 characters long'
      );
    });
    it("Should return 400 if lastName is missing", async () => {
      bartender.personalInfo.lastName = "";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"lastName" is not allowed to be empty');
    });
    it("Should return 400 if phone is shorter than 6", async () => {
      bartender.personalInfo.phone = "1";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"phone" length must be at least 6 characters long'
      );
    });
    it("Should return 400 if phone is greater than 50", async () => {
      bartender.personalInfo.phone = new Array(52).join("1");
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"phone" length must be less than or equal to 50 characters long'
      );
    });
    it("Should return 400 if phone containes more than numbers", async () => {
      bartender.personalInfo.phone = "12345a";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"phone" with value "12345a" fails to match the required pattern: /^[0-9]+$/'
      );
    });
    it("Should return 400 if description is shorter than 10", async () => {
      bartender.personalInfo.description = "123456789";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"description" length must be at least 10 characters long'
      );
    });
    it("Should return 400 if description is greater than 2048", async () => {
      bartender.personalInfo.description = new Array(2050).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"description" length must be less than or equal to 2048 characters long'
      );
    });
    it("Should return 400 if description is missing", async () => {
      bartender.personalInfo.description = "";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"description" is not allowed to be empty'
      );
    });
    it("Should return 400 if email is not unique", async () => {
      await Bartender.create(bartenderList[0]);
      const res = await request(server)
        .post("/api/bartenders")
        .send(bartenderList[0]);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch("already in use!");
    });
    it("Should save the bartender user in DB if it is valid", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const user = await Bartender.find({ email: bartenderList[0].email });
      expect(user).not.toBeNull();
    });
    it("Should return the new bartender if it is valid", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("_id");
      expect(res.body.data).toHaveProperty("email", bartenderList[0].email);
    });
  });

  describe("PUT /me", () => {
    let token;
    beforeEach(async () => {
      const bartender = await new Bartender(bartenderList[0]).save();
      token = bartender.generateToken();
    });
    function exec() {
      return request(server)
        .put("/api/bartenders/me")
        .set("x-auth-token", token)
        .send(bartenderList[0]);
    }
    it("Should return 401 if no token is provided", async () => {
      const res = await request(server).put("/api/bartenders/me");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch("No token provided");
    });
    it("Should return 400 if no valid token is provided", async () => {
      const res = await request(server)
        .put("/api/bartenders/me")
        .set("x-auth-token", "a");
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch("Invalid token");
    });
    it("Should return 400 if username is shorter than 2", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].username = "a";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"username" length must be at least 2 characters long'
      );
    });
    it("Should return 400 if username is greater than 255", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].username = new Array(270).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"username" length must be less than or equal to 255 characters long'
      );
    });
    it("Should return 400 if username is missing", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].username = "";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"username" is not allowed to be empty');
    });
    it("Should return 400 if password is in the body of the request", async () => {
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"Passowrd" is not allowed!');
    });
    it("Should return 400 if email is shorter than 6", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].email = "a@a.a";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"email" length must be at least 6 characters long'
      );
    });
    it("Should return 400 if email is greater than 255", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].email = new Array(253).join("a") + "@a.a";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"email" length must be less than or equal to 255 characters long'
      );
    });
    it("Should return 400 if email is missing", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].email = "";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"email" is not allowed to be empty');
    });
    it("Should return 400 if email is invalid", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].email = "aaaaaaa";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"email" must be a valid email');
    });
    it("Shoukd return 400 if personalInfo is missing", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo = "";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch("object");
    });
    it("Should return 400 if firstName is shorter than 2", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.firstName = "a";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"firstName" length must be at least 2 characters long'
      );
    });
    it("Should return 400 if firstName is greater than 255", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.firstName = new Array(257).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"firstName" length must be less than or equal to 255 characters long'
      );
    });
    it("Should return 400 if firstName is missing", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.firstName = "";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"firstName" is not allowed to be empty'
      );
    });
    it("Should return 400 if lastName is shorter than 2", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.lastName = "a";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"lastName" length must be at least 2 characters long'
      );
    });
    it("Should return 400 if lastName is greater than 255", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.lastName = new Array(257).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"lastName" length must be less than or equal to 255 characters long'
      );
    });
    it("Should return 400 if lastName is missing", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.lastName = "";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"lastName" is not allowed to be empty');
    });
    it("Should return 400 if phone is shorter than 6", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.phone = "12345";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"phone" length must be at least 6 characters long'
      );
    });
    it("Should return 400 if phone is greater than 50", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.phone = new Array(52).join("1");
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"phone" length must be less than or equal to 50 characters long'
      );
    });
    it("Should return 400 if phone containes more than numbers", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.phone = "12345a";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        "fails to match the required pattern: /^[0-9]+$/"
      );
    });
    it("Should return 400 if description is shorter than 10", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.description = new Array(10).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"description" length must be at least 10 characters long'
      );
    });
    it("Should return 400 if description is greater than 2048", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.description = new Array(2050).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"description" length must be less than or equal to 2048 characters long'
      );
    });
    it("Should return 400 if description is missing", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].personalInfo.description = "";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"description" is not allowed to be empty'
      );
    });
    it("Should return 400 if email is not unique", async () => {
      await Bartender.create(bartenderList[1]);
      bartenderList[0].password = undefined;
      bartenderList[0].email = bartenderList[1].email;
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch("already in use!");
    });
    it("Should save the bartender user in DB if it is valid", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].username = "new username";
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const user = await Bartender.find({ email: bartenderList[0].email });
      expect(user).not.toBeNull();
    });
    it("Should return the updated bartender if it is valid", async () => {
      bartenderList[0].password = undefined;
      bartenderList[0].username = "new username";
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("_id");
      expect(res.body.data).toHaveProperty("username", "new username");
    });
  });

  describe("PUT /me/change-password", () => {
    let token;
    let payload;
    let bartender;
    beforeEach(async () => {
      payload = {
        password: "1234567"
      };
      bartender = new Bartender(bartenderList[0]);
      const hash = await bcrypt.genSalt(10);
      bartender.password = await bcrypt.hash(bartender.password, hash);
      await bartender.save();
      token = bartender.generateToken();
    });
    function exec() {
      return request(server)
        .put("/api/bartenders/me/change-password")
        .set("x-auth-token", token)
        .send(payload);
    }
    it("Should return 400 if new password is shorter than 6", async () => {
      payload.password = "12345";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"password" length must be at least 6');
    });
    it("Should return 400 if new password is longer than 255", async () => {
      payload.password = new Array(257).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"password" length must be less than or equal to 255'
      );
    });
    it("Should return 400 if new password is empty", async () => {
      payload.password = "";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"password" is not allowed to be empty');
    });
    it("Should return 400 if new password is empty", async () => {
      token = "invalid token";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch("Invalid token");
    });
    it("Should return 400 if the new password is the same as the old one", async () => {
      payload.password = "123456";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch("Can not set the same password");
    });
    it("Should return 200 if the new password is valid", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch("Password changed");
    });
  });

  describe("PUT /me/set-avatar", () => {
    let token;
    let payload;
    let bartender;
    beforeEach(async () => {
      payload = {
        imgName: "name",
        imgPath: "path"
      };
      bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      token = bartender.generateToken();
    });
    function exec() {
      return request(server)
        .put("/api/bartenders/me/set-avatar")
        .set("x-auth-token", token)
        .send(payload);
    }
    it("Should return 400 if no or bad token is provided", async () => {
      token = "a";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch("Invalid token");
    });
    it("Should return 400 if imgName is not a string", async () => {
      payload.imgName = 1;
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"imgName" must be a string');
    });
    it("Should return 400 if imgPath is not a string", async () => {
      payload.imgPath = 1;
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"imgPath" must be a string');
    });
    it("Should return 400 if imgPath is missing", async () => {
      payload.imgPath = "";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"imgPath" is not allowed to be empty');
    });
    it("Should return 400 if imgName is missing", async () => {
      payload.imgName = "";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"imgName" is not allowed to be empty');
    });
    it("Should return 200 if imgName and imgPath are valid", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nModified).toBe(1);
    });
  });

  describe("PUT /me/add-experience", () => {
    let token;
    let payload;
    let bartender;
    beforeEach(async () => {
      payload = {
        place: "aa",
        from: new Date("01/01/2009"),
        until: new Date("01/31/2015"),
        position: "aa"
      };
      bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      token = bartender.generateToken();
    });
    function exec() {
      return request(server)
        .put("/api/bartenders/me/add-experience")
        .set("x-auth-token", token)
        .send(payload);
    }
    it("Should return 400 if no token is provided", async () => {
      token = null;
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch("Invalid token");
    });
    it("Should return 400 if invalid start date is sent", async () => {
      payload.from = "invallid";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch("valid date string");
    });
    it("Should return 400 if invalid end date is sent", async () => {
      payload.until = "invallid";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch("valid date string");
    });
    it("Should return 400 if start date is missing", async () => {
      payload.from = undefined;
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"from" is required');
    });
    it("Should return 400 if end date is missing", async () => {
      payload.until = undefined;
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"until" is required');
    });
    it("Should return 400 if place is missing", async () => {
      payload.place = "";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"place" is not allowed to be empty');
    });
    it("Should return 400 if place is less than 2", async () => {
      payload.place = "a";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"place" length must be at least 2');
    });
    it("Should return 400 if place is grater than 255", async () => {
      payload.place = new Array(257).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"place" length must be less than or equal to 255'
      );
    });
    it("Should return 400 if position is missing", async () => {
      payload.position = "";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"position" is not allowed to be empty');
    });
    it("Should return 400 if position is less than 2", async () => {
      payload.position = "a";
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch('"position" length must be at least 2');
    });
    it("Should return 400 if position is grater than 255", async () => {
      payload.position = new Array(257).join("a");
      const res = await exec();
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(
        '"position" length must be less than or equal to 255'
      );
    });
    it("Should return 200 if valid experience is sent", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nModified).toBe(1);
    });
  });

  describe("DELETE /me/remove-experience/:experienceId", () => {
    let token;
    let bartender;
    beforeEach(async () => {
      let newExperience = {
        place: "aa",
        from: new Date("01/01/2009"),
        until: new Date("01/31/2015"),
        position: "aa"
      };
      bartender = new Bartender(bartenderList[0]);
      await bartender.save();
      await Bartender.updateOne(
        { _id: bartender._id },
        { $push: { experience: newExperience } }
      );
      token = bartender.generateToken();
    });
    function exec(id) {
      return request(server)
        .delete(`/api/bartenders/me/remove-experience/${id}`)
        .set("x-auth-token", token);
    }
    it("Should return 404 if experience id is invalid", async () => {
      const res = await exec("invalidId");
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch("Invalid id provided");
    });
    it("Should return 404 if experience id is invalid", async () => {
      const id = new mongoose.Types.ObjectId();
      const res = await exec(id);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch("No experience with this id");
    });
    it("Should return 200 if experience id is correct", async () => {
      const user = await Bartender.findById(bartender._id);
      const id = user.experience[0]._id;
      const res = await exec(id);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nModified).toBe(1);
    });
  });

  describe("DELETE /me", () => {
    it("Should return 401 if no token is provided", async () => {
      const res = await request(server).delete("/api/bartenders/me");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch("Access denied");
    });
    it("Should return 400 if invalid token is provided", async () => {
      const res = await request(server)
        .delete("/api/bartenders/me")
        .set("x-auth-token", "invalid-token");
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch("Invalid token");
    });
    it("Should return 200 if valid token is provided", async () => {
      const bartender = await new Bartender(bartenderList[0]).save();
      const token = bartender.generateToken();
      const res = await request(server)
        .delete("/api/bartenders/me")
        .set("x-auth-token", token);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(
        `${bartender.username} user was successfully removed`
      );
    });
  });
});
