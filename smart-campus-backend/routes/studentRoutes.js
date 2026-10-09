const express = require("express");

const {
    authenticate,
    authorize
} = require("../middleware/auth");

const {
    getStudents,
    getStudentProfile,
    analyzeStudent
} = require("../controllers/studentController");

const router = express.Router();
const studentScope = require('../middleware/studentScope');
const { getPerformance, savePerformance } = require('../controllers/performanceController');
router.get('/me/performance', authenticate, authorize('STUDENT'), getPerformance);
router.put('/me/performance', authenticate, authorize('STUDENT'), savePerformance);


router.get(
    "/",
    authenticate,
    authorize("FACULTY", "ADMIN"),
    getStudents
);


router.get(
    "/:id",
    authenticate,
    studentScope,
    getStudentProfile
);


router.post(
    "/:id/analyze",
    authenticate,
    authorize("FACULTY", "ADMIN"),
    studentScope,
    analyzeStudent
);


module.exports = router;
