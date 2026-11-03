# Git Collaboration Rules

## 1. Main branch
- `main` is the stable project branch.
- Team members must not push directly to `main`.
- Changes are proposed through Merge Requests.

## 2. Feature branches
Each team member works on a separate feature branch.

Suggested branches:
- `feature/network` – Network tasks
- `feature/infrastructure` – Virtual machine infrastructure
- `feature/automation` – Ansible automation
- `feature/cicd` – CI/CD pipeline
- `feature/monitoring` – Monitoring and logging

## 3. Commit rules
- Use clear and descriptive commit messages.
- Commit only files related to your task.
- Never commit passwords, tokens, or private credentials.

Examples:
- `docs: add CI/CD design`
- `docs: add monitoring plan`
- `ci: add initial pipeline`

## 4. Merge Request rules
- Create a Merge Request to merge feature branches into `main`.
- Explain the changes made.
- Ask a teammate to review the changes.
- Check that the pipeline passes when CI/CD is available.

## 5. Collaboration
- Inform the team before making major shared changes.
- Avoid modifying another member's work without coordination.
- Keep the repository organized and updated.