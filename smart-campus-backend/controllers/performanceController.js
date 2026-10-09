const db = require('../config/db');
const fields = ['attendance', 'lms', 'engagement', 'coding', 'aptitude', 'interview', 'skills', 'feedback'];

async function getPerformance(req, res, next) {
    try {
        const [rows] = await db.query(`SELECT s.student_id AS campus_id, s.department, s.year_level, p.* FROM students s LEFT JOIN student_performance p ON p.student_id=s.id WHERE s.user_id=?`, [req.user.id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Student profile not found' });
        rows[0].student_id = rows[0].campus_id;
        const [submissions] = await db.query('SELECT ps.* FROM performance_submissions ps JOIN students s ON s.id=ps.student_id WHERE s.user_id=? ORDER BY ps.id DESC LIMIT 1', [req.user.id]);
        res.json({ success: true, data: rows[0], submission: submissions[0] || null });
    } catch (error) { next(error); }
}

async function savePerformance(req, res, next) {
    try {
        const values = fields.map(field => req.body[field]);
        if (values.some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100)) {
            return res.status(400).json({ success: false, message: 'All eight values must be numbers between 0 and 100.' });
        }
        const [students] = await db.query('SELECT id FROM students WHERE user_id=?', [req.user.id]);
        if (!students.length) return res.status(404).json({ success: false, message: 'Student profile not found' });
        if (typeof req.body.evidence !== 'string' || !req.body.evidence.trim() || req.body.evidence.length > 4000) return res.status(400).json({ success: false, message: 'Provide supporting evidence or record references (up to 4000 characters).' });
        const submitted = Object.fromEntries(fields.map((field, index) => [field, values[index]]));
        await db.query('INSERT INTO performance_submissions (student_id,submitted_values,evidence) VALUES (?,?,?)', [students[0].id, JSON.stringify(submitted), req.body.evidence.trim()]);
        res.json({ success: true, message: 'Submitted for faculty verification. Official values remain unchanged.' });
    } catch (error) { next(error); }
}
module.exports = { getPerformance, savePerformance };
