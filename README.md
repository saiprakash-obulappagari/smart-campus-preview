# Smart Campus Analytics

Node.js, Express, vanilla JavaScript and MySQL application for verified student performance, explainable academic/placement risk, faculty support and student tutoring.

## Team and ownership

| Team member | Responsibility | Delivery branch |
| --- | --- | --- |
| Prakash | Team lead and database | `codex/prakash-db` |
| Janardhan | Frontend behavior | `codex/janardhan-frontend` |
| Dhanunjay | Backend, access controls and agents | `codex/dhanunjay-backend` |
| Vamshi | UI/UX and styling | `codex/vamshi-ui-ux` |

Branches identify review/maintenance ownership. Imported implementation commits retain the actual committing account; they do not claim teammate authorship. Existing legacy branches remain available for comparison.

## Integration

The current implementation is delivered through four role-specific pull requests. All four are needed for the complete application. Database and styling can merge first; backend and frontend depend on their contracts. Every change should have an issue, a branch and a reviewed pull request. CI records actual checks, not simulated activity.

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
