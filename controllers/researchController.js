const Research = require("../models/Research");

// ==========================================
// UPLOAD RESEARCH PAGE
// ==========================================

exports.uploadPage = (req, res) => {

    res.render("uploadResearch", { error: null, formData: {} });

};

// ==========================================
// HANDLE MULTER ERRORS FOR UPLOAD
// (Wraps upload.single("pdf") so failures render a themed page instead of crashing)
// ==========================================

exports.handleUploadFile = (upload) => (req, res, next) => {

    upload.single("pdf")(req, res, (err) => {

        if (err) {

            return res.status(400).render("uploadResearch", {
                error: err.message === "Only PDF files are allowed"
                    ? "Only PDF files are allowed. Please choose a .pdf file."
                    : "There was a problem uploading your file. Please try again (max size 20MB).",
                formData: req.body
            });

        }

        next();

    });

};

// ==========================================
// SAVE RESEARCH
// ==========================================

exports.saveResearch = async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).render("uploadResearch", {
                error: "Please attach a PDF file of your research.",
                formData: req.body
            });

        }

        const research = new Research({

            userId: req.session.userId,

            title: req.body.title,
            studentName: req.body.studentName,
            department: req.body.department,
            degreeLevel: req.body.degreeLevel,
            year: req.body.year,
            supervisor: req.body.supervisor,
            abstract: req.body.abstract,
            researchGap: req.body.researchGap,
            pdfFile: req.file.filename

        });

        await research.save();

        res.redirect("/dashboard");

    } catch (error) {

        console.log(error);

        res.status(500).render("uploadResearch", {
            error: "Upload failed. Please check your details and try again.",
            formData: req.body
        });

    }

};

// ==========================================
// REPOSITORY PAGE + SEARCH
// ==========================================

exports.listResearches = async (req, res) => {

    try {

        const search = req.query.search || "";

        let researches;

        if (search) {

            researches = await Research.find({

                $or: [

                    { title: { $regex: search, $options: "i" } },
                    { studentName: { $regex: search, $options: "i" } },
                    { department: { $regex: search, $options: "i" } },
                    { supervisor: { $regex: search, $options: "i" } }

                ]

            }).sort({ _id: -1 });

        } else {

            researches = await Research.find().sort({ _id: -1 });

        }

        res.render("researches", {

            researches,
            search

        });

    } catch (error) {

        console.log(error);

        res.status(500).render("error", {
            title: "Unable to Load Repository",
            message: "Please try again in a moment."
        });

    }

};

// ==========================================
// EDIT PAGE
// (req.research is attached by the isOwnerOrAdmin middleware)
// ==========================================

exports.editPage = async (req, res) => {

    res.render("editResearch", {

        research: req.research

    });

};

// ==========================================
// UPDATE RESEARCH
// ==========================================

exports.updateResearch = async (req, res) => {

    try {

        await Research.findByIdAndUpdate(req.params.id, {

            title: req.body.title,
            studentName: req.body.studentName,
            department: req.body.department,
            degreeLevel: req.body.degreeLevel,
            year: req.body.year,
            supervisor: req.body.supervisor,
            abstract: req.body.abstract,
            researchGap: req.body.researchGap

        });

        res.redirect("/researches");

    } catch (error) {

        console.log(error);

        res.status(500).render("error", {
            title: "Update Failed",
            message: "Please try again."
        });

    }

};

// ==========================================
// DELETE RESEARCH
// ==========================================

exports.deleteResearch = async (req, res) => {

    try {

        await Research.findByIdAndDelete(req.params.id);

        res.redirect(req.get("Referer") || "/researches");

    }

    catch (error) {

        console.log(error);

        res.status(500).render("error", {
            title: "Delete Failed",
            message: "Please try again."
        });

    }

};
