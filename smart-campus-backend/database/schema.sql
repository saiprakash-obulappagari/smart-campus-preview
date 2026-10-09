CREATE DATABASE IF NOT EXISTS smart_campus;

USE smart_campus;

-- =========================================
-- USERS
-- =========================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role ENUM('STUDENT', 'FACULTY', 'ADMIN') NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================
-- LOGIN, REGISTRATION AND FACULTY
-- Credentials remain in users; these tables reference the account.
-- =========================================

CREATE TABLE IF NOT EXISTS login (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    logged_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_login_user_time (user_id, logged_in_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS register (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS faculty (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    faculty_id VARCHAR(30) UNIQUE,
    department VARCHAR(100),
    designation VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================
-- STUDENTS
-- =========================================

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL UNIQUE,

    student_id VARCHAR(30) NOT NULL UNIQUE,

    department VARCHAR(100) NOT NULL,

    year_level VARCHAR(30),

    phone VARCHAR(20),

    cgpa DECIMAL(4,2) DEFAULT 0,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =========================================
-- ACADEMIC DATA
-- =========================================

CREATE TABLE IF NOT EXISTS student_performance (
    student_id INT PRIMARY KEY,
    attendance DECIMAL(5,2) NOT NULL CHECK (attendance BETWEEN 0 AND 100),
    lms DECIMAL(5,2) NOT NULL CHECK (lms BETWEEN 0 AND 100),
    engagement DECIMAL(5,2) NOT NULL CHECK (engagement BETWEEN 0 AND 100),
    coding DECIMAL(5,2) NOT NULL CHECK (coding BETWEEN 0 AND 100),
    aptitude DECIMAL(5,2) NOT NULL CHECK (aptitude BETWEEN 0 AND 100),
    interview DECIMAL(5,2) NOT NULL CHECK (interview BETWEEN 0 AND 100),
    skills DECIMAL(5,2) NOT NULL CHECK (skills BETWEEN 0 AND 100),
    feedback DECIMAL(5,2) NOT NULL CHECK (feedback BETWEEN 0 AND 100),
    success_score DECIMAL(5,2) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ACADEMIC DATA
-- =========================================

CREATE TABLE IF NOT EXISTS academic_data (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    average_marks DECIMAL(5,2) DEFAULT 0,

    backlogs INT DEFAULT 0,

    subject_performance DECIMAL(5,2) DEFAULT 0,

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
);


-- =========================================
-- ATTENDANCE
-- =========================================

CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    overall_percentage DECIMAL(5,2) DEFAULT 0,

    subject_wise JSON,

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
);


-- =========================================
-- LMS ACTIVITY
-- =========================================

CREATE TABLE IF NOT EXISTS lms_activity (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    login_frequency DECIMAL(5,2) DEFAULT 0,

    assignment_completion DECIMAL(5,2) DEFAULT 0,

    learning_activity DECIMAL(5,2) DEFAULT 0,

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
);


-- =========================================
-- ENGAGEMENT
-- =========================================

CREATE TABLE IF NOT EXISTS engagement (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    events_score DECIMAL(5,2) DEFAULT 0,

    clubs_score DECIMAL(5,2) DEFAULT 0,

    hackathon_score DECIMAL(5,2) DEFAULT 0,

    certification_score DECIMAL(5,2) DEFAULT 0,

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
);


-- =========================================
-- PLACEMENT
-- =========================================

CREATE TABLE IF NOT EXISTS placement (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    aptitude_score DECIMAL(5,2) DEFAULT 0,

    coding_score DECIMAL(5,2) DEFAULT 0,

    mock_interview_score DECIMAL(5,2) DEFAULT 0,

    readiness_score DECIMAL(5,2) DEFAULT 0,

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
);


-- =========================================
-- SKILLS
-- =========================================

CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    technical_score DECIMAL(5,2) DEFAULT 0,

    soft_skill_score DECIMAL(5,2) DEFAULT 0,

    assessment_score DECIMAL(5,2) DEFAULT 0,

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
);


-- =========================================
-- FEEDBACK
-- =========================================

CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    student_satisfaction DECIMAL(5,2) DEFAULT 0,

    faculty_feedback DECIMAL(5,2) DEFAULT 0,

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
);


-- =========================================
-- SUCCESS SCORES
-- =========================================

CREATE TABLE IF NOT EXISTS success_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    academic_score DECIMAL(5,2),

    attendance_score DECIMAL(5,2),

    lms_score DECIMAL(5,2),

    engagement_score DECIMAL(5,2),

    placement_score DECIMAL(5,2),

    skills_score DECIMAL(5,2),

    feedback_score DECIMAL(5,2),

    success_score DECIMAL(5,2),

    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
);


-- =========================================
-- RISK ASSESSMENTS
-- =========================================

CREATE TABLE IF NOT EXISTS risk_assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    risk_score DECIMAL(5,2),

    risk_level ENUM(
        'LOW',
        'MEDIUM',
        'HIGH',
        'CRITICAL'
    ),

    explanation JSON,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
);


-- =========================================
-- SEGMENTS
-- =========================================

CREATE TABLE IF NOT EXISTS segments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    segment_name VARCHAR(100),

    description TEXT,

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE
);


-- =========================================
-- INTERVENTIONS
-- =========================================

CREATE TABLE IF NOT EXISTS interventions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    assigned_by INT,

    title VARCHAR(200),

    description TEXT,

    status ENUM(
        'PENDING',
        'ASSIGNED',
        'IN_PROGRESS',
        'COMPLETED'
    ) DEFAULT 'PENDING',

    faculty_feedback TEXT,

    before_success_score DECIMAL(5,2),

    after_success_score DECIMAL(5,2),

    before_risk_score DECIMAL(5,2),

    after_risk_score DECIMAL(5,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE,

    FOREIGN KEY (assigned_by)
        REFERENCES users(id)
        ON DELETE SET NULL
);

-- Approval and audit tables
CREATE TABLE IF NOT EXISTS account_access (
 user_id INT PRIMARY KEY,
 status ENUM('PENDING','APPROVED','REJECTED') NOT NULL,
 session_version INT NOT NULL DEFAULT 1,
 reviewed_by INT NULL,
 review_reason TEXT,
 reviewed_at TIMESTAMP NULL,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS performance_submissions (
 id INT AUTO_INCREMENT PRIMARY KEY,
 student_id INT NOT NULL,
 submitted_values JSON NOT NULL,
 evidence TEXT NOT NULL,
 status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
 approved_values JSON NULL,
 review_reason TEXT,
 reviewed_by INT NULL,
 submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 reviewed_at TIMESTAMP NULL,
 FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS review_audit (
 id INT AUTO_INCREMENT PRIMARY KEY,
 actor_id INT NOT NULL,
 action VARCHAR(50) NOT NULL,
 target_id INT NOT NULL,
 details JSON NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Explainable agents
CREATE TABLE IF NOT EXISTS agent_observations (
 id INT AUTO_INCREMENT PRIMARY KEY,
 student_id INT NOT NULL,
 indicators JSON NOT NULL,
 source_reference VARCHAR(1000) NOT NULL,
 verified_by INT NOT NULL,
 measured_at DATETIME NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS agent_intervention_events (
 id INT AUTO_INCREMENT PRIMARY KEY,
 intervention_id INT NOT NULL,
 actor_id INT NOT NULL,
 status ENUM('ASSIGNED','IN_PROGRESS','COMPLETED') NOT NULL,
 evidence TEXT NOT NULL,
 outcome_notes TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (intervention_id) REFERENCES interventions(id) ON DELETE CASCADE
);
