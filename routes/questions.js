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
      return User.findOneAndUpdate({ _id: userId }, {$set: {questions: array, totalCorrect: 0, totalWrong: 0, head: 0, needImprove: []}}, { new: true });
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

  if (typeof correct !== 'boolean') {
    const err = new Error("The `correct` is not boolean");
    err.status = 400;
    return next(err);
  }
  let answeredHead, answeredNode;
  User.findOne({ _id: userId })
    .then(user => {
      answeredHead = user.head;
      answeredNode = user.questions[answeredHead];
      correct
        ? (answeredNode.memoryStrength *= 2)
        : (answeredNode.memoryStrength = 1);
      correct
        ? user.totalCorrect += 1
        : user.totalWrong += 1;
      correct ? (answeredNode.correct += 1) : (answeredNode.incorrect += 1);
      // pushes question into needs improve array if ratio is lowest 3
      let succussRatio = answeredNode.correct/(answeredNode.correct+answeredNode.incorrect);
    
      if (user.needImprove.length < 3) {
        user.needImprove.push(answeredNode);
        user.needImprove.sort((a,b) => 
          (a.correct/(a.correct+a.incorrect)) - (b.correct/(b.correct+b.incorrect))
        );
      } else {
        let idInArray = (node) => node.id === answeredNode.id;
        if (user.needImprove.some(idInArray)) {
          for (let i = 0; i < user.needImprove.length; i++) {
            if (user.needImprove[i].id === answeredNode.id) {
              user.needImprove[i] = answeredNode;
            }
          }
          user.needImprove.sort((a,b) => 
            (a.correct/(a.correct+a.incorrect)) - (b.correct/(b.correct+b.incorrect))
          );
        } else {
          if (user.needImprove.length === 3) {
            // since we know the length of the array we can do direct compares
            if (succussRatio < user.needImprove[0].correct/(user.needImprove[0].correct + user.needImprove[0].incorrect)) {
              user.needImprove.unshift(answeredNode);
              user.needImprove.pop();
            } else if (succussRatio < user.needImprove[1].correct/(user.needImprove[1].correct + user.needImprove[1].incorrect)) {
              user.needImprove.splice(1, 0, answeredNode);
              user.needImprove.pop();
            } else if (succussRatio < user.needImprove[2].correct/(user.needImprove[2].correct + user.needImprove[2].incorrect)) {
              user.needImprove.pop();
              user.needImprove.push(answeredNode);
            } 
          }
        }
      }

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
