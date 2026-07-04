const User = require("../models/User");
const Research = require("../models/Research");

// ==========================================
// ADMIN PANEL
// ==========================================

exports.adminPanel = async (req, res) => {

    try {

        const users = await User.find();

        const researches = await Research.find().sort({ _id: -1 });

        res.render("admin", {

            users,
            researches

        });

    } catch (error) {

        console.log(error);

        res.status(500).render("error", {
            title: "Admin Error",
            message: "We couldn't load the admin panel. Please try again."
        });

    }

};
