// ==========================================
// IMPORTS
// ==========================================

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const multer = require("multer");

const User = require("./models/User");
const Research = require("./models/Research");

const app = express();


// ==========================================
// APP SETTINGS
// ==========================================

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));


// ==========================================
// SESSION CONFIGURATION
// ==========================================

app.use(
    session({
        secret: "researchhubsecret",
        resave: false,
        saveUninitialized: false
    })
);


// ==========================================
// GLOBAL USER
// Available in every EJS page
// ==========================================

app.use((req, res, next) => {

    res.locals.user = req.session.userName || null;

    next();

});


// ==========================================
// FILE UPLOAD (Multer)
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

    storage: storage

});


// ==========================================
// DATABASE CONNECTION
// ==========================================

mongoose.connect("mongodb://127.0.0.1:27017/researchhub")

.then(() => {

    console.log("MongoDB Connected");

})

.catch((err) => {

    console.log(err);

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

    .then(user => {

        if (!user || user.role !== "admin") {

            return res.send("Access Denied");

        }

        next();

    })

    .catch(err => {

        console.log(err);

        res.send("Something went wrong");

    });

}

// ==========================================
// HOME PAGE
// ==========================================

app.get("/", (req, res) => {

    res.render("index");

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
            password: hashedPassword

        });

        await user.save();

        res.redirect("/login");

    }

    catch (error) {

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
            email: req.body.email
        });

        if (!user) {
            return res.send("Invalid Email or Password");
        }

        const isMatch = await bcrypt.compare(
            req.body.password,
            user.password
        );

        if (!isMatch) {
            return res.send("Invalid Email or Password");
        }

        // SESSION
        req.session.userId = user._id;
        req.session.userName = user.fullName;
        req.session.userRole = user.role;

        // 🔥 ROLE BASED REDIRECT (MAIN FIX)
        if (user.role === "admin") {
            return res.redirect("/admin");
        } else {
            return res.redirect("/dashboard");
        }

    }

    catch (error) {
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

            userId: req.session.userId

        });

        res.render("dashboard", {

            user,
            researches

        });

    }

    catch(error){

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
        researches

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

            res.redirect("/researches");

        } catch (error) {

            console.log(error);

            res.send("Upload Failed");

        }

    }
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

                    { supervisor: { $regex: search, $options: "i" } }

                ]

            });

        } else {

            researches = await Research.find().sort({ _id: -1 });

        }

        res.render("researches", {

            researches,
            search

        });

    } catch (error) {

        console.log(error);

        res.send("Unable to Load Repository");

    }

});

// ==========================================
// EDIT PAGE
// ==========================================

app.get("/edit-research/:id", isLoggedIn, async (req, res) => {

    try {

        const research = await Research.findById(req.params.id);

        res.render("editResearch", {

            research

        });

    }

    catch(error){

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
            researchGap: req.body.researchGap

        });

        res.redirect("/researches");

    } catch (error) {

        console.log(error);

        res.send("Update Failed");

    }

});

// ==========================
// DELETE RESEARCH
// ==========================

app.get("/delete-research/:id", isLoggedIn, async (req, res) => {

    try {

        await Research.findByIdAndDelete(req.params.id);

        res.redirect("/researches");

    }

    catch(error){

        console.log(error);

        res.send("Delete Failed");

    }

});




// ==========================================
// SERVER
// ==========================================

app.listen(3000, () => {

    console.log("🚀 Server running on Port 3000");
    console.log("🌐 http://localhost:3000");
    

});














// // IMPORTS
// const express = require("express");
// const mongoose = require("mongoose");
// const User = require("./models/User");
// const Research = require("./models/Research");
// const multer = require("multer");
// const bcrypt = require("bcrypt");
// const session = require("express-session");

// const app = express();


// // SETTINGS

// app.set("view engine", "ejs");

// app.use(express.static("public"));
// app.use(express.urlencoded({ extended: true }));

// // SESSION CONFIGURATION

// app.use(
//   session({
//     secret: "researchhubsecret",
//     resave: false,
//     saveUninitialized: false,
//   }),
// );

// // FILE UPLOAD CONFIGURATION

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/uploads");
//   },

//   filename: function (req, file, cb) {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });

