const bcrypt = require("bcrypt");
const User = require("../models/User");

// ==========================================
// REGISTER PAGE
// ==========================================

exports.registerPage = (req, res) => {

    res.render("register", { error: null, formData: {} });

};

// ==========================================
// REGISTER USER
// ==========================================

exports.registerUser = async (req, res) => {

    try {

        const existingUser = await User.findOne({ email: req.body.email });

        if (existingUser) {

            return res.status(400).render("register", {
                error: "An account with this email already exists. Please login instead.",
                formData: req.body
            });

        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const user = new User({

            fullName: req.body.fullName,
            regNo: req.body.regNo,
            email: req.body.email,
            department: req.body.department,
            degreeLevel: req.body.degreeLevel,
            password: hashedPassword

        });

        await user.save();

        res.redirect("/login");

    }

    catch (error) {

        console.log(error);

        res.status(500).render("register", {
            error: "Registration failed. Please check your details and try again.",
            formData: req.body
        });

    }

};

// ==========================================
// LOGIN PAGE
// ==========================================

exports.loginPage = (req, res) => {

    res.render("login", { error: null });

};

// ==========================================
// LOGIN USER
// ==========================================

exports.loginUser = async (req, res) => {

    try {

        const user = await User.findOne({
            email: req.body.email
        });

        if (!user) {
            return res.status(400).render("login", { error: "Invalid email or password." });
        }

        const isMatch = await bcrypt.compare(
            req.body.password,
            user.password
        );

        if (!isMatch) {
            return res.status(400).render("login", { error: "Invalid email or password." });
        }

        // SESSION
        req.session.userId = user._id;
        req.session.userName = user.fullName;
        req.session.userRole = user.role;

        // ROLE BASED REDIRECT
        if (user.role === "admin") {
            return res.redirect("/admin");
        } else {
            return res.redirect("/dashboard");
        }

    }

    catch (error) {
        console.log(error);
        res.status(500).render("login", { error: "Login failed. Please try again." });
    }

};

// ==========================================
// LOGOUT
// ==========================================

exports.logout = (req, res) => {

    req.session.destroy((error) => {

        if (error) {

            return res.status(500).render("error", {
                title: "Logout Failed",
                message: "Please try again."
            });

        }

        res.redirect("/");

    });

};
