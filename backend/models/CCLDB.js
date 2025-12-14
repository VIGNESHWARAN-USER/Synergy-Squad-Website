const mongoose = require("mongoose");

const CCLDBSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    // Changed required to false to prevent validation errors during OTP save
    phoneNumber: {
      type: String,
      required: false, 
      // match: /^[0-9]{10}$/, // Optional: Uncomment if you want strict format when data IS present
    },

    whatsappNumber: {
      type: String,
      required: false,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: false, // Changed to false for flexibility
    },

    branch: {
      type: String,
      required: false, // Changed to false for flexibility
    },

    yearOfStudy: {
      type: String,
      // enum: ["I", "II", "III", "IV"], 
      required: false, // Changed to false for flexibility
    },

    // Changed required to false to prevent validation errors
    idCardPhotocopyUrl: {
      type: String,
      required: false,
    },

    // --- NEW FIELD ADDED ---
    // This is required for your backend logic: user.otp = otp
    otp: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["True", "False"],
      required: false,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CCLDB", CCLDBSchema);