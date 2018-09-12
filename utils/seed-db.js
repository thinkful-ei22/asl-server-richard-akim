// Setting up mongoDB local test data

const mongoose = require('mongoose');
const { DATABASE_URL } = require('../config');
const Question = require('../models/question');
const seedQuestions = require('../db/seed/questions.json');
const Record = require('../models/record');
const seedRecords = require('../db/seed/records.json');
const User = require('../models/user');
const seedUsers = require('../db/seed/users.json');

console.log(`Connecting to mongodb at ${DATABASE_URL}`);
mongoose
  .connect(DATABASE_URL)
  .then(() => {
    console.info('Dropping Database');
    return mongoose.connection.db.dropDatabase();
  })
  // .then(() => {
  //   console.log("Seeding Users");
  //   return User.insertMany(seedUsers);
  // })
  .then(() => {
    console.info('Seeding Database');
    return Promise.all([
      Question.insertMany(seedQuestions),
      User.insertMany(seedUsers)
      // Record.insertMany(seedRecords)
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
