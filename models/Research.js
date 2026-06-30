const mongoose = require("mongoose");

const researchSchema = new mongoose.Schema({

    userId: 
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    title: String,
    studentName: String,
    department: String,
    degreeLevel: String,
    year: String,
    supervisor: String,
    abstract: String,
    researchGap: String,
    pdfFile: String
});

module.exports = mongoose.model("Research", researchSchema);