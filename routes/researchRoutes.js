const express = require("express");
const router = express.Router();

const researchController = require("../controllers/researchController");
const upload = require("../middlewares/upload");
const { isLoggedIn, isOwnerOrAdmin } = require("../middlewares/auth");

// Upload research
router.get("/upload-research", isLoggedIn, researchController.uploadPage);

router.post(
    "/upload-research",
    isLoggedIn,
    researchController.handleUploadFile(upload),
    researchController.saveResearch
);

// Repository + search
router.get("/researches", researchController.listResearches);

// Edit research
router.get("/edit-research/:id", isLoggedIn, isOwnerOrAdmin, researchController.editPage);
router.post("/edit-research/:id", isLoggedIn, isOwnerOrAdmin, researchController.updateResearch);

// Delete research
router.get("/delete-research/:id", isLoggedIn, isOwnerOrAdmin, researchController.deleteResearch);

module.exports = router;