// const upload = multer({ storage: storage });

// // DATABASE CONNECTION

// mongoose
//   .connect("mongodb://127.0.0.1:27017/researchhub")

//   .then(() => console.log("MongoDB Connected"))

//   .catch((err) => console.log(err));

// // LOGIN CHECK MIDDLEWARE

// function isLoggedIn(req, res, next) {
//   if (req.session.userId) {
//     next();
//   } else {
//     res.redirect("/login");
//   }
// }

// // HOME PAGE

// app.get("/", (req, res) => {
//   res.render("index");
// });

// // REGISTER PAGE

// app.get("/register", (req, res) => {
//   res.render("register");
// });

// // REGISTER USER

// app.post("/register", async (req, res) => {
//   try {
//     const hashedPassword = await bcrypt.hash(req.body.password, 10);

//     const user = new User({
//       fullName: req.body.fullName,
//       regNo: req.body.regNo,
//       email: req.body.email,
//       department: req.body.department,
//       degreeLevel: req.body.degreeLevel,
//       password: hashedPassword,
//     });

//     await user.save();

//     res.send("Registration Successful");
//   } catch (error) {
//     console.log(error);

//     res.send("Error while registering");
//   }
// });

// // LOGIN PAGE

// app.get("/login", (req, res) => {
//   res.render("login");
// });

// // LOGIN USER

// app.post("/login", async (req, res) => {
//   try {
//     const user = await User.findOne({
//       email: req.body.email,
//     });

//     if (!user) {
//       return res.send("Invalid Email or Password");
//     }

//     const isMatch = await bcrypt.compare(req.body.password, user.password);

//     if (isMatch) {
//       req.session.userId = user._id;
//       req.session.userName = user.fullName;

//       res.redirect("/dashboard");
//     } else {
//       res.send("Invalid Email or Password");
//     }
//   } catch (error) {
//     console.log(error);

//     res.send("Login Error");
//   }
// });

// // DASHBOARD

// app.get("/dashboard", isLoggedIn, (req, res) => {
//   res.render("dashboard");
// });

// // LOGOUT

// app.get("/logout", (req, res) => {
//   req.session.destroy();

//   res.redirect("/login");
// });

// // UPLOAD RESEARCH PAGE

// app.get("/upload-research", isLoggedIn, (req, res) => {
//   res.render("uploadResearch");
// });


// // =========================
// // SAVE RESEARCH
// // =========================

// app.post(
//   "/upload-research",
//   isLoggedIn,
//   upload.single("pdf"),
//   async (req, res) => {

//     try {

//       const research = new Research({

//         title: req.body.title,
//         studentName: req.body.studentName,
//         department: req.body.department,
//         degreeLevel: req.body.degreeLevel,
//         year: req.body.year,
//         supervisor: req.body.supervisor,
//         abstract: req.body.abstract,
//         researchGap: req.body.researchGap,
//         pdfFile: req.file.filename

//       });

//       await research.save();

//       res.redirect("/researches");

//     } catch (error) {

//       console.log(error);

//       res.send("Upload Failed");

//     }

// });

// // ==========================
// // REPOSITORY PAGE + SEARCH
// // ==========================

// app.get("/researches", async (req, res) => {

//     const search = req.query.search || "";

//     let researches;

//     if (search) {

//         researches = await Research.find({

//             $or: [

//                 { title: { $regex: search, $options: "i" } },

//                 { studentName: { $regex: search, $options: "i" } },

//                 { department: { $regex: search, $options: "i" } },

//                 { supervisor: { $regex: search, $options: "i" } }

//             ]

//         });

//     } else {

//         researches = await Research.find();

//     }

//     res.render("researches", {

//         researches,
//         search

//     });

// });

// // =========================
// // LOGOUT
// // =========================

// app.get("/logout", (req, res) => {

//     req.session.destroy((error) => {

//         if (error) {

//             return res.send("Logout Failed");

//         }

//         res.redirect("/");

//     });

// });


// // =========================
// // GLOBAL USER
// // =========================

// app.use((req, res, next) => {

//     res.locals.user = req.session.userName;

//     next();

// });
// // SERVER

// app.listen(3000, () => {
//   console.log("Server running on port 3000");
// });
