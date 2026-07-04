const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboardController");
const { isLoggedIn } = require("../middlewares/auth");

router.get("/dashboard", isLoggedIn, dashboardController.dashboard);

module.exports = router;
