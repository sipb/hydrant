# Deploy scripts
Scripts in this directory are processed by Github's CI service.

## autodeploy.yml
This script automatically deploys a build of Hydrant to Scripts when it receives the `push` Git hook.

## ci.yml
This script runs Black (for backend formatting), Prettier (for frontend formatting), and ESLint (for frontend linting) for any pull request or push to the `main` branch.
