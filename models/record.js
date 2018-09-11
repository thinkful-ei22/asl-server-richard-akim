const mongoose = require("mongoose");

const RecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question"
  },
  correct: { type: Number, default: 0 },
  incorrect: { type: Number, default: 0 }
});

RecordSchema.set("toObject", {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
  }
});

module.exports = mongoose.model("Record", RecordSchema);
