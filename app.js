// ==========================================
// IMPORTS
// ==========================================

const express = require("express");
const session = require("express-session");

require("dotenv").config();

const connectDB = require("./config/db");
const { attachUser } = require("./middlewares/auth");

const pageRoutes = require("./routes/pageRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const researchRoutes = require("./routes/researchRoutes");

const app = express();


// ==========================================
// DATABASE
// ==========================================

connectDB();


// ==========================================
// APP SETTINGS
// ==========================================

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));


// ==========================================
// SESSION CONFIGURATION
// ==========================================

app.use(
    session({
        secret: process.env.SESSION_SECRET || "researchhub-dev-secret",
        resave: false,
        saveUninitialized: false
    })
);


// ==========================================
// GLOBAL USER
// Available in every EJS page as `user`
// ==========================================

app.use(attachUser);


// ==========================================
// ROUTES
// ==========================================

app.use("/", pageRoutes);
app.use("/", authRoutes);
app.use("/", dashboardRoutes);
app.use("/", adminRoutes);
app.use("/", researchRoutes);


// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {

    res.status(404).render("error", {
        title: "Page Not Found",
        message: "The page you're looking for doesn't exist."
    });

});


// ==========================================
// SERVER
// ==========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(" Server running on Port " + PORT);
    console.log(" http://localhost:" + PORT);

});
