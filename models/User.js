// IMPORT MONGOOSE

const mongoose = require("mongoose");

// USER SCHEMA

const userSchema = new mongoose.Schema({

    // Student Full Name
    fullName: {
        type: String,
        required: true,
        trim: true
    },

    // Registration Number
    regNo: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    // Email Address
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    // Department
    department: {
        type: String,
        required: true
    },

    // BS / MS / PhD
    degreeLevel: {
        type: String,
        required: true
    },

    // Encrypted Password
    password: {
        type: String,
        required: true
    },

    // User Role
    role: {
        type: String,
        enum: ["student", "admin"],
        default: "student"
    }

},
{
    timestamps: true
});

// EXPORT MODEL

module.exports = mongoose.model("User", userSchema);