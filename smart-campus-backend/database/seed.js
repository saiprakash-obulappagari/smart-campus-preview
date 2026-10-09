const path = require("path");
require("dotenv").config({
    path: path.resolve(__dirname, "../.env")
});

const bcrypt = require("bcryptjs");

const db = require("../config/db");


async function seed() {

    try {

        console.log("Starting database seed...");


        /* =================================
           PASSWORDS
        ================================= */

        const adminPassword =
            await bcrypt.hash(
                "Admin@123",
                10
            );

        const facultyPassword =
            await bcrypt.hash(
                "Faculty@123",
                10
            );

        const studentPassword =
            await bcrypt.hash(
                "Student@123",
                10
            );


        /* =================================
           USERS
        ================================= */

        await db.query(
            `
            INSERT IGNORE INTO users
            (name,email,password_hash,role)
            VALUES
            (?,?,?,'ADMIN')
            `,
            [
                "Admin",
                "admin@campus.edu",
                adminPassword
            ]
        );


        await db.query(
            `
            INSERT IGNORE INTO users
            (name,email,password_hash,role)
            VALUES
            (?,?,?,'FACULTY')
            `,
            [
                "Faculty Admin",
                "faculty@campus.edu",
                facultyPassword
            ]
        );


        const students = [

            {
                name: "Rahul Kumar",
                email: "rahul@campus.edu",
                sid: "SC101",
                dept: "CSE",
                year: "3rd Year",
                cgpa: 8.2,
                marks: 68,
                backlogs: 1,
                attendance: 58,
                lms: 54,
                engagement: 72,
                coding: 42,
                aptitude: 68,
                interview: 48,
                skills: 65,
                feedback: 70
            },

            {
                name: "Priya Sharma",
                email: "priya@campus.edu",
                sid: "SC102",
                dept: "ECE",
                year: "4th Year",
                cgpa: 9.1,
                marks: 91,
                backlogs: 0,
                attendance: 91,
                lms: 88,
                engagement: 84,
                coding: 86,
                aptitude: 90,
                interview: 82,
                skills: 89,
                feedback: 91
            },

            {
                name: "Arjun Reddy",
                email: "arjun@campus.edu",
                sid: "SC103",
                dept: "CSE",
                year: "3rd Year",
                cgpa: 7.4,
                marks: 62,
                backlogs: 1,
                attendance: 69,
                lms: 61,
                engagement: 45,
                coding: 57,
                aptitude: 52,
                interview: 49,
                skills: 55,
                feedback: 62
            },

            {
                name: "Sneha Rao",
                email: "sneha@campus.edu",
                sid: "SC104",
                dept: "IT",
                year: "2nd Year",
                cgpa: 8.7,
                marks: 84,
                backlogs: 0,
                attendance: 76,
                lms: 79,
                engagement: 92,
                coding: 74,
                aptitude: 78,
                interview: 70,
                skills: 82,
                feedback: 86
            },

            {
                name: "Vikram Singh",
                email: "vikram@campus.edu",
                sid: "SC105",
                dept: "EEE",
                year: "4th Year",
                cgpa: 6.8,
                marks: 48,
                backlogs: 3,
                attendance: 61,
                lms: 48,
                engagement: 38,
                coding: 35,
                aptitude: 44,
                interview: 41,
                skills: 49,
                feedback: 55
            }
        ];


        for (const s of students) {

            await db.query(
                `
                INSERT IGNORE INTO users
                (name,email,password_hash,role)
                VALUES (?,?,?,'STUDENT')
                `,
                [
                    s.name,
                    s.email,
                    studentPassword
                ]
            );


            const [userRows] =
                await db.query(
                    `SELECT id
                     FROM users
                     WHERE email = ?`,
                    [s.email]
                );


            const userId =
                userRows[0].id;


            await db.query(
                `
                INSERT IGNORE INTO students
                (
                    user_id,
                    student_id,
                    department,
                    year_level,
                    cgpa
                )
                VALUES (?,?,?,?,?)
                `,
                [
                    userId,
                    s.sid,
                    s.dept,
                    s.year,
                    s.cgpa
                ]
            );


            const [studentRows] =
                await db.query(
                    `
                    SELECT id
                    FROM students
                    WHERE student_id = ?
                    `,
                    [s.sid]
                );


            const studentId =
                studentRows[0].id;


            /* Academic */

            await db.query(
                `
                INSERT INTO academic_data
                (
                    student_id,
                    average_marks,
                    backlogs,
                    subject_performance
                )
                VALUES (?,?,?,?)
                `,
                [
                    studentId,
                    s.marks,
                    s.backlogs,
                    s.marks
                ]
            );


            /* Attendance */

            await db.query(
                `
                INSERT INTO attendance
                (
                    student_id,
                    overall_percentage,
                    subject_wise
                )
                VALUES (?,?,?)
                `,
                [
                    studentId,
                    s.attendance,
                    JSON.stringify({
                        Mathematics: s.attendance,
                        DBMS: s.attendance + 3,
                        Java: s.attendance - 2,
                        Networks: s.attendance + 1
                    })
                ]
            );


            /* LMS */

            await db.query(
                `
                INSERT INTO lms_activity
                (
                    student_id,
                    login_frequency,
                    assignment_completion,
                    learning_activity
                )
                VALUES (?,?,?,?)
                `,
                [
                    studentId,
                    s.lms,
                    s.lms,
                    s.lms
                ]
            );


            /* Engagement */

            await db.query(
                `
                INSERT INTO engagement
                (
                    student_id,
                    events_score,
                    clubs_score,
                    hackathon_score,
                    certification_score
                )
                VALUES (?,?,?,?,?)
                `,
                [
                    studentId,
                    s.engagement,
                    s.engagement,
                    s.engagement,
                    s.engagement
                ]
            );


            /* Placement */

            await db.query(
                `
                INSERT INTO placement
                (
                    student_id,
                    aptitude_score,
                    coding_score,
                    mock_interview_score,
                    readiness_score
                )
                VALUES (?,?,?,?,?)
                `,
                [
                    studentId,
                    s.aptitude,
                    s.coding,
                    s.interview,
                    Math.round(
                        (
                            s.aptitude +
                            s.coding +
                            s.interview
                        ) / 3
                    )
                ]
            );


            /* Skills */

            await db.query(
                `
                INSERT INTO skills
                (
                    student_id,
                    technical_score,
                    soft_skill_score,
                    assessment_score
                )
                VALUES (?,?,?,?)
                `,
                [
                    studentId,
                    s.skills,
                    s.skills,
                    s.skills
                ]
            );


            /* Feedback */

            await db.query(
                `
                INSERT INTO feedback
                (
                    student_id,
                    student_satisfaction,
                    faculty_feedback
                )
                VALUES (?,?,?)
                `,
                [
                    studentId,
                    s.feedback,
                    s.feedback
                ]
            );

        }


        console.log(
            "Database seeded successfully!"
        );

        console.log("");
        console.log(
            "Admin: admin@campus.edu / Admin@123"
        );
        console.log(
            "Faculty: faculty@campus.edu / Faculty@123"
        );
        console.log(
            "Student: rahul@campus.edu / Student@123"
        );


    } catch (error) {

        console.error(
            "Seed error:",
            error
        );

    } finally {

        await db.end();
    }
}


seed();