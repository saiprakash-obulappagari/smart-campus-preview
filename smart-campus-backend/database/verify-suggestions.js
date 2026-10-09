require('dotenv').config({ quiet: true });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const assert = require('node:assert/strict');

(async () => {
    let connection, server;
    try {
        connection = await mysql.createConnection({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, port: Number(process.env.DB_PORT || 3306) });
        await connection.beginTransaction();
        const dbPath = require.resolve('../config/db');
        require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: { query: (...args) => connection.query(...args) } };
        const suffix = Date.now();
        const ids = [];
        for (const role of ['FACULTY', 'STUDENT', 'STUDENT']) {
            const [result] = await connection.query('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)', ['Suggestion test', `suggestion-${suffix}-${ids.length}@example.invalid`, await bcrypt.hash('TemporaryTest!', 4), role]);
            ids.push(result.insertId);
            await connection.query("INSERT INTO account_access (user_id,status) VALUES (?,'APPROVED')", [result.insertId]);
            if (role === 'FACULTY') await connection.query("INSERT INTO faculty (user_id,department) VALUES (?,'CSE')", [result.insertId]);
        }
        const studentIds = [];
        for (let i = 1; i <= 2; i++) {
            const [result] = await connection.query('INSERT INTO students (user_id,student_id,department,cgpa) VALUES (?,?,?,?)', [ids[i], `TEST-${suffix}-${i}`, 'CSE', 9]);
            studentIds.push(result.insertId);
            const value = i === 1 ? 40 : 100;
            await connection.query('INSERT INTO attendance (student_id,overall_percentage) VALUES (?,?)', [result.insertId, value]);
            await connection.query('INSERT INTO academic_data (student_id,average_marks,backlogs) VALUES (?,?,0)', [result.insertId, value]);
            await connection.query('INSERT INTO success_scores (student_id,success_score) VALUES (?,?)', [result.insertId, value]);
        }
        const app = express(); app.use(express.json()); app.use('/api/interventions', require('../routes/interventionRoutes'));
        app.use((error, req, res, next) => res.status(500).json({ message: error.message }));
        server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
        const request = async (id, role, path, method = 'GET') => {
            const response = await fetch(`http://127.0.0.1:${server.address().port}/api/interventions${path}`, { method, headers: { Authorization: 'Bearer ' + jwt.sign({ id, role, sessionVersion: 1 }, process.env.JWT_SECRET), 'Content-Type': 'application/json' }, ...(method === 'POST' ? { body: '{}' } : {}) });
            return { status: response.status, data: await response.json() };
        };
        const plans = await request(ids[0], 'FACULTY', '/suggestions');
        assert.equal(plans.status, 200);
        assert(plans.data.data.some(plan => plan.id === studentIds[0]));
        assert(!plans.data.data.some(plan => plan.id === studentIds[1]));
        assert.equal((await request(ids[1], 'STUDENT', '/suggestions')).status, 403);
        assert.equal((await request(ids[0], 'FACULTY', `/suggestions/${studentIds[0]}/send`, 'POST')).status, 201);
        assert.equal((await request(ids[0], 'FACULTY', `/suggestions/${studentIds[0]}/send`, 'POST')).status, 409);
        assert.equal((await request(ids[1], 'STUDENT', '')).data.data.length, 1);
        assert.equal((await request(ids[2], 'STUDENT', '')).data.data.length, 0);
        const { buildPlan } = require('../services/suggestionService');
        assert(buildPlan({ overall_percentage: 59 }, {}).description.includes('Attend every'));
        assert(!buildPlan({ overall_percentage: 60 }, {}).description.includes('Attend every'));
        console.log('PASS: faculty preview/send, student-only delivery, duplicate rejection, role restrictions, and 60% boundary.');
    } catch (error) { console.error(error); process.exitCode = 1; }
    finally { if (server) server.close(); if (connection) { await connection.rollback(); await connection.end(); } }
})();
