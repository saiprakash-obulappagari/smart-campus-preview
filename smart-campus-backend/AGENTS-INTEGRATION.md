# Smart Campus explainable agents

All code lives in `C:/Users/GOLLA JANARDHAN/Downloads/Smart-Campus-Analytics/smart-campus-backend/`.

Four reusable modules:

| File | Export | Purpose |
| --- | --- | --- |
| `agents/scoreAgent.js` | `scoreAgent(indicators, config)` | Separate academic and placement weighted scores, coverage and missing values |
| `agents/riskAgent.js` | `riskAgent(indicators, config)` | Explainable academic and placement flags |
| `agents/interventionAgent.js` | `interventionAgent(indicators, config)` | Support proposals with reasons and evidence requirements |
| `agents/segmentationAgent.js` | `segmentationAgent(students, config)` | Overlapping segments, counts, definitions and department summaries |

The prompt listed agents 2–4; the fourth implemented module is score calculation, as required by the integration requirements. No React or new dependency is used.

## Install and run

From the backend directory:

```powershell
npm install
node database/migrate-approvals.js
node database/migrate-agents.js
npm test
npm start
```

For a new database, run `database/schema.sql` in MySQL first. Existing databases use the two migration scripts. Approval migration quarantines legacy self-reported performance and requires faculty approval. Configure DB settings and JWT_SECRET in `.env`; never commit that file. Open the existing frontend using Live Server on port 5500. Restart the backend after changing environment settings.

Optional `AGENT_RULES_JSON` in `.env` overrides rule thresholds/weights. Example:

```env
AGENT_RULES_JSON={"highBelow":30,"mediumBelow":60,"declineMedium":5,"declineHigh":10,"backlogMedium":1,"backlogHigh":3}
```

Default academic weights: attendance 30%, marks 50%, assignments 20%. Placement weights: coding 50%, aptitude 20%, interview 30%. Missing inputs are omitted with coverage shown; scores with incomplete coverage must not be compared as complete assessments.

Indicator risk: below 30% HIGH, 30–59.99% MEDIUM, 60–100% LOW. Independent academic triggers: backlog counts >=1 MEDIUM or >=3 HIGH; latest dated mark decline >=5 points MEDIUM or >=10 HIGH. A domain takes its highest triggered severity. A domain with no observed indicator has `level: null` and `INSUFFICIENT_DATA`. These rules do not predict calibrated outcome probabilities. No machine learning is implemented because suitable labeled historical outcomes have not been established.

## Verified data and privacy

`services/agentDataService.js` reads faculty-approved `student_performance` and faculty/admin-recorded `agent_observations`. Student input is never accepted as official data by agent endpoints. Marks, assignments and backlogs need separate verified observations. Each field includes source provenance. Staff must check actual source records: entering a source reference does not authenticate that record automatically.

Every API authenticates the current database account and approval/session version. Students can read only their own assessments. Faculty can read/verify/approve only their assigned department. Administrators can read college-level summaries. Observation records are append-only through these APIs. No automatic approval, grade update or disciplinary decision occurs.

## APIs

All paths start with `/api/agents`. Include `Authorization: Bearer YOUR_LOGIN_TOKEN`.

| Method | Path | Access |
| --- | --- | --- |
| GET | `/students/:id/scores` | Own student / scoped faculty / admin |
| GET | `/students/:id/risk` | Same |
| GET | `/students/:id/recommendations` | Same |
| GET | `/segments` | Scoped faculty / admin |
| POST | `/students/:id/observations` | Scoped faculty / admin |
| POST | `/students/:id/recommendations/:key/approve` | Scoped faculty / admin |
| POST | `/interventions/:interventionId/outcomes` | Scoped faculty / admin |
| GET | `/interventions/:interventionId/events` | Own student / scoped faculty / admin |

`:id` is the numeric `students.id`, not the campus code. Observation example:

```json
{"indicators":{"marks":42,"assignments":50,"backlogs":2},"sourceReference":"Verified semester assessment register, October 2026","measuredAt":"2026-10-01T09:00:00Z"}
```

Record a second marks observation with a later measurement date to assess decline. Historical dates are sorted; identical dates do not establish a trend. Percentage fields are numbers in 0–100; backlog count is a nonnegative integer. Future dates and unknown fields are rejected.

Approve a currently generated recommendation by its indicator key (e.g. `coding`), with `{}` as the POST body. This creates an ASSIGNED intervention, visible in the existing student inbox. Duplicate active interventions are rejected. Record outcome:

```json
{"status":"COMPLETED","evidence":"Reviewed practice submissions and mentor assessment reference","notes":"Three problems completed; reassessment remains pending."}
```

Completion is not proof of improved performance. Events preserve evidence and reviewer identity. Later verified assessment records establish progress. The outcome endpoint reports `EVIDENCE_RECORDED`, never an invented success result.

## Structured results and frontend

Each agent returns JSON including `agent`, `version` and explainable results. The API adds `success`, student ID and provenance where appropriate. Example integration:

```javascript
const response = await fetch(`http://localhost:5000/api/agents/students/${student.databaseId}/risk`, {
  headers: { Authorization: `Bearer ${authToken}` }
});
const result = await response.json();
if (!response.ok) throw new Error(result.message);
// Show academic and placement separately; show triggers, missing fields and status.
// Insert text using textContent or escapeHtml; never insert untrusted raw HTML.
```

Faculty student details now include these agent results. Dashboard segmentation shows scoped counts and definitions. The existing Campus Buddy LLM tutor remains optional through OPENAI_API_KEY/OPENAI_MODEL; it supplies contextual explanations and sources but cannot change risk rules, verified scores or approvals. All four modules work without any LLM key. No new outbound LLM calls are made by these modules.

## Samples and testing

`agents/sampleStudents.js` contains five synthetic students covering the segments and missing data. It is used by `tests/agents.test.js` and never automatically inserts production records. Run `npm test` for pure-module tests. Existing `database/verify-approvals.js` exercises approval security against MySQL using temporary accounts; run explicitly with local database access. Do not use real student data in sample fixtures.

The application has no verified staff-directory integration, MFA, trained predictive model, or automated proof validation. Those features are not claimed here.
