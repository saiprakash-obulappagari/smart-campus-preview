CREATE TABLE IF NOT EXISTS source_import_batches (
 id INT AUTO_INCREMENT PRIMARY KEY,
 actor_id INT NOT NULL,
 batch_hash CHAR(64) NOT NULL,
 record_count INT NOT NULL,
 verification_note VARCHAR(1000) NOT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY unique_source_batch (batch_hash),
 FOREIGN KEY (actor_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS student_source_records (
 id INT AUTO_INCREMENT PRIMARY KEY,
 batch_id INT NOT NULL,
 student_id INT NOT NULL,
 category VARCHAR(30) NOT NULL,
 indicator_values JSON NOT NULL,
 source_reference VARCHAR(1000) NOT NULL,
 measured_at DATETIME(3) NOT NULL,
 verified_by INT NOT NULL,
 record_hash CHAR(64) NOT NULL UNIQUE,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 INDEX student_measurement (student_id,measured_at,id),
 FOREIGN KEY (batch_id) REFERENCES source_import_batches(id),
 FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
 FOREIGN KEY (verified_by) REFERENCES users(id)
);
