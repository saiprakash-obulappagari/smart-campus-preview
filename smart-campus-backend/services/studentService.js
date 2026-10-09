const db = require("../config/db");


async function getStudentData(studentId) {

    const [rows] = await db.query(
        `
        SELECT

        s.id,
        s.student_id,
        s.department,
        s.year_level,
        s.cgpa,

        a.average_marks,
        a.backlogs,
        a.subject_performance,

        att.overall_percentage,
        att.subject_wise,

        l.login_frequency,
        l.assignment_completion,
        l.learning_activity,

        e.events_score,
        e.clubs_score,
        e.hackathon_score,
        e.certification_score,

        p.aptitude_score,
        p.coding_score,
        p.mock_interview_score,
        p.readiness_score,

        sk.technical_score,
        sk.soft_skill_score,
        sk.assessment_score,

        f.student_satisfaction,
        f.faculty_feedback

        FROM students s

        LEFT JOIN academic_data a
            ON s.id = a.student_id

        LEFT JOIN attendance att
            ON s.id = att.student_id

        LEFT JOIN lms_activity l
            ON s.id = l.student_id

        LEFT JOIN engagement e
            ON s.id = e.student_id

        LEFT JOIN placement p
            ON s.id = p.student_id

        LEFT JOIN skills sk
            ON s.id = sk.student_id

        LEFT JOIN feedback f
            ON s.id = f.student_id

        WHERE s.id = ?
        `,
        [studentId]
    );

    return rows[0];
}


module.exports = {
    getStudentData
};