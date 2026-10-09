const db = require('../config/db');
const { getStudentData } = require('./studentService');
const { calculateSuccessScore } = require('../utils/scoring');

function buildPlan(data, scores) {
    const tasks = [];
    if (data.overall_percentage != null && Number(data.overall_percentage) < 60)
        tasks.push('Attend every scheduled class for the next two weeks. Meet your mentor this week to review missed lessons and track attendance daily.');
    if (data.average_marks != null && Number(data.average_marks) < 60)
        tasks.push('Revise your two weakest topics for 30 minutes daily and complete a practice quiz by the end of this week.');
    if (data.coding_score != null && Number(data.coding_score) < 60)
        tasks.push('Solve three beginner coding problems this week and submit your solutions to your faculty mentor.');
    if (data.assignment_completion != null && Number(data.assignment_completion) < 60)
        tasks.push('List pending assignments today and submit two overdue assignments within seven days.');
    if (!tasks.length) tasks.push('Meet your faculty mentor this week, identify two areas to improve, and complete a seven-day study plan with a daily 30-minute practice session.');
    tasks.push('Review progress with your mentor after seven days and agree on the next measurable goal.');
    return { title: 'Seven-day student improvement plan', description: tasks.map((task, i) => `${i + 1}. ${task}`).join('\n'), tasks };
}

async function getSuggestions(user) {
    const [students] = await db.query(`SELECT s.id, s.student_id, u.name FROM students s JOIN users u ON u.id=s.user_id ${user?.role === 'FACULTY' ? 'WHERE s.department=?' : ''} ORDER BY s.id`, user?.role === 'FACULTY' ? [user.department || ''] : []);
    const suggestions = [];
    for (const student of students) {
        const data = await getStudentData(student.id);
        const [reported] = await db.query('SELECT * FROM student_performance WHERE student_id=?', [student.id]);
        if (reported.length) {
            const p = reported[0];
            Object.assign(data, { overall_percentage: p.attendance, assignment_completion: p.lms, coding_score: p.coding, mock_interview_score: p.interview });
        }
        // Missing measurements must not be treated as a recorded zero percent.
        const hasProgress = ['average_marks', 'overall_percentage', 'coding_score', 'assignment_completion'].some(key => data[key] != null);
        if (!hasProgress) continue;
        const [recorded] = await db.query('SELECT success_score FROM success_scores WHERE student_id=? ORDER BY id DESC LIMIT 1', [student.id]);
        const calculated = calculateSuccessScore(data);
        const complete = ['average_marks', 'overall_percentage', 'login_frequency', 'events_score', 'coding_score', 'technical_score', 'student_satisfaction'].every(key => data[key] != null);
        const scores = { ...calculated, successScore: reported[0] ? Number(reported[0].success_score) : recorded[0]?.success_score != null ? Number(recorded[0].success_score) : complete ? calculated.successScore : null };
        const attendance = data.overall_percentage == null ? null : Number(data.overall_percentage);
        if ((scores.successScore == null || scores.successScore >= 60) && (attendance == null || attendance >= 60)) continue;
        const plan = buildPlan(data, scores);
        const [sent] = await db.query('SELECT id FROM interventions WHERE student_id=? AND title=? AND description=? AND status IN (\'ASSIGNED\',\'IN_PROGRESS\') LIMIT 1', [student.id, plan.title, plan.description]);
        suggestions.push({ ...student, successScore: scores.successScore, attendance, ...plan, sent: sent.length > 0 });
    }
    return suggestions;
}

module.exports = { getSuggestions, buildPlan };
