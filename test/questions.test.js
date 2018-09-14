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
  let user;
  let token;
  beforeEach(function () {
    return Promise.all([
      Question.insertMany(seedQuestion),
      User.createIndexes()
    ])
      .then(() => chai.request(app).post('/api/user').send(testUser))
      .then(res=> {
        user = res.body;
        const {name, username, id} = res.body;
        token = jwt.sign({ user: {name, username, id}}, JWT_SECRET, {
          subject: username,
          expiresIn: JWT_EXPIRY,
        });
      });
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });

  describe('/api/question', () => {
    describe('GET', () => {
      it('Should return the question', () => {
        return chai.request(app).get('/api/question')
          .set('Authorization', `Bearer ${token}`)
          .then(res => {

            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.key('memoryStrength', 'correct', 'incorrect', '_id', 'imageURL', 'imageDescription', 'answer', 'questionId', 'next');

          });
      });
    });

    describe('PUT', () => {
      it('Should reset the question array, correct, incorrect, head, and needImprove array', () => {
        return chai.request(app).put('/api/question/reset')
          .set('Authorization', `Bearer ${token}`)
          .then(res => {
            expect(res).to.have.status(205);
            expect(res.body).to.be.a('object').that.is.empty;
          });
      });
    });

    describe('POST', () => {
      it('Should submit the answer and update data on correct', () => {
        return chai.request(app).post('/api/question')
          .set('Authorization', `Bearer ${token}`)
          .send({correct:true})
          .then(res => {
            
            expect(res).to.have.status(200);
            expect(res).to.be.json;
            expect(res.body).to.be.a('object');
            expect(res.body).to.have.key('memoryStrength', 'correct', 'incorrect', '_id', 'imageURL', 'imageDescription', 'answer', 'questionId', 'next');
            
          });
      });
      it('Should throw an error if correct isn\'t bool', () => {
        return chai.request(app).post('/api/question')
          .set('Authorization', `Bearer ${token}`)
          .send({correct:'false'})
          .then(res => {
            
            expect(res).to.have.status(400);
            expect(res).to.be.json;
            expect(res.body.message).to.equal('The `correct` is not boolean');
            
          });
      });
    });
  });
});