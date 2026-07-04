const User = require("../models/User");
const Research = require("../models/Research");

// ==========================================
// DASHBOARD
// ==========================================

exports.dashboard = async (req, res) => {

    try {

        const user = await User.findById(req.session.userId);

        const researches = await Research.find({

            userId: req.session.userId

        }).sort({ _id: -1 });

        res.render("dashboard", {

            user,
            researches

        });

    }

    catch (error) {

        console.log(error);

        res.status(500).render("error", {
            title: "Dashboard Error",
            message: "We couldn't load your dashboard. Please try again."
        });

    }

};
