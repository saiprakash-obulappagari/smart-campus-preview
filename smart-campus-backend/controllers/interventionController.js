const db = require("../config/db");
const { getSuggestions } = require('../services/suggestionService');
const { loadUnified } = require('../services/unifiedData');

async function suggestions(req, res, next) {
    try { res.json({ success: true, data: await getSuggestions(req.user) }); }
    catch (error) { next(error); }
}

async function sendSuggestion(req, res, next) {
    try {
        const plan = (await getSuggestions(req.user)).find(item => item.id === Number(req.params.studentId));
        if (!plan) return res.status(404).json({ success: false, message: 'No eligible improvement plan for this student.' });
        if (plan.sent) return res.status(409).json({ success: false, message: 'This improvement plan has already been sent.' });
        req.body = { studentId: plan.id, title: plan.title, description: plan.description };
        return createIntervention(req, res, next);
    } catch (error) { next(error); }
}


async function createIntervention(req, res, next) {

    try {

        const {
            studentId,
            title,
            description
        } = req.body;

        if (!Number.isSafeInteger(Number(studentId)) || Number(studentId) < 1 || typeof title !== 'string' || !title.trim() || title.length > 200 || typeof description !== 'string' || !description.trim() || description.length > 8000) {
            return res.status(400).json({ success: false, message: 'Provide a valid student ID, title, and task description.' });
        }

        const [scope] = await db.query('SELECT department FROM students WHERE id=?', [studentId]);
        if (!scope.length || (req.user.role === 'FACULTY' && scope[0].department !== req.user.department)) return res.status(403).json({ success: false, message: 'Student outside your assigned department.' });

        const student = (await loadUnified(req.user, { studentId })).students[0];
        const beforeSuccess = student?.successScore ?? null;
        const beforeRisk = beforeSuccess == null ? null : 100 - beforeSuccess;

        const [result] = await db.query(
            `
            INSERT INTO interventions
            (
                student_id,
                assigned_by,
                title,
                description,
                status,
                before_success_score,
                before_risk_score
            )
            VALUES (?,?,?,?,?,?,?)
            `,
            [
                studentId,
                req.user.id,
                title,
                description,
                "ASSIGNED",
                beforeSuccess,
                beforeRisk
            ]
        );

        res.status(201).json({

            success: true,

            message:
                "Intervention assigned successfully",

            interventionId:
                result.insertId

        });

    } catch (error) {

        next(error);
    }
}


async function getInterventions(req, res, next) {

    try {

        const [rows] = await db.query(
            `
            SELECT
                i.*,
                s.student_id,
                u.name AS student_name
            FROM interventions i

            JOIN students s
                ON i.student_id = s.id

            JOIN users u
                ON s.user_id = u.id

            ${req.user.role === 'STUDENT' ? 'WHERE s.user_id = ?' : req.user.role === 'FACULTY' ? 'WHERE s.department = ?' : ''}
            ORDER BY i.created_at DESC
            `,
            req.user.role === 'STUDENT' ? [req.user.id] : req.user.role === 'FACULTY' ? [req.user.department || ''] : []
        );

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {

        next(error);
    }
}


async function updateIntervention(req, res, next) {

    try {

        const id = req.params.id;

        const [scope] = await db.query('SELECT s.department FROM interventions i JOIN students s ON s.id=i.student_id WHERE i.id=?', [id]);
        if (!scope.length || (req.user.role === 'FACULTY' && scope[0].department !== req.user.department)) return res.status(403).json({ success: false, message: 'Student outside your assigned department.' });

        const {
            status,
            facultyFeedback,
            afterSuccessScore,
            afterRiskScore
        } = req.body;

        if (status === 'COMPLETED') {
            return res.status(400).json({ success: false, message: 'Record completion with evidence through /api/agents/interventions/:id/outcomes.' });
        }

        await db.query(
            `
            UPDATE interventions

            SET
                status = ?,
                faculty_feedback = ?,
                after_success_score = ?,
                after_risk_score = ?

            WHERE id = ?
            `,
            [
                status,
                facultyFeedback,
                afterSuccessScore,
                afterRiskScore,
                id
            ]
        );

        res.json({
            success: true,
            message:
                "Intervention outcome updated"
        });

    } catch (error) {

        next(error);
    }
}


module.exports = {
    suggestions,
    sendSuggestion,
    createIntervention,
    getInterventions,
    updateIntervention
};
