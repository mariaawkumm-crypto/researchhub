const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

router.get("/register", authController.registerPage);
router.post("/register", authController.registerUser);

router.get("/login", authController.loginPage);
router.post("/login", authController.loginUser);

router.get("/logout", authController.logout);

module.exports = router;
