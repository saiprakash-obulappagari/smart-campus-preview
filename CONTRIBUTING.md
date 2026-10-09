# Team workflow

1. Choose a real issue and identify its responsible team member.
2. Branch from updated main using your role branch or a focused feature branch.
3. Commit using your own Git identity. Never backdate commits or impersonate teammates.
4. Run relevant tests and document limitations in the pull request.
5. Ask another teammate to review; Prakash coordinates database/API contract changes.
6. Merge after checks and review. Update the issue with actual outcomes.

Do not commit `.env`, API keys, database dumps containing personal information or `node_modules`. Use `.env.example` with placeholders. If a secret already exists in legacy Git history, rotate it; ignoring a file does not erase that history.

Backend/DB changes require validation of approval rules, department scope and evidence requirements. Frontend changes need desktop/mobile review and an actual API check. Styling changes must preserve keyboard access and responsive forms.

Account assignments and CODEOWNERS require confirmed GitHub usernames. Until provided, ownership is documented by name rather than invented handles. Branch protection is configured by the repository administrator; adding these files alone does not enforce it.
