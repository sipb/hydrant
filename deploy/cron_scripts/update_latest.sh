#!/bin/bash

set -e

# This script runs the machinery in the given dir to scrape latest.json
# using the Hydrant scrapers, then updates it into the given directory.

# This script is called with two arguments: the Hydrant base dir, and the
# output dir.
[ ! -z "$2" ] || {
	echo "Usage: $0 <Hydrant base dir> <output dir>"
	exit 11
}

# Hydrant base directory, i.e. the one that has the copy of the repo, with
# all the scripts in it. In the locker, this is ~/hydrant
DIR="$1"

# The output directory, i.e. the one that has the folder being served to the
# internet. In the locker, this is ~/web-scripts/hydrant
OUT="$2"

cd "$DIR/scrapers"

# make sure we're in the right branch:
git checkout -f deploy
# -q means quietly; don't report anything in stdout or stderr.
git pull -q

# The scripts machine we use has Python 3.6, so use that.
# This updates $OUT_FILE.
python3.6 update.py
OUT_FILE="$DIR/public/latest.json"

# Copy $OUT_FILE to the output directory, so it can be served to the internet.
cp "$OUT_FILE" "$OUT"
