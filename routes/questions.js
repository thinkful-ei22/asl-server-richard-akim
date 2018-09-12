const express = require("express");

const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");
const Question = require("../models/question");
const User = require("../models/user");

const jwtAuth = passport.authenticate("jwt", { session: false });

router.get("/", jwtAuth, (req, res, next) => {
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error("The `userId` is not valid");
    err.status = 400;
    return next(err);
  }

  User.findOne({ _id: userId })
    .then(result => result.questions[result.head])
    .then(data => res.status(200).json(data))
    .catch(err => next(err));
});

router.put('/reset', jwtAuth, (req, res, next) => {
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error("The `userId` is not valid");
    err.status = 400;
    return next(err);
  }

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

  Question.find()
    .then(result => {
      
      let questionArray = [];
      for (let i = 0; i < result.length; i++) {
        questionArray.push(result[i]);
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
      return questions;
    })
    .then(array => {
      return User.findOneAndUpdate({ _id: userId }, {$set: {questions: array}}, { new: true });  
    })
    .then(result => {
      if (result) {
        res.status(205).end();
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

router.post("/", jwtAuth, (req, res, next) => {
  const userId = req.user.id;
  const { correct } = req.body;
  let answeredHead, answeredNode;
  User.findOne({ _id: userId })
    .then(user => {
      answeredHead = user.head;
      answeredNode = user.questions[answeredHead];
      correct
        ? (answeredNode.memoryStrength *= 2)
        : (answeredNode.memoryStrength = 1);
      correct ? (answeredNode.correct += 1) : (answeredNode.incorrect += 1);

      user.head = answeredNode.next;
      let nextNode = answeredNode;
      for (let i = 0; i < answeredNode.memoryStrength + 1; i++) {
        nextNode = user.questions[nextNode.next];
      }

      if (answeredNode.memoryStrength > user.questions.length) {
        nextNode = user.questions[user.questions.length - 1];
      }
      answeredNode.next = nextNode.next;
      nextNode.next = answeredHead;
      return Promise.all([user.save(), answeredHead]);
    })
    .then(([result, head]) => Promise.all([
      User.findOneAndUpdate({ _id: userId }, result, { new: true }),
      head
    ]))
    .then(([result,head]) => {
      if (result) {
        res.status(200).json(result.questions[head]);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

module.exports = router;
