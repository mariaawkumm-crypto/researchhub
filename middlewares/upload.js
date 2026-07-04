const multer = require("multer");

// ==========================================
// FILE UPLOAD (Multer)
// Only PDF files, max 20MB
// ==========================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, "public/uploads");

    },

    filename: function (req, file, cb) {

        cb(null, Date.now() + "-" + file.originalname);

    }

});

const upload = multer({

    storage: storage,

    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB
    },

    fileFilter: function (req, file, cb) {

        if (file.mimetype === "application/pdf") {
            cb(null, true);
        } else {
            cb(new Error("Only PDF files are allowed"));
        }

    }

});

module.exports = upload;
