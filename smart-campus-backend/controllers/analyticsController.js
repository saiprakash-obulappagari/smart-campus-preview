const db = require("../config/db");


async function dashboardAnalytics(req, res, next) {

    try {

        const [[total]] = await db.query(
            `SELECT COUNT(*) AS total
             FROM students`
        );

        const [[risk]] = await db.query(
            `SELECT COUNT(*) AS high_risk
             FROM risk_assessments
             WHERE risk_level IN ('HIGH','CRITICAL')`
        );

        const [[success]] = await db.query(
            `SELECT
                ROUND(AVG(success_score),2)
                AS average_success
             FROM success_scores`
        );

        const [[interventions]] = await db.query(
            `SELECT
                COUNT(*) AS completed
             FROM interventions
             WHERE status='COMPLETED'`
        );

        const [[totalInterventions]] = await db.query(
            `SELECT COUNT(*) AS total
             FROM interventions`
        );

        let interventionSuccess = 0;

        if (totalInterventions.total > 0) {

            interventionSuccess =
                Math.round(
                    (interventions.completed /
                    totalInterventions.total) * 100
                );
        }

        res.json({

            success: true,

            analytics: {
                totalStudents: total.total,
                highRisk: risk.high_risk,
                averageSuccess:
                    success.average_success || 0,
                interventionSuccess
            }

        });

    } catch (error) {

        next(error);
    }
}


async function riskDistribution(req, res, next) {

    try {

        const [rows] = await db.query(
            `
            SELECT
                risk_level,
                COUNT(*) AS count
            FROM risk_assessments
            GROUP BY risk_level
            ORDER BY count DESC
            `
        );

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {

        next(error);
    }
}


async function segments(req, res, next) {

    try {

        const [rows] = await db.query(
            `
            SELECT
                segment_name,
                COUNT(*) AS count
            FROM segments
            GROUP BY segment_name
            ORDER BY count DESC
            `
        );

        res.json({
            success: true,
            data: rows
        });

    } catch (error) {

        next(error);
    }
}


module.exports = {
    dashboardAnalytics,
    riskDistribution,
    segments
};