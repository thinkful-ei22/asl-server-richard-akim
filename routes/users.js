const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const User = require('../models/user');
const Question = require('../models/question');

const router = express.Router();

// Post to register a new user
router.post('/', (req, res, next) => {
  const requiredFields = ['username', 'password'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    const err = new Error(`Missing '${missingField}' in request body`);
    err.status = 422;
    return next(err);
  }

  const stringFields = ['username', 'password', 'name'];
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );

  if (nonStringField) {
    const err = new Error(`Field: '${nonStringField}' must be type String`);
    err.status = 422;
    return next(err);
  }

  // If the username and password aren't trimmed we give an error.  Users might
  // expect that these will work without trimming (i.e. they want the password
  // "foobar ", including the space at the end).  We need to reject such values
  // explicitly so the users know what's happening, rather than silently
  // trimming them and expecting the user to understand.
  // We'll silently trim the other fields, because they aren't credentials used
  // to log in, so it's less of a problem.
  const explicityTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicityTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if (nonTrimmedField) {
    const err = new Error(
      `Field: '${nonTrimmedField}' cannot start or end with whitespace`
    );
    err.status = 422;
    return next(err);
  }

  // Ensures character lengths
  const sizedFields = {
    username: { min: 1 },
    password: { min: 10, max: 72 }
  };

  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      'min' in sizedFields[field] &&
      req.body[field].trim().length < sizedFields[field].min
  );
  if (tooSmallField) {
    const min = sizedFields[tooSmallField].min;
    const err = new Error(
      `Field: '${tooSmallField}' must be at least ${min} characters long`
    );
    err.status = 422;
    return next(err);
  }

  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
      req.body[field].trim().length > sizedFields[field].max
  );

  if (tooLargeField) {
    const max = sizedFields[tooLargeField].max;
    const err = new Error(
      `Field: '${tooLargeField}' must be at most ${max} characters long`
    );
    err.status = 422;
    return next(err);
  }

  let { username, password, name = '' } = req.body;
  name = name.trim();
  
  const shuffle = (array) => {
    let currentIndex = array.length, temporaryValue, randomIndex;
    while(0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
  };

  return Promise.all([User.hashPassword(password), Question.find()])
    .then(([digest, res]) => {
      let questionArray = [];
      for (let i = 0; i < res.length; i++) {
        questionArray.push(res[i]);
      }
      questionArray = shuffle(questionArray);
      let questions = questionArray.map((question, index) => {
        return ({
          imageURL: question.imageURL,
          imageDescription: question.imageDescription,
          answer: question.answer,
          questionId: question.id,
          next : index === questionArray.length - 1 ? null : index + 1});
      });

      const newUser = {
        username,
        password: digest,
        name,
        questions
      };
      return User.create(newUser);
    })
    .then(result => {
      return res
        .status(201)
        .location(`/api/user/${result.id}`)
        .json(result);
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('The username already exists');
        err.status = 400;
      }
      next(err);
    });
});

const jwtAuth = passport.authenticate('jwt', { session: false });

router.get('/progress', jwtAuth, (req, res, next) => {
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error('The `userId` is not valid');
    err.status = 400;
    return next(err);
  }

  let response = {};
  User.findOne({_id:userId})
    .then(user => {
      if (user) {
        response.correct = user.totalCorrect;
        response.wrong = user.totalWrong;
        response.needImprove = user.needImprove;
        res.status(200).json(response);
      } else {
        next();
      }      
    })
    .catch(err => next(err));
});

module.exports = router;
