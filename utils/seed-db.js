// Setting up mongoDB local test data

const mongoose = require('mongoose');
const {DATABASE_URL} = require('../config');
const Question = require('../models/question');
const seedQuestions = require('../db/seed/questions.json');

console.log(`Connecting to mongodb at ${DATABASE_URL}`);
mongoose.connect(DATABASE_URL)
  .then(() => {
    console.info('Dropping Database');
    return mongoose.connection.db.dropDatabase();
  })
  .then(() => {
    console.info('Seeding Database');
    return Promise.all([
      Question.insertMany(seedQuestions)
    ]);
  })
  .then(() => {
    console.info('Disconnecting');
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    return mongoose.disconnect();
  });
