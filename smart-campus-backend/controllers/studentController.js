const db = require("../config/db");

const {
    getStudentData
} = require("../services/studentService");

const {
    calculateSuccessScore,
    calculateRisk,
    generateExplanation,
    getSegment
} = require("../utils/scoring");


async function getStudents(req, res, next) {

    try {

        const [rows] = await db.query(`
            SELECT
                s.id,
                s.student_id,
                u.name,
                u.email,
                s.department,
                s.year_level,
                s.cgpa,
                COALESCE(sp.success_score, (SELECT success_score FROM success_scores WHERE student_id=s.id ORDER BY id DESC LIMIT 1)) AS success_score,
                COALESCE(100 - sp.success_score, (SELECT risk_score FROM risk_assessments WHERE student_id=s.id ORDER BY id DESC LIMIT 1)) AS risk_score,
                COALESCE(sp.attendance, (SELECT overall_percentage FROM attendance WHERE student_id=s.id ORDER BY id DESC LIMIT 1)) AS attendance,
                COALESCE(sp.lms, (SELECT assignment_completion FROM lms_activity WHERE student_id=s.id ORDER BY id DESC LIMIT 1)) AS lms,
                COALESCE(sp.engagement, (SELECT events_score FROM engagement WHERE student_id=s.id ORDER BY id DESC LIMIT 1)) AS engagement,
                COALESCE(sp.coding, (SELECT coding_score FROM placement WHERE student_id=s.id ORDER BY id DESC LIMIT 1)) AS coding,
                COALESCE(sp.aptitude, (SELECT aptitude_score FROM placement WHERE student_id=s.id ORDER BY id DESC LIMIT 1)) AS aptitude,
                COALESCE(sp.interview, (SELECT mock_interview_score FROM placement WHERE student_id=s.id ORDER BY id DESC LIMIT 1)) AS interview,
                COALESCE(sp.skills, (SELECT technical_score FROM skills WHERE student_id=s.id ORDER BY id DESC LIMIT 1)) AS skills,
                COALESCE(sp.feedback, (SELECT student_satisfaction FROM feedback WHERE student_id=s.id ORDER BY id DESC LIMIT 1)) AS feedback,
                (SELECT segment_name FROM segments WHERE student_id=s.id ORDER BY id DESC LIMIT 1) AS segment
            FROM students s LEFT JOIN student_performance sp ON sp.student_id=s.id
            JOIN users u
                ON s.user_id = u.id
            ${req.user.role === 'FACULTY' ? 'WHERE s.department = ?' : ''}
            ORDER BY s.id DESC
        `, req.user.role === 'FACULTY' ? [req.user.department || ''] : []);

        res.json({
            success: true,
            count: rows.length,
            students: rows
        });

    } catch (error) {

        next(error);
    }
}


async function getStudentProfile(req, res, next) {

    try {

        const studentId = req.params.id;

        const data =
            await getStudentData(studentId);

        if (!data) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const scores =
            calculateSuccessScore(data);

        const risk =
            calculateRisk(scores.successScore);

        const explanation =
            generateExplanation(data, scores);

        const segment =
            getSegment(scores);

        res.json({
            success: true,

            student: data,

            scores,

            risk,

            segment,

            explanation
        });

    } catch (error) {

        next(error);
    }
}


async function analyzeStudent(req, res, next) {

    try {

        const studentId = req.params.id;

        const data =
            await getStudentData(studentId);

        if (!data) {

            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const scores =
            calculateSuccessScore(data);

        const risk =
            calculateRisk(scores.successScore);

        const explanation =
            generateExplanation(data, scores);

        const segment =
            getSegment(scores);

        await db.query(
            `
            INSERT INTO success_scores
            (
                student_id,
                academic_score,
                attendance_score,
                lms_score,
                engagement_score,
                placement_score,
                skills_score,
                feedback_score,
                success_score
            )
            VALUES (?,?,?,?,?,?,?,?,?)
            `,
            [
                studentId,
                scores.academic,
                scores.attendance,
                scores.lms,
                scores.engagement,
                scores.placement,
                scores.skills,
                scores.feedback,
                scores.successScore
            ]
        );

        await db.query(
            `
            INSERT INTO risk_assessments
            (
                student_id,
                risk_score,
                risk_level,
                explanation
            )
            VALUES (?,?,?,?)
            `,
            [
                studentId,
                risk.riskScore,
                risk.riskLevel,
                JSON.stringify(explanation)
            ]
        );

        await db.query(
            `
            INSERT INTO segments
            (
                student_id,
                segment_name,
                description
            )
            VALUES (?,?,?)
            `,
            [
                studentId,
                segment,
                "Automatically generated student segment"
            ]
        );

        res.json({

            success: true,

            studentId,

            successScore:
                scores.successScore,

            riskScore:
                risk.riskScore,

            riskLevel:
                risk.riskLevel,

            segment,

            factors:
                scores,

            explanation
        });

    } catch (error) {

        next(error);
    }
}


module.exports = {
    getStudents,
    getStudentProfile,
    analyzeStudent
};
