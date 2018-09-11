const mongoose = require("mongoose");

const RecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true
  },
  correct: { type: Number, default: 0 },
  incorrect: { type: Number, default: 0 }
});

RecordSchema.set("toObject", {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.userId;
    delete ret.questionId;
    delete ret.id;
  }
});

module.exports = mongoose.model("Record", RecordSchema);
