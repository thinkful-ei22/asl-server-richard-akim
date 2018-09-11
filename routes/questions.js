const express = require('express');

const router = express.Router();

const Question = require('../models/question');

router.get('/', (req, res, next) => {
  console.log('hello');
  Question.find()
    .then(question => res.json(question))
    .catch(err => next(err));
});

module.exports = router;