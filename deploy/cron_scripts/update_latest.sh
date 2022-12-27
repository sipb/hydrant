#!/bin/bash

set -e

# This script runs the machinery in the given dir to scrape latest.json
# using the Hydrant scrapers, then updates it into the given directory.

# Hydrant base directory, i.e. the one that has the copy of the repo, with
# all the scripts in it. In the locker, this is ~/hydrant.
REPO_DIR="/afs/sipb.mit.edu/project/hydrant/hydrant"

# The output directory, i.e. the one that has the folder being served to the
# internet. In the locker, this is ~/web-scripts/hydrant.
OUT_DIR="/afs/sipb.mit.edu/project/hydrant/web_scripts/hydrant"

cd "$REPO_DIR/scrapers"

# -q means quietly; don't report anything in stdout or stderr.
# make sure we're in the right branch:
git checkout -f deploy -q
git pull -q

# The scripts machine we use has Python 3.6, so use that.
# This updates $OUT_FILE.
python3.6 update.py
OUT_FILE="$REPO_DIR/public/latest.json"

# Copy $OUT_FILE to the output directory, so it can be served to the internet.
cp "$OUT_FILE" "$OUT_DIR"
