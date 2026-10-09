# Three-minute hackathon demo

1. Open the site and choose **Explore hackathon demo**. State that the six students and dated trends are synthetic. This mode reads no real college records and disables writes.
2. Show seven category averages and separate academic / placement flags. Filter CSE, then filter high placement risk. Rahul demonstrates strong academics but weak placement readiness.
3. Open Rahul's insights. Show his category contribution points, score shortfalls, missing-field coverage, and the coding-risk threshold. Show all seven source categories and source timestamps.
4. Return and inspect Arjun. Show declining dated marks and the low-attendance/declining-marks segment. Open the historical evidence table to explain comparable coverage.
5. Inspect Ananya: unknown score, unknown risk, and missing sources. Explain why missing data is not treated as poor performance.
6. Leave demo and log in with an approved faculty or administrator account. Upload the CSV/JSON template using a registered student ID, preview validation, confirm source verification, and import. Never label synthetic records as official college evidence.
7. Open the student's assessment and approve one support proposal. Open Interventions to show the assigned task and evidence-based follow-up workflow. Faculty accounts see their own department; administrators see the college.
8. Open the scoring note and six-slide presentation from the method section. Close with: "We connect evidence, explain support needs, and help faculty act. Our current engine uses transparent rules; we do not claim validated prediction accuracy."

## Deployment

Run `npm install`, `npm run migrate:sources`, `npm test`, then `npm start` from smart-campus-backend. A new database also needs database/schema.sql and the approval/agent migrations. Existing approved accounts are preserved. Source-table migration adds two tables and does not rewrite existing records. The main frontend and admin files remain in the repository root; the server appends success assets to the existing script and stylesheet. Keep the full repository layout when deploying to Render. Render root directory: smart-campus-backend; build: npm install; start: npm run migrate:sources && npm start. Existing DB_* and JWT_SECRET environment settings must be retained. OPENAI_API_KEY is optional for Campus Buddy tutoring; no key is required for explainable analytics or the labelled demo.

Automated rule tests and fixture-backed API tests do not replace a real hosted login, import, and assignment demonstration. The final requirement audit records exactly which checks were completed. Judging score and real-world predictive performance cannot be guaranteed.
