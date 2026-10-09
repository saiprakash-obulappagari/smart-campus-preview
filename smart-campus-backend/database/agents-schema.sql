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
