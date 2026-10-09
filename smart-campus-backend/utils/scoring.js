function clamp(value) {
    return Math.max(0, Math.min(100, Number(value) || 0));
}


function calculateSuccessScore(data) {

    const academic =
        clamp(
            ((Number(data.cgpa) / 10) * 60) +
            (Number(data.average_marks) * 0.30) -
            (Number(data.backlogs) * 5)
        );

    const attendance =
        clamp(data.overall_percentage);

    const lms =
        clamp(
            (
                Number(data.login_frequency) +
                Number(data.assignment_completion) +
                Number(data.learning_activity)
            ) / 3
        );

    const engagement =
        clamp(
            (
                Number(data.events_score) +
                Number(data.clubs_score) +
                Number(data.hackathon_score) +
                Number(data.certification_score)
            ) / 4
        );

    const placement =
        clamp(
            (
                Number(data.aptitude_score) +
                Number(data.coding_score) +
                Number(data.mock_interview_score) +
                Number(data.readiness_score)
            ) / 4
        );

    const skills =
        clamp(
            (
                Number(data.technical_score) +
                Number(data.soft_skill_score) +
                Number(data.assessment_score)
            ) / 3
        );

    const feedback =
        clamp(
            (
                Number(data.student_satisfaction) +
                Number(data.faculty_feedback)
            ) / 2
        );


    const successScore =
        academic * 0.25 +
        attendance * 0.15 +
        lms * 0.10 +
        engagement * 0.10 +
        placement * 0.20 +
        skills * 0.10 +
        feedback * 0.10;


    return {
        academic: Number(academic.toFixed(2)),
        attendance: Number(attendance.toFixed(2)),
        lms: Number(lms.toFixed(2)),
        engagement: Number(engagement.toFixed(2)),
        placement: Number(placement.toFixed(2)),
        skills: Number(skills.toFixed(2)),
        feedback: Number(feedback.toFixed(2)),
        successScore: Number(successScore.toFixed(2))
    };
}


function calculateRisk(successScore) {

    const riskScore = 100 - successScore;

    let riskLevel;

    if (riskScore < 25) {
        riskLevel = "LOW";
    } else if (riskScore < 50) {
        riskLevel = "MEDIUM";
    } else if (riskScore < 75) {
        riskLevel = "HIGH";
    } else {
        riskLevel = "CRITICAL";
    }

    return {
        riskScore: Number(riskScore.toFixed(2)),
        riskLevel
    };
}


function generateExplanation(data, scores) {

    const factors = [];

    if (scores.attendance < 75) {
        factors.push({
            factor: "Attendance",
            impact: "negative",
            value: scores.attendance,
            message: "Attendance is below the recommended level."
        });
    }

    if (scores.placement < 60) {
        factors.push({
            factor: "Placement Readiness",
            impact: "negative",
            value: scores.placement,
            message: "Placement preparation needs improvement."
        });
    }

    if (scores.lms < 60) {
        factors.push({
            factor: "LMS Activity",
            impact: "negative",
            value: scores.lms,
            message: "Learning platform activity is low."
        });
    }

    if (scores.engagement < 60) {
        factors.push({
            factor: "Engagement",
            impact: "negative",
            value: scores.engagement,
            message: "Student participation is low."
        });
    }

    if (scores.skills >= 75) {
        factors.push({
            factor: "Skills",
            impact: "positive",
            value: scores.skills,
            message: "Student has strong skill development."
        });
    }

    if (scores.academic >= 75) {
        factors.push({
            factor: "Academic",
            impact: "positive",
            value: scores.academic,
            message: "Academic performance is strong."
        });
    }

    return factors;
}


function getSegment(scores) {

    if (
        scores.academic >= 75 &&
        scores.placement < 60
    ) {
        return "High Academic + Low Placement";
    }

    if (scores.engagement < 50) {
        return "Low Engagement";
    }

    if (scores.placement >= 75) {
        return "Placement Ready";
    }

    if (scores.successScore >= 80) {
        return "High Potential";
    }

    if (scores.successScore < 40) {
        return "High Risk";
    }

    return "Balanced";
}


module.exports = {
    calculateSuccessScore,
    calculateRisk,
    generateExplanation,
    getSegment
};