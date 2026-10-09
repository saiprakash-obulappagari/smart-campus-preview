# Smart Campus Analytics

An evidence-led student-success decision-support platform built with HTML, CSS, JavaScript, Node.js, Express, and MySQL. It integrates seven student-data categories, computes a configurable support index, explains academic/placement/engagement risk rules, and supports faculty-reviewed interventions. The optional Campus Buddy tutor uses the existing server-side OpenAI integration.

## Run locally

From this backend directory:

```text
npm ci
npm run migrate:sources
npm test
npm start
```

Open http://localhost:5000/. Keep the repository-root frontend files next to smart-campus-backend. For a new database, apply database/schema.sql and the existing approval/agent migrations first. Source-table setup also runs at server startup and does not reset existing records. If source migration lacks database permissions, the server reports that imports/settings need setup; the synthetic demo remains explicitly nonpersistent.

Configure DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, and JWT_SECRET outside source control. Hosted deployments retain the existing DB_SSL/DB_SSL_CA settings in the production database connector. OPENAI_API_KEY and OPENAI_MODEL are optional tutor settings. AGENT_RULES_JSON supplies initial rule defaults when no administrator configuration has been saved. Never publish .env, student database exports, or credentials.

## Architecture and model

The existing Express server serves the frontend and appends public/success/query.js, success.js, and advanced.js to the existing browser script. Existing registration, approval, student submissions, tutoring, and intervention events are preserved. CampusQuery is a shared deterministic filter/chart helper tested in Node and used by the browser.

services/unifiedData.js loads the latest legacy source rows per registered campus ID and merges dated approved submissions, faculty observations, and imported records by per-field freshness. Legacy records are labelled undated. Source records retain measurement time, reference, verifier, and batch. History reconstructs only dated evidence. Invalid legacy indicators are excluded and reported; invalid imports are rejected before persistence.

Core tables: users, students, faculty, account_access, student_performance, performance_submissions, academic_data, attendance, lms_activity, engagement, placement, skills, feedback, agent_observations, interventions, agent_intervention_events, review_audit. Additive tables: source_import_batches, student_source_records, student_success_settings.

Academic supports CGPA, marks, backlogs, subject performance, and semester. Attendance includes overall and subject-wise percentages. LMS includes normalized login frequency, assignments, activity, and learning progress. Engagement includes events, clubs, hackathons, certifications, and extracurricular participation. Placement includes assessment percentages, mock-interview counts, and preparation counts. Skills include technical, soft, general assessment, communication, teamwork, and problem solving. Feedback includes satisfaction and faculty feedback.

## Requested scoring formula

```text
Success = 0.35 Academic + 0.20 Attendance + 0.15 LMS
        + 0.10 Engagement + 0.15 Placement
        + 0.05 Skills-and-Feedback
```

All scored indicators use 0–100 percentages; CGPA is multiplied by 10. Academic uses a normalized mean of CGPA (35%), marks (50%), and subject performance (15%), minus 5 points per backlog, capped at 25 points. Other category scores average available percentage indicators. Skills-and-Feedback is the mean of available skills/feedback category scores. Counts and semester identifiers are metadata, not percentages.

Missing scored components are omitted and active weights renormalized. A real measured zero is included. Required-field weighted coverage is separate, and below 70% defaults to LOW confidence. Missing supplemental context is listed separately. A high available-data score with low coverage is not evidence of excellent overall performance. Performance categories describe the support index, not future outcomes.

Administrators can edit all six weights and risk thresholds in Settings. Server validation normalizes weights and rejects invalid rule ordering. A required reason and audit history accompany changes. Historical observations are recalculated under the current configuration, rather than represented as unchanged past policy decisions.

## Risk rules and segments

Academic: low normalized CGPA/marks, backlogs, institutional attendance thresholds (default <75% moderate, <60% high), low assignments, and dated mark declines (>=5 points moderate, >=10 high). Placement: coding, aptitude, interview performance, mock-interview count, preparation activities, readiness, and assessed skill requirements. Engagement: low LMS/assignment/extracurricular activity, persistent low LMS scores, and dated activity decline. Generic percentage support thresholds default to <60% moderate and <30% high. Each domain takes its highest observed severity and shows unknown inputs. No observations means UNKNOWN, never automatically low risk.

Segments include strong academics/weak placement, low attendance/declining marks, strong academics/strong placement, strong attendance/low LMS, broad academic-and-engagement support, and comparable improvement over time. Additional marks and engagement support groups are included. Definitions and aggregate metrics are visible; cards filter the student directory. Membership is recalculated and is not a permanent label.

