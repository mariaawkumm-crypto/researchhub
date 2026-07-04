const mongoose = require("mongoose");

function connectDB() {

    const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/researchhub";

    mongoose.connect(MONGODB_URI)

    .then(() => {

        console.log("MongoDB Connected");

    })

    .catch((err) => {

        console.log(err);

    });

}

module.exports = connectDB;
