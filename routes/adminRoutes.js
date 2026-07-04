const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const { isAdmin } = require("../middlewares/auth");

router.get("/admin", isAdmin, adminController.adminPanel);

module.exports = router;
