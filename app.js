// IMPORT REQUIRED PACKAGES

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const multer = require("multer");
const path = require("path");

const User = require("./models/User");
const Research = require("./models/Research");

const app = express();

// ==========================================

// APP SETTINGS

// Set EJS as Template Engine
app.set("view engine", "ejs");

// Serve Static Files
app.use(express.static(path.join(__dirname, "public")));

// Parse Form Data
app.use(express.urlencoded({ extended: true }));

// Parse JSON Data
app.use(express.json());

// ==========================================

// SESSION CONFIGURATION

app.use(
  session({
    secret: process.env.SESSION_SECRET,

    resave: false,

    saveUninitialized: false,

    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 Day
    },
  }),
);

// ==========================================

// GLOBAL USER MIDDLEWARE
// Makes Logged-in User Available in All Views

app.use(async (req, res, next) => {
  try {
    if (req.session.userId) {
      const user = await User.findById(req.session.userId);

      res.locals.user = user;
    } else {
      res.locals.user = null;
    }

    next();
  } catch (error) {
    console.log(error);

    res.locals.user = null;

    next();
  }
});

// ==========================================

// MULTER CONFIGURATION
// Upload PDF Files Only

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },

  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;

    cb(null, uniqueName);
  },
});

// Allow Only PDF Files

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed."), false);
  }
};

const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// ==========================================
// CONNECT TO MONGODB ATLAS
// ==========================================

mongoose
  .connect(process.env.MONGODB_URI)

  .then(() => {
    console.log("✅ MongoDB Atlas Connected Successfully");
  })

  .catch((error) => {
    console.log("❌ MongoDB Connection Failed");

    console.log(error);
  });

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

function isAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  User.findById(req.session.userId)

    .then((user) => {
      if (!user || user.role !== "admin") {
        return res.send("Access Denied");
      }

      next();
    })

    .catch((err) => {
      console.log(err);

      res.send("Something went wrong");
    });
}

// ==========================================
// HOME PAGE
// ==========================================

app.get("/", async (req, res) => {
  try {
    // Total Research

    const totalResearch = await Research.countDocuments();

    // Total Departments

    const departments = await Research.distinct("department");

    const totalDepartments = departments.length;

    // BS Research

    const totalBS = await Research.countDocuments({
      degreeLevel: "BS",
    });

    // MS Research

    const totalMS = await Research.countDocuments({
      degreeLevel: { $in: ["MS", "MS/MPhil", "MPhil"] },
    });

    // Latest Research

    const latestResearch = await Research.find()

      .sort({ createdAt: -1 })

      .limit(6);

    // ==========================================
    // DEPARTMENTS OVERVIEW
    // Count Research Papers Department Wise
    // ==========================================

    const departmentStats = await Research.aggregate([
      {
        $group: {
          _id: "$department",

          totalResearch: { $sum: 1 },
        },
      },

      {
        $sort: {
          totalResearch: -1,
        },
      },
    ]);

    res.render("index", {
      totalResearch,

      totalDepartments,

      totalBS,

      totalMS,

      latestResearch,

      departmentStats,
    });
  } catch (error) {
    console.log(error);

    res.send("Unable to Load Home Page");
  }
});

// ==========================================
// REGISTER PAGE
// ==========================================

app.get("/register", (req, res) => {
  res.render("register");
});

// ==========================================
// REGISTER USER
// ==========================================

app.post("/register", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = new User({
      fullName: req.body.fullName,
      regNo: req.body.regNo,
      email: req.body.email,
      department: req.body.department,
      degreeLevel: req.body.degreeLevel,
      password: hashedPassword,
    });

    await user.save();

    res.redirect("/login");
  } catch (error) {
    console.log(error);

    res.send("Registration Failed");
  }
});

// ==========================================
// LOGIN PAGE
// ==========================================

app.get("/login", (req, res) => {
  res.render("login");
});

// ==========================================
// LOGIN USER
// ==========================================

app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email,
    });

    if (!user) {
      return res.send("Invalid Email or Password");
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);

    if (!isMatch) {
      return res.send("Invalid Email or Password");
    }

    // ==========================================

    // SAVE USER SESSION

    req.session.userId = user._id;

    // 🔥 ROLE BASED REDIRECT (MAIN FIX)
    if (user.role === "admin") {
      return res.redirect("/admin");
    } else {
      return res.redirect("/dashboard");
    }
  } catch (error) {
    console.log(error);
    res.send("Login Failed");
  }
});

