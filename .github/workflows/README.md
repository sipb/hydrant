# Deploy scripts
Scripts in this directory are processed by Github's CI service.

## autodeploy.yml
This script automatically deploys a build of Hydrant to Scripts when it receives the `push` Git hook.

## ci-frontend.yml

This runs two checks:
- Prettier for formatting
- ESLint linting + TypeScript typechecking (bundled as a single check)

This pipeline will NOT trigger on pull requests or commits that only affect backend-related code or documentation. It also only triggers on the `main` branch.

## ci-backend.yml

This runs three checks:
- Black for formatting
- Pylint for linting
- A basic integration test. The scrapers are executed, and then the generated JSON file is validated against the JSON schema (`scrapers/hydrant_schema.json`). This is in lieu of more comprehensive unit testing, which we haven't gotten around to yet.

Similar to the previous pipeline, it will NOT trigger on pull requests or commits that only affect *frontend*-related code or documentation. It also only triggers on the `main` branch.
