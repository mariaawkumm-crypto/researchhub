const Research = require("../models/Research");

// Emoji shown next to each department on the home page.
// Falls back to a generic cap icon for any department not listed here.
const DEPARTMENT_ICONS = {
    "Computer Science": "💻",
    "Software Engineering": "⚙",
    "Information Technology": "🖥",
    "Management Sciences": "📊",
    "Education": "📚",
    "English": "📖",
    "Mathematics": "➗",
    "Physics": "⚛"
};

// ==========================================
// HOME PAGE
// Pulls real counts from the database instead
// of using hardcoded numbers.
// ==========================================

exports.homePage = async (req, res) => {

    try {

        const totalResearch = await Research.countDocuments();

        const bsResearch = await Research.countDocuments({ degreeLevel: "BS" });

        const advancedResearch = await Research.countDocuments({

            degreeLevel: { $in: ["MS", "PhD"] }

        });

        // Group research by department to build the "Departments Overview" section
        const departmentGroups = await Research.aggregate([

            {
                $group: {
                    _id: "$department",
                    count: { $sum: 1 }
                }
            },

            { $sort: { count: -1 } }

        ]);

        const departments = departmentGroups.map((group) => ({

            name: group._id || "Other",
            count: group.count,
            icon: DEPARTMENT_ICONS[group._id] || "🎓"

        }));

        res.render("index", {

            stats: {
                totalDepartments: departments.length,
                totalResearch,
                bsResearch,
                advancedResearch
            },

            departments

        });

    } catch (error) {

        console.log(error);

        // Fail gracefully — still show the home page, just with empty stats
        res.render("index", {

            stats: {
                totalDepartments: 0,
                totalResearch: 0,
                bsResearch: 0,
                advancedResearch: 0
            },

            departments: []

        });

    }

};