// ==========================================
// DASHBOARD
// ==========================================

app.get("/dashboard", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    const researches = await Research.find({
      userId: req.session.userId,
    });

    res.render("dashboard", {
      user,
      researches,
    });
  } catch (error) {
    console.log(error);

    res.send("Dashboard Error");
  }
});

// ==========================================
// ADMIN
// ==========================================

app.get("/admin", isAdmin, async (req, res) => {
  const users = await User.find();

  const researches = await Research.find();

  res.render("admin", {
    users,
    researches,
  });
});

// ==========================================
// LOGOUT
// ==========================================

app.get("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.send("Logout Failed");
    }

    res.redirect("/");
  });
});

// ==========================================
// UPLOAD RESEARCH PAGE
// ==========================================

app.get("/upload-research", isLoggedIn, (req, res) => {
  res.render("uploadResearch");
});

// ==========================================
// SAVE RESEARCH
// ==========================================

app.post(
  "/upload-research",
  isLoggedIn,
  upload.single("pdf"),
  async (req, res) => {
    try {
      console.log("Session User ID:", req.session.userId);
      console.log("Session Data:", req.session);

      // Check if PDF is uploaded

      if (!req.file) {
        return res.send("Please upload a valid PDF file.");
      }

      console.log("Uploaded File:", req.file);

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
        pdfFile: req.file.filename,
      });

      await research.save();

      res.redirect("/researches");
    } catch (error) {
      console.log(error);

      res.send("Upload Failed");
    }
  },
);

// ==========================================
// REPOSITORY PAGE + SEARCH
// ==========================================

app.get("/researches", async (req, res) => {
  try {
    const search = req.query.search || "";

    let researches;

    if (search) {
      researches = await Research.find({
        $or: [
          { title: { $regex: search, $options: "i" } },

          { studentName: { $regex: search, $options: "i" } },

          { department: { $regex: search, $options: "i" } },

          { supervisor: { $regex: search, $options: "i" } },
        ],
      });
    } else {
      researches = await Research.find().sort({ _id: -1 });
    }

    res.render("researches", {
      researches,
      search,
    });
  } catch (error) {
    console.log(error);

    res.send("Unable to Load Repository");
  }
});

// ==========================================
// EDIT PAGE
// ==========================================

// ==========================================
// EDIT RESEARCH PAGE
// Only Owner or Admin Can Edit
// ==========================================

app.get("/edit-research/:id", isLoggedIn, async (req, res) => {

    try {

        const research = await Research.findById(req.params.id);

        if (!research) {

            return res.send("Research Not Found");

        }

        // Only Owner or Admin Can Edit
        if (
            research.userId.toString() !== req.session.userId &&
            req.session.userRole !== "admin"
        ) {

            return res.send("Access Denied");

        }

        res.render("editResearch", {

            research

        });

    }

    catch (error) {

        console.log(error);

        res.send("Research Not Found");

    }

});

// ==========================
// UPDATE RESEARCH
// ==========================

app.post("/edit-research/:id", isLoggedIn, async (req, res) => {
  try {
    await Research.findByIdAndUpdate(req.params.id, {
      title: req.body.title,
      studentName: req.body.studentName,
      department: req.body.department,
      degreeLevel: req.body.degreeLevel,
      year: req.body.year,
      supervisor: req.body.supervisor,
      abstract: req.body.abstract,
      researchGap: req.body.researchGap,
    });

    res.redirect("/researches");
  } catch (error) {
    console.log(error);

    res.send("Update Failed");
  }
});

// ==========================================
// DELETE RESEARCH
// Only Owner or Admin Can Delete
// ==========================================

app.get("/delete-research/:id", isLoggedIn, async (req, res) => {

    try {

        const research = await Research.findById(req.params.id);

        if (!research) {

            return res.send("Research Not Found");

        }

        // Only Owner or Admin Can Delete
        if (
            research.userId.toString() !== req.session.userId &&
            req.session.userRole !== "admin"
        ) {

            return res.send("Access Denied");

        }

        await Research.findByIdAndDelete(req.params.id);

        res.redirect("/researches");

    }

    catch (error) {

        console.log(error);

        res.send("Delete Failed");

    }

});

// ==========================================
// START SERVER
// ==========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(` Server Running on Port ${PORT}`);

  console.log(` http://localhost:${PORT}`);
});
