const express = require('express');

const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');
const Question = require('../models/question');
const User = require('../models/user');

const jwtAuth = passport.authenticate('jwt', { session: false });


router.get('/', (req, res, next) => {
  Question.aggregate([ { $sample: { size: 1 } } ])
    .then(question => res.json(question[0]))
    .catch(err => next(err));
});

router.get('/', jwtAuth, (req, res, next) => {
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error('The `userId` is not valid');
    err.status = 400;
    return next(err);
  }

  User.findOne({_id: userId})
    .then(result => result.questions[result.head])
    .then(data => res.json(data))
    .catch(err => next(err));
});

router.post('/', jwtAuth, (req, res, next) => {
  const userId = req.user.id;
  const {correct} = req.body;
  let answeredHead;
  let answeredNode;
  User.findOne({_id: userId})
    .then(user => {
      answeredHead = user.head;
      answeredNode = user.questions[answeredHead];
      // nextHead = user.questions.indexOf(user.questions[user.questions[answeredHead].next]);
      // console.log('answeredNode', answeredNode);
      correct ? answeredNode.memoryStrength *= 2 : answeredNode.memoryStrength = 1;
      
      user.head = answeredNode.next;
      let nextNode = answeredNode;
      for (let i = 0; i < answeredNode.memoryStrength+1; i++) {
        nextNode = user.questions[nextNode.next];
      }

      if (answeredNode.memoryStrength > user.questions.length) {
        nextNode = user.questions[user.questions.length-1];
      }
      // console.log('answeredNode', answeredNode);
      // console.log('resultNode ', result.questions[answeredHead]);
      // user.questions[answeredHead].next = answeredNode.next;
      // answeredNode.next = answeredHead;
      // user.head = nextHead;
      answeredNode.next = nextNode.next;
      nextNode.next = answeredHead;
      return user.save();
    })
    .then(result => User.findOneAndUpdate({_id: userId}, result, {new:true}))
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => next(err));

});

module.exports = router;