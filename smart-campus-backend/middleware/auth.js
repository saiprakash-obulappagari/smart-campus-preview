const jwt = require("jsonwebtoken");
const db = require('../config/db');

async function authenticate(req, res, next) {

    const header = req.headers.authorization;

    if (!header) {
        return res.status(401).json({
            success: false,
            message: "Authorization token required"
        });
    }

    const token = header.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Invalid authorization format"
        });
    }

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const [rows] = await db.query(`SELECT u.id,u.email,u.role,a.status,a.session_version,f.department
            FROM users u JOIN account_access a ON a.user_id=u.id
            LEFT JOIN faculty f ON f.user_id=u.id WHERE u.id=?`, [decoded.id]);
        const account = rows[0];
        if (!account || account.status !== 'APPROVED' || decoded.sessionVersion !== account.session_version) {
            return res.status(403).json({ success: false, message: 'Account approval or a fresh login is required.' });
        }
        req.user = account;

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
}


function authorize(...roles) {

    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated"
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied"
            });
        }

        next();
    };
}


module.exports = {
    authenticate,
    authorize
};
