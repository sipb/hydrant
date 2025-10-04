# Deploy scripts

GitHub Actions runs all workflows in this folder.

## autodeploy.yml

Whenever someone pushes to the `deploy` branch, this script will build Hydrant from source anew and upload it as an artifact. This, in turn, automatically deploys the new version to Scripts. See `deploy/README.md` for details.

## ci-frontend.yml

This runs two checks:

- Prettier for formatting
- ESLint linting + TypeScript typechecking (bundled as a single check)

This pipeline does NOT trigger on pull requests or commits that only affect backend-related code, documentation, or JSON/TOML data.

## ci-backend.yml

This runs three checks, also for pull requests and commits to the `main` branch:

- Black for formatting
- Pylint for linting
- A basic integration test. This job executes the scrapers and then checks whether `public/latest.json` (which the scrapers should have generated) now exists. We're currently using this instead of comprehensive unit testing, since we haven't gotten around to that yet.

As with the previous pipeline, this one does NOT trigger on pull requests or commits that only affect _frontend_-related code, documentation, or JSON/TOML data.
