# Render deployment

Repository: https://github.com/saiprakash-obulappagari/smart-campus-preview

The Render web service serves both the frontend and Express APIs. The frontend uses the deployed origin, with a localhost fallback only for Live Server port 5500. Only explicitly named public frontend files are served; backend files and .env are not exposed.

## Required before deployment

Provision an external hosted MySQL database. A local Windows MySQL database is not accessible as localhost from Render. Store DB credentials only in Render environment settings. Apply `smart-campus-backend/database/schema.sql` and the approval/agent migrations to that hosted database. Configure a trusted administrator through a secure local database setup. Existing local users and data are not included in the ZIP or automatically uploaded.

Some MySQL providers require TLS. Configure their supplied CA and mysql2 SSL settings before connecting; never disable certificate verification as a workaround.

## Connect Render

1. Sign in at https://dashboard.render.com.
2. Choose New > Blueprint, connect the GitHub repository and select main.
3. Render reads render.yaml. Fill DB_HOST, DB_USER, DB_PASSWORD, DB_NAME and OPENAI_API_KEY. The AI key is optional for rule-based features; leave it empty if tutoring is not needed.
4. Review the service and create the Blueprint.
5. Wait for the build and database health check to pass. No successful deployment is claimed until Render reports a live service.

Manual Web Service settings: repository root unchanged; build `npm --prefix smart-campus-backend ci`; start `npm --prefix smart-campus-backend start`; health path `/api/health`; Node 22.

Do not upload .env or database exports containing student information. Render deploys from Git, not from the source ZIP. The ZIP is a source backup and contains no credentials or installed dependencies.
