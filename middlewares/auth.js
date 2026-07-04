const User = require("../models/User");
const Research = require("../models/Research");

// ==========================================
// GLOBAL USER
// Makes res.locals.user available in every EJS page
// ==========================================

async function attachUser(req, res, next) {

    try {

        if (req.session.userId) {

            res.locals.user = await User.findById(req.session.userId);

        } else {

            res.locals.user = null;

        }

    } catch (error) {

        console.log(error);
        res.locals.user = null;

    }

    next();

}

// ==========================================
// LOGIN CHECK MIDDLEWARE
// ==========================================

function isLoggedIn(req, res, next) {

    if (req.session.userId) {

        next();

    } else {

        res.redirect("/login");

    }

}

// ==========================================
// ADMIN CHECK MIDDLEWARE
// ==========================================

function isAdmin(req, res, next) {

    if (!req.session.userId) {

        return res.redirect("/login");

    }

    User.findById(req.session.userId)

    .then(user => {

        if (!user || user.role !== "admin") {

            return res.status(403).render("error", {
                title: "Access Denied",
                message: "You don't have permission to view this page."
            });

        }

        next();

    })

    .catch(err => {

        console.log(err);

        res.status(500).render("error", {
            title: "Something Went Wrong",
            message: "Please try again later."
        });

    });

}

// ==========================================
// OWNERSHIP CHECK MIDDLEWARE
// Only the research owner or an admin may edit/delete a research entry
// ==========================================

async function isOwnerOrAdmin(req, res, next) {

    try {

        const research = await Research.findById(req.params.id);

        if (!research) {

            return res.status(404).render("error", {
                title: "Research Not Found",
                message: "The research you're looking for doesn't exist or was removed."
            });

        }

        const isOwner = research.userId && research.userId.toString() === req.session.userId;
        const isAdminUser = req.session.userRole === "admin";

        if (!isOwner && !isAdminUser) {

            return res.status(403).render("error", {
                title: "Access Denied",
                message: "You can only edit or delete your own research."
            });

        }

        req.research = research;
        next();

    } catch (error) {

        console.log(error);

        res.status(500).render("error", {
            title: "Something Went Wrong",
            message: "Please try again later."
        });

    }

}

module.exports = {
    attachUser,
    isLoggedIn,
    isAdmin,
    isOwnerOrAdmin
};
