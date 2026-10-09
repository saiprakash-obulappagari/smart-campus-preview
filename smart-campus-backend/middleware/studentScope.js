const db = require('../config/db');
async function studentScope(req, res, next) {
    try {
        if (req.user.role === 'ADMIN') return next();
        const id = req.params.id || req.body.studentId;
        const [rows] = await db.query('SELECT user_id,department FROM students WHERE id=?', [id]);
        const student = rows[0];
        if (!student || (req.user.role === 'STUDENT' ? student.user_id !== req.user.id : !req.user.department || student.department !== req.user.department)) {
            return res.status(403).json({ success: false, message: 'This student is outside your assigned department or account.' });
        }
        next();
    } catch (error) { next(error); }
}
module.exports = studentScope;
