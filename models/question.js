const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  imageURL: String,
  imageDescription: String,
  answer: String
});

QuestionSchema.set("toObject", {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
  }
});

module.exports = mongoose.model("Question", QuestionSchema);
