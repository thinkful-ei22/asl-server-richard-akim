const express = require('express');

const router = express.Router();

const Question = require('../models/question');

router.get('/', (req, res, next) => {
  Question.aggregate([ { $sample: { size: 1 } } ])
  // Question.findOne()
    .then(question => res.json(question[0]))
    .catch(err => next(err));
});

module.exports = router;