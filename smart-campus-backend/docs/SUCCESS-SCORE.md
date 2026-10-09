# Student Success Score

The score is a transparent support index from 0 to 100. It is not a validated probability of academic failure or a placement prediction. Faculty retain responsibility for checking source evidence and deciding interventions.

| Category | Indicators | Weight |
| --- | --- | --- |
| Academic | CGPA, marks, backlogs, subject performance | 25% |
| Attendance | Overall percentage; subject-wise attendance displayed in the profile | 15% |
| LMS | Normalized login-frequency score, assignment completion, learning activity | 10% |
| Engagement | Events, clubs, hackathons, certifications | 10% |
| Placement | Coding, aptitude, mock interview, readiness assessment | 20% |
| Skills | Technical, soft skills, assessment | 10% |
| Feedback | Student satisfaction, faculty feedback | 10% |

Academic = weighted mean of CGPA x 10 (35%), marks (50%), and subject performance (15%), minus 5 points per backlog, with a maximum 25-point penalty. The result is floored at zero. Available academic weights are renormalized if an indicator is missing. Backlogs alone cannot create an academic score.

Other category scores are arithmetic means of their available numeric indicators. Overall attendance drives its category score; subject percentages provide diagnostic detail and do not double-count overall attendance.

Success = sum(category score x category weight) / sum(weights of available scored categories). Missing categories are omitted, never converted to zero. A genuine measured zero is included. Contribution points = category score x effective category weight. Shortfall points = (100 - category score) x effective category weight. Rounding may cause displayed contribution totals to differ by a few hundredths.

Coverage = sum(category weight x percentage of required fields available in that category). COMPLETE requires every required field; PARTIAL explicitly identifies missing evidence. A high score with low coverage must not be compared as if it were complete. Missing backlog data does not imply no backlogs and keeps coverage incomplete.

Example: seven category scores of 80 give a score of 80. If only attendance is recorded as 90%, the available-data score is 90, coverage is 15%, and the assessment is PARTIAL.

## Academic and placement risks

Each domain takes the highest observed rule severity. Default percentage thresholds: below 30 HIGH; 30 to below 60 MEDIUM; 60 or above no low-value trigger. Academic checks attendance, marks, assignments, LMS, CGPA normalized to percent, and subject performance. Outstanding backlogs >=1 trigger MEDIUM and >=3 HIGH. The latest two distinct dated marks trigger MEDIUM for a decline >=5 percentage points and HIGH for >=10. Placement checks coding, aptitude, and mock interview. A domain with no observed indicators is UNKNOWN, never LOW. Missing indicators remain visible even when a LOW flag is shown for the available evidence.

The seven-category dashboard index is the canonical Student Success Score. The existing eight-percentage student submission average is a separate form-review statistic, labelled accordingly. The legacy agent weighted academic/placement component scores remain separate supporting assessments; they are not substituted for this seven-category index. The old global analytics now use scoped, current unified records instead of counting historical rows.

## Data quality, integration, and freshness

Join keys are registered campus IDs. CSV and JSON records must have a category, source reference, explicit non-future ISO measurement timestamp, and valid indicators. Percentages use 0–100; CGPA uses 0–10. Login frequency must be normalized by its source owner, not submitted as raw login counts. Invalid values, unsupported indicators, malformed dates, duplicate records, and out-of-scope IDs are rejected. Preview is read-only; verified imports are transactional and audited. CSV is an export/import adapter, not an automatic live LMS connector.

Legacy source tables use the latest record ID per student/category and are labelled undated. Dated approved submissions, faculty observations, and imported source records merge by timestamp per field. Later imports win ties at the same measurement timestamp. Older observations remain in history without replacing fresher fields. The profile exposes field-level provenance. Trends reconstruct only dated evidence, excluding undated legacy data. Coverage may change between dates and is displayed beside every historical score.

## Segments and action

Groups include complete strong academics / weak placement, complete strong academics / strong placement, low attendance with declining marks, good attendance / weak marks, low LMS participation, and low engagement. Groups overlap and publish definitions. Missing information prevents strong/complete classification.

Recommendations specify the trigger, practical task, review interval, and evidence requirement. Faculty explicitly approve assignment. Task completion records activity; improvement requires comparable verified reassessments. Satisfaction and feedback support mentoring and must not drive punishment. A trained prediction model would require labelled historical outcomes, calibration, validation, and bias assessment; none is claimed by this prototype.
