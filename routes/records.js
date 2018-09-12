const express = require('express');
const passport = require('passport');
const Record = require('../models/record');
const mongoose = require('mongoose');

const router = express.Router();

const jwtAuth = passport.authenticate('jwt', { session: false });

/* 
When the user answers a question, we send an object from the frontend with 
the question ID and "correct" property whose value indicates whether the user
got that question right or not.
*/
router.post('/', jwtAuth, (req, res, next) => {

  const userId = req.user.id;
  const questionId = req.body.questionId;

  const userCorrect = req.body.correct;
  //we check if the user already has a record for this question
  Record.findOne({ $and: [{ questionId }, { userId }] })
    .then(response => {
      //in case that this is the first time the user is answering this question
      if (!response && !userCorrect) {
        return Record.create({
          questionId,
          userId,
          correct: 0,
          incorrect: 1
        });
      } else if (!response && userCorrect) {
        return Record.create({
          questionId,
          userId,
          correct: 1,
          incorrect: 0
        });
      }
      //in case the user has answered this question before
      else if (response && !userCorrect) {
        return Record.findOneAndUpdate(
          {
            $and: [{ questionId }, { userId }]
          },
          { $inc: { incorrect: 1 } },
          { new: true }
        );
      } else {
        return Record.findOneAndUpdate(
          {
            $and: [{ questionId }, { userId }]
          },
          { $inc: { correct: 1 } },
          { new: true }
        );
      }
    })
    .then(newRecord => {
      console.log(newRecord);
      res.json(newRecord);
      return;
    })
    .catch(err => console.log(err));
});

module.exports = router;
