const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: { type: String, default: "" },
  questions: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
      imageURL: String,
      imageDescription: String,
      answer: String,
      memoryStrength: { type: Number, default: 1 },
      next: Number,
      correct: { type: Number, default: 0 },
      incorrect: { type: Number, default: 0 }
    }
  ],
  head: { type: Number, default: 0 },
  totalCorrect: { type:Number, default: 0}, 
  totalWrong : { type:Number, default:0 }
});

UserSchema.set("toObject", {
  virtuals: true, // include built-in virtual `id`
  versionKey: false, // remove `__v` version key
  transform: (doc, ret) => {
    delete ret._id; // delete `_id`
    delete ret.password;
  }
});

UserSchema.methods.serialize = function() {
  return {
    username: this.username || "",
    name: this.name || ""
  };
};

UserSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

module.exports = mongoose.model("User", UserSchema);
