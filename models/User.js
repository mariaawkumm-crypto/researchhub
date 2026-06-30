const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullName: String,
    regNo: String,
    email: String,
    department: String,
    degreeLevel: String,
    password: String,
    role: {
        type: String,
        default: "student"
    }
   

});

module.exports = mongoose.model("User", userSchema);