const express = require("express");

const {
    register,
    login
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);
router.post('/admin/login', (req, res, next) => {
    req.adminLogin = true;
    return login(req, res, next);
});

module.exports = router;
