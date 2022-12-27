#!/usr/bin/env python3

# Accept a web-hook from GitHub telling us about
# a new built version of Hydrant.

import json, requests

from sys import stdin, stdout
from os import environ, path
from hmac import digest
from tempfile import TemporaryDirectory
from zipfile import ZipFile

LOCKER_DIR = "/afs/sipb.mit.edu/project/hydrant"

OUTPUT_DIR = path.join(LOCKER_DIR, "web_scripts/hydrant")
ERROR_LOG = path.join(LOCKER_DIR, "error_log")

CI_SECRETS_DIR = path.join(LOCKER_DIR, "ci_secrets")
HASH_SECRET = path.join(CI_SECRETS_DIR, "hash_secret")
GITHUB_TOKEN = path.join(CI_SECRETS_DIR, "github_token")


def main():
    # Secret, used for HMAC input validation (so we know GitHub is being real)
    with open(HASH_SECRET) as fh:
        secret = fh.read().strip().encode("utf-8")
    # API token for GitHub API requests (to get a path to the file)-- needs yearly updating!
    with open(GITHUB_TOKEN) as fh:
        token = fh.read().strip()

    # Slurp content and validate with HMAC
    body = stdin.read()
    hexdigest = "sha256=" + digest(secret, body.encode("utf-8"), "sha256").hex()
    if hexdigest != environ.get("HTTP_X_HUB_SIGNATURE_256", ""):
        raise ValueError("bad digest")

    # Extract the Run ID for the build
    payload = json.loads(body)
    if payload.get("action") != "completed":
        raise ValueError("not completed")
    job_id = payload.get("workflow_job", {}).get("run_id")
    if not job_id:
        raise ValueError("no job id")

    # Fetch a list of artifacts from the GitHub API
    response = requests.get(
        "https://api.github.com/repos/sipb/hydrant/actions/runs/{}/artifacts".format(
            job_id
        )
    )
    if not response.ok:
        raise ValueError("bad artifact fetch response: " + str(response.status_code))
    artifact_info = response.json()

    # For each known artifact:
    success = False
    for artifact in artifact_info.get("artifacts", []):
        # check that its name is correct,
        if artifact.get("name") != "built-site":
            continue
        url = artifact.get("archive_download_url")
        if not url:
            continue
        # then fetch it.
        response = requests.get(url, headers={"Authorization": ("Bearer " + token)})
        with TemporaryDirectory() as td:
            fname = path.join(td, "build_artifact.zip")
            with open(fname, "wb") as fh:
                for chunk in response.iter_content(chunk_size=4096):
                    fh.write(chunk)
            # Extract into the output directory.
            with ZipFile(fname, "r") as zfh:
                zfh.extractall(OUTPUT_DIR)
        success = True
        break
    return "Fetched artifact successfully" if success else "Could not find artifact :("


if __name__ == "__main__":
    # Respond to the request, it's only polite.
    print("Content-Type: text/plain\r\n\r")
    try:
        print(main())
    except Exception as e:
        print(e, file=stdout)
        print(e, file=open(ERROR_LOG, "w"))
