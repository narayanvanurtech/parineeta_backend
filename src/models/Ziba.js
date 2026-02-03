const mongoose = require("mongoose");

/* Subject Schema */
const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Subject = mongoose.model("Subject", subjectSchema);

/* Ziba Schema */
const ZibaSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
    message:{
        type:String,
        required:true
    }
  },
  { timestamps: true }
);

const Ziba = mongoose.model("Ziba", ZibaSchema);

module.exports = { Ziba, Subject };
