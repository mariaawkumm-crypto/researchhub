// IMPORT MONGOOSE

const mongoose = require("mongoose");

// RESEARCH SCHEMA

const researchSchema = new mongoose.Schema({

    // Research Owner

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Research Title

    title: {
        type: String,
        required: true,
        trim: true
    },

    // Student Name

    studentName: {
        type: String,
        required: true,
        trim: true
    },

    // Department

    department: {
        type: String,
        required: true
    },

    // Degree Level

    degreeLevel: {
        type: String,
        required: true
    },

    // Research Year

    year: {
        type: String,
        required: true
    },

    // Supervisor Name

    supervisor: {
        type: String,
        required: true,
        trim: true
    },

    // Research Abstract

    abstract: {
        type: String,
        required: true
    },

    // Research Gap

    researchGap: {
        type: String,
        default: ""
    },

    // Uploaded PDF File

    pdfFile: {
        type: String,
        required: true
    }

},
{
    timestamps: true
});

// EXPORT MODEL

module.exports = mongoose.model("Research", researchSchema);