This is a transparent rule-based assessment engine. Weighted arithmetic is not labelled machine learning. No trained prediction model, probability calibration, accuracy claim, or causal intervention-success rate is claimed. Placement officers use existing approved faculty accounts scoped to their department; a separate placement-only role is not implemented.

## Dashboard and intervention center

All views use the same scoped records. Filters include department, semester, all three risk domains, attendance range, score range, search, and segment. Sorting supports severity, success, attendance, placement, and name. The directory paginates 25 records at a time. Charts include category/department priorities, success distribution, risk distribution, academic-vs-placement comparison, monthly and semester trends. Clickable ranges, flags, groups, and comparison points reveal corresponding students. Historical sample size and coverage remain visible.

Profiles explain category contributions, earned and shortfall points, individual indicator contributions, normalization, backlog penalties, risk triggers, sources, dates, missing fields, and support proposals. The Intervention Center preserves assignment and outcome-event persistence. Proposals include reason, task, responsible role, priority, and suggested review date. ASSIGNED is displayed as Pending; IN_PROGRESS and COMPLETED are displayed as In Progress and Completed. Authorized faculty record evidence and notes; completion alone does not establish effectiveness. No automatic messages or consequential student decisions are made.

## Import/export and demo

CSV/JSON source records require a registered campus ID, category, source reference, measurement timestamp, and valid indicators. Download templates from the import panel. Preview is read-only and returns row errors. Staff confirm verification and a note before transactional save. Duplicate batch or record hashes reject the whole batch; repeated IDs across different sources or dates are legitimate, while duplicate ID/category/timestamp rows within a batch are rejected. New account provisioning remains the registration workflow; imports do not create credentials.

The filtered directory exports CSV with spreadsheet-formula escaping. Public demo data is deterministic and synthetic, with strong, weak-placement, low-attendance, improving, and incomplete cases. Demo CSV validation is public and read-only; commits and institutional assignments are disabled. Demo mode makes no persistence claim and exposes no college records.

## Tests and verification

npm test runs rule, score, source-validation, filter/chart, and fixture-backed API tests. Tests cover missing/invalid data, weight normalization, risk boundaries, segments, CSV parsing and duplicates, scoped permissions, import rollback, configuration auditing, intervention status/evidence history, and error responses. Temporary DOM tests verify navigation, filters, profiles, and demo behavior. Real MySQL checks use disposable records inside a rolled-back transaction. Browser/device visual review remains a manual check because the browser automation session was unavailable; DOM checks do not prove responsive visual quality.

## Render deployment

The existing site deploys the main branch of saiprakash-obulappagari/smart-campus-preview. Retain its existing repository-root build/start settings and MySQL TLS environment configuration. Startup creates the three additive tables with CREATE TABLE IF NOT EXISTS. The deployed database user needs permission to create those tables, or a database administrator must run npm run migrate:sources manually. A source commit or GitHub CI success does not prove Render deployed it; verify /api/health, /api/success/demo, the enhanced /script.js, and the linked scoring note after deployment. If Auto-Deploy is disabled, use Render Manual Deploy / Deploy latest commit.

## Judge-ready explanation and two-minute demo

"We connect seven sources into one verified student view. Our Student Success Score uses the requested six-component weighting and reports missing evidence separately. Three explainable risk domains identify practical support needs. Faculty inspect the rules and sources, assign tasks, and record evidence-backed progress. We do not claim validated prediction accuracy."

1. Overview: show score distribution and coverage, then filter high placement risk.
2. Rahul: show strong academics, weak placement, score contributions, coding trigger, and recommended action.
3. Arjun: show attendance and dated marks evidence. Contrast Ananya's unknown score with genuinely low performance.
4. Segments: select a group and inspect its members and aggregate metrics.
5. CSV: preview the synthetic demo CSV and show row validation, explaining that demo preview saves nothing.
6. Approved staff account: assign an intervention, record In Progress with evidence, and open its history. Show Administrator Settings if appropriate.

See docs/CHALLENGE-AUDIT.md for complete/partial status, docs/SUCCESS-SCORE.md for methodology, and the printable six-slide demo in public/success/demo-slides.html. Institutional connectors, model evaluation, a separate placement role, and final desktop/mobile visual review remain outside the completed prototype. No numerical judging score or student outcome is guaranteed.
