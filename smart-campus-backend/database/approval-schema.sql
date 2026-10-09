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
