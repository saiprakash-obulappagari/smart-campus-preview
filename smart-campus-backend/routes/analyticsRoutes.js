const express = require("express");

const {
    authenticate,
    authorize
} = require("../middleware/auth");

const {
    dashboardAnalytics,
    riskDistribution,
    segments
} = require("../controllers/analyticsController");

const router = express.Router();


router.get(
    "/dashboard",
    authenticate,
    authorize("FACULTY", "ADMIN"),
    dashboardAnalytics
);


router.get(
    "/risk-distribution",
    authenticate,
    authorize("FACULTY", "ADMIN"),
    riskDistribution
);


router.get(
    "/segments",
    authenticate,
    authorize("FACULTY", "ADMIN"),
    segments
);


module.exports = router;