const express = require("express");

const {
    authenticate,
    authorize
} = require("../middleware/auth");

const {
    createIntervention,
    getInterventions,
    updateIntervention,
    suggestions,
    sendSuggestion
} = require("../controllers/interventionController");

const router = express.Router();

router.get('/suggestions', authenticate, authorize('FACULTY', 'ADMIN'), suggestions);
router.post('/suggestions/:studentId/send', authenticate, authorize('FACULTY', 'ADMIN'), sendSuggestion);


router.get(
    "/",
    authenticate,
    authorize("FACULTY", "ADMIN", "STUDENT"),
    getInterventions
);


router.post(
    "/",
    authenticate,
    authorize("FACULTY", "ADMIN"),
    createIntervention
);


router.put(
    "/:id",
    authenticate,
    authorize("FACULTY", "ADMIN"),
    updateIntervention
);


module.exports = router;
