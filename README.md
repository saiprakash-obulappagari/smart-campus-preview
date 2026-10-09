# Smart Campus Analytics

Node.js, Express, vanilla JavaScript and MySQL application for verified student performance, explainable academic/placement risk, faculty support and student tutoring.

## Team and ownership

| Team member | Responsibility | Delivery branch |
| --- | --- | --- |
| Prakash | Team lead and database | `prakash-db` |
| Janardhan | Frontend behavior | `janardhan-frontend` |
| Dhanunjay | Backend, access controls and agents | `dhanunjay-backend` |
| Vamshi | UI/UX and styling | `vamshi-ui-ux` |

Branches identify review/maintenance ownership. Imported implementation commits retain the actual committing account; they do not claim teammate authorship. Existing legacy branches remain available for comparison.

## Current delivery and review queue

| Responsible reviewer | Real work item | Implementation PR |
| --- | --- | --- |
| Prakash | [Database review #1](https://github.com/saiprakash-obulappagari/smart-campus-preview/issues/1) | [Database #9](https://github.com/saiprakash-obulappagari/smart-campus-preview/pull/9) |
| Dhanunjay | [Backend review #3](https://github.com/saiprakash-obulappagari/smart-campus-preview/issues/3) | [Backend #10](https://github.com/saiprakash-obulappagari/smart-campus-preview/pull/10) |
| Janardhan | [Frontend review #5](https://github.com/saiprakash-obulappagari/smart-campus-preview/issues/5) | [Frontend #11](https://github.com/saiprakash-obulappagari/smart-campus-preview/pull/11) |
| Vamshi | [UI/UX review #7](https://github.com/saiprakash-obulappagari/smart-campus-preview/issues/7) | [Styling #12](https://github.com/saiprakash-obulappagari/smart-campus-preview/pull/12) |

[Live CI runs](https://github.com/saiprakash-obulappagari/smart-campus-preview/actions) · [Open issues](https://github.com/saiprakash-obulappagari/smart-campus-preview/issues) · [Pull requests](https://github.com/saiprakash-obulappagari/smart-campus-preview/pulls)

These links are the source of current status. Human reviews, account assignments and production deployment are not implied by passing CI. Confirm teammate GitHub handles before assigning accounts. Repository owners should require PR review and the `validate` check on main; the current publishing account has write permission but cannot configure repository protection.

## Integration

The four role-specific implementation pull requests are merged into main. The combined checkout passed nine unit tests and both MySQL integration suites; the dependency audit reported zero vulnerabilities. Human device/accessibility reviews remain tracked in the linked issues. Every change should have an issue, a branch and a reviewed pull request. CI records actual checks, not simulated activity.

After integration:

1. Install Node.js and MySQL.
2. Run `npm ci` in `smart-campus-backend`.
3. Copy `.env.example` to `.env` and supply local credentials and JWT secret.
4. Apply `smart-campus-backend/database/schema.sql` in MySQL.
5. Run `node database/migrate-approvals.js` and `node database/migrate-agents.js` from the backend directory.
6. Run `npm test`, then `npm start`.
7. Serve the frontend with Live Server at port 5500.

No default production admin password is published. Create an approved administrator through a trusted local setup process. Optional OpenAI credentials stay server-side. See `smart-campus-backend/AGENTS-INTEGRATION.md` for agents and limitations.

## Tracking

Use open issues for pending review and unfinished work. Close an issue only after its acceptance criteria are met. Pull requests include validation evidence and dependencies. See [CONTRIBUTING.md](CONTRIBUTING.md).
