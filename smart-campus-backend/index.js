const path = require("path");
require("dotenv").config({
    path: path.resolve(__dirname, ".env")
});

const express = require("express");
const cors = require("cors");

const db = require("./config/db");

const authRoutes =
    require("./routes/authRoutes");

const studentRoutes =
    require("./routes/studentRoutes");

const analyticsRoutes =
    require("./routes/analyticsRoutes");

const interventionRoutes =
    require("./routes/interventionRoutes");

const {
    notFound,
    errorHandler
} = require("./middleware/error");


const app = express();
const fs = require('fs');
for (const file of ['index.html', 'companion.js', 'faculty-signup.html', 'faculty-signup.js']) {
    app.get('/' + file, (req, res) => res.sendFile(file, { root: path.resolve(__dirname, '..') }));
}
app.get('/', (req, res) => res.sendFile('index.html', { root: path.resolve(__dirname, '..') }));
app.use('/success-assets', express.static(path.join(__dirname, 'public/success')));
app.use('/admin', express.static(path.resolve(__dirname, '../admin')));
app.get('/style.css', (req, res, next) => {
    try { res.type('text/css').send(fs.readFileSync(path.resolve(__dirname, '../style.css'), 'utf8') + '\n' + fs.readFileSync(path.join(__dirname, 'public/success/success.css'), 'utf8')); }
    catch (error) { next(error); }
});
app.get('/script.js', (req, res, next) => {
    try { res.type('application/javascript').send(fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf8') + '\n' + fs.readFileSync(path.join(__dirname, 'public/success/success.js'), 'utf8')); }
    catch (error) { next(error); }
});


/* ================================
   MIDDLEWARE
================================ */

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

app.use(
    express.json({
        limit: "1mb"
    })
);

app.use(
    express.urlencoded({
        extended: true
    })
);


/* ================================
   HEALTH CHECK
================================ */

app.get(
    "/api/health",
    async (req, res) => {

        try {

            await db.query("SELECT 1");

            res.json({
                success: true,
                status: "OK",
                database: "connected"
            });

        } catch (error) {

            res.status(500).json({
                success: false,
                status: "ERROR",
                database: "disconnected"
            });
        }
    }
);


/* ================================
   API ROUTES
================================ */

app.use(
    "/api/auth",
    authRoutes
);
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/companion', require('./routes/companion'));
app.use('/api/agents', require('./routes/agents'));
app.use('/api/success', require('./routes/success'));

app.use(
    "/api/students",
    studentRoutes
);

app.use(
    "/api/analytics",
    analyticsRoutes
);

app.use(
    "/api/interventions",
    interventionRoutes
);


/* ================================
   ERROR HANDLING
================================ */

app.use(notFound);

app.use(errorHandler);


/* ================================
   START SERVER
================================ */

const PORT =
    Number(process.env.PORT || 5000);


async function start() {
    try { await require('./database/sourceTables')(db); }
    catch (error) { console.warn('Source import setup unavailable:', error.code || error.message); }
    return app.listen(PORT, () => console.log(`Smart Campus API running at http://localhost:${PORT}`));
}
if (require.main === module) start().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = app;
