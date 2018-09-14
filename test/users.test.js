const {app} = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const {TEST_DATABASE_URL, JWT_EXPIRY, JWT_SECRET} = require('../config');

const User = require('../models/user');
const Question = require('../models/question');
const seedQuestion = require('../db/seed/questions');

const expect = chai.expect;

chai.use(chaiHttp);

describe('uh-SIGN-ment - Users', () => {
  const username = 'exampleUser';
  const password = 'examplePass';
  const name = 'Example User';
  const testUser = {
    username,
    password,
    name
  };

  before(function () {
    return mongoose.connect(TEST_DATABASE_URL)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return Promise.all([
      Question.insertMany(seedQuestion),
      User.createIndexes()
    ]); 
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('/api/user', () => {
    describe('POST', () => {
      it('Should create a new user', () => {

        let res;
        return chai
          .request(app)
          .post('/api/user')
          .send(testUser)
          .then(_res=> {
            res = _res;
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('id', 'username', 'name', 'head', 'totalCorrect', 'totalWrong', 'questions', 'needImprove');
            expect(res.body.id).to.exist;
            expect(res.body.name).to.equal(testUser.name);
            expect(res.body.username).to.equal(testUser.username);

            return User.findOne({username});
          })
          .then(user => {
            expect(user).to.exist;
            expect(user.id).to.equal(res.body.id);
            expect(user.name).to.equal(testUser.name);
            return user.validatePassword(password);
          })
          .then(isValid => {
            expect(isValid).to.be.true;
          });
      });
      it('Should reject users with missing username', function () {
        const testUser = { password, name };
        return chai.request(app).post('/api/user').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Missing \'username\' in request body');
          });
      });
      it('Should reject users with missing password', () => {
        const testUser = {name, username};
        return chai.request(app).post('/api/user').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Missing \'password\' in request body');
          });
      });
      it('Should reject users with non-string username', () => {
        const testUser = {name, username: 1234, password};
        return chai.request(app).post('/api/user').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Field: \'username\' must be type String');
          });
      });
      it('Should reject users with non-string password', () => {
        const testUser = {name, username, password: 1234};
        return chai.request(app).post('/api/user').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Field: \'password\' must be type String');
          });
      });
      it('Should reject users with non-trimmed username', () => {
        const testUser = {name, username: `  ${username}  `, password};
        return chai.request(app).post('/api/user').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Field: \'username\' cannot start or end with whitespace');
          });
      });
      it('Should reject users with non-trimmed password', () => {
        const testUser = {name, username , password:`  ${password}  `};
        return chai.request(app).post('/api/user').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Field: \'password\' cannot start or end with whitespace');
          });
      });
      it('Should reject users with empty username', () => {
        const testUser = {name, username: '', password};
        return chai.request(app).post('/api/user').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Field: \'username\' must be at least 1 characters long');
          });
      });
      it('Should reject users with password less than 10 characters', () => {
        const testUser = {name, username, password: 'abc123'};
        return chai.request(app).post('/api/user').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Field: \'password\' must be at least 10 characters long');
          });
      });
      it('Should reject users with password greater than 72 characters', () => {
        const testUser = {name, username, password: new Array(73).fill('a').join('')};
        return chai.request(app).post('/api/user').send(testUser)
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Field: \'password\' must be at most 72 characters long');
          });
      });
      it('Should reject users with duplicate username', () => {
        const testUser = {name, username, password};
        return User.create(testUser)
          .then(() => {
            return chai.request(app).post('/api/user').send(testUser);
          })
          .then(res => {
            expect(res).to.have.status(400);
            expect(res.body.message).to.equal('The username already exists');
          });
      });
      it('Should trim name', () => {
        const testUser = {name: ` ${name} `, username, password};
        return chai.request(app).post('/api/user').send(testUser)
          .then(res => {
            expect(res).to.have.status(201);
            expect(res).to.be.a('object');
            expect(res.body).to.have.keys('id', 'name', 'username', 'head', 'needImprove', 'questions', 'totalCorrect', 'totalWrong');
            expect(res.body.name).to.equal(name);
            expect(res.body.username).to.equal(username);
            return User.findOne({username});
          })
          .then(user => {
            expect(user).to.not.be.null;
            expect(user.name).to.equal(name);
          });
      });
    });
  });
  describe('GET', () => {
    let token;
    it('Should retrieve records from user', () => {
      return chai.request(app).post('/api/user').send(testUser)
        .then(res => {
          const {name, username, id} = res.body;
          token = jwt.sign({ user: {name, username, id}}, JWT_SECRET, {
            subject: username,
            expiresIn: JWT_EXPIRY,
          });

          return chai.request(app)
            .get('/api/user/progress')
            .set('Authorization', `Bearer ${token}`);
        })
        .then(res => {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.have.key('correct','wrong','needImprove');
        });
    });
  });
});