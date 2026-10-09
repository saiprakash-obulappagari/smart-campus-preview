const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");


function createToken(user) {

    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
            , sessionVersion: user.session_version
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "7d"
        }
    );
}


async function register(req, res, next) {

    const connection = await db.getConnection();

    try {

        const {
            name,
            email,
            password,
            role,
            studentId,
            department,
            yearLevel
        } = req.body;

        if (!name || !email || !password || !role) {

            return res.status(400).json({
                success: false,
                message: "Name, email, password and role are required"
            });
        }

        const allowedRoles = [
            "STUDENT",
            "FACULTY"
        ];

        if (!allowedRoles.includes(role)) {

            return res.status(400).json({
                success: false,
                message: "Invalid registration role"
            });
        }

        if (role === "FACULTY" && (typeof req.body.facultyId !== 'string' || !req.body.facultyId.trim() || typeof department !== 'string' || !department.trim())) {
            return res.status(400).json({ success: false, message: "Faculty ID and department are required" });
        }

        const [existing] = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existing.length > 0) {

            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        const passwordHash =
            await bcrypt.hash(password, 10);

        await connection.beginTransaction();

        const [userResult] = await connection.query(
            `INSERT INTO users
             (name,email,password_hash,role)
             VALUES (?,?,?,?)`,
            [
                name,
                email,
                passwordHash,
                role
            ]
        );

        const userId = userResult.insertId;

        await connection.query('INSERT INTO account_access (user_id,status) VALUES (?,?)', [userId, role === 'FACULTY' ? 'PENDING' : 'APPROVED']);

        await connection.query(
            "INSERT INTO register (user_id) VALUES (?)",
            [userId]
        );

        if (role === "FACULTY") {
            await connection.query(
                "INSERT INTO faculty (user_id, faculty_id, department) VALUES (?, ?, ?)",
                [userId, req.body.facultyId || null, department || null]
            );
        }

        if (role === "STUDENT") {

            await connection.query(
                `INSERT INTO students
                (user_id,student_id,department,year_level)
                VALUES (?,?,?,?)`,
                [
                    userId,
                    studentId,
                    department,
                    yearLevel
                ]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: role === 'FACULTY' ? 'Faculty application submitted. Administrator approval is required before login.' : 'Account created successfully'
        });

    } catch (error) {

        await connection.rollback();

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ success: false, message: "Email or campus ID is already registered" });
        }

        next(error);

    } finally {

        connection.release();
    }
}


async function login(req, res, next) {

    try {

        const {
            email,
            password
        } = req.body;

        if (typeof email !== "string" || !email.trim() ||
            typeof password !== "string" || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const [rows] = await db.query(
            `SELECT
                id,
                name,
                email,
                password_hash,
                role
             FROM users
             WHERE email = ?`,
            [email.trim()]
        );

        if (rows.length === 0) {

            return res.status(401).json({
                success: false,
                code: "ACCOUNT_NOT_FOUND",
                message: "Account does not exist. Please sign up."
            });
        }

        const user = rows[0];

        const validPassword =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!validPassword) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (req.adminLogin && user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Administrator access only. Use the student or faculty login page.' });
        }
        const [access] = await db.query('SELECT status,session_version FROM account_access WHERE user_id=?', [user.id]);
        if (!access.length || access[0].status !== 'APPROVED') {
            return res.status(403).json({ success: false, message: 'Your account is awaiting administrator approval or has been rejected. Contact your administrator.' });
        }
        user.session_version = access[0].session_version;

        const token = createToken(user);

        await db.query(
            "INSERT INTO login (user_id) VALUES (?)",
            [user.id]
        );

        delete user.password_hash;

        res.json({
            success: true,
            token,
            user
        });

    } catch (error) {

        next(error);
    }
}


module.exports = {
    register,
    login
};
