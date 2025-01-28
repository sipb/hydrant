"""
This is the entry point. Run `python3 update.py` to test this code.

In production, there's a cron job that runs this script every hour.

Functions:
* run()
"""

import fireroad
import catalog
import cim
import package


def run():
    """
    This function is the entry point. There are no arguments.
    """
    print("=== Update fireroad data (pre-semester) ===")
    fireroad.run(False)
    print("=== Update fireroad data (semester) ===")
    fireroad.run(True)
    print("=== Update catalog data ===")
    catalog.run()
    print("=== Update CI-M data ===")
    cim.run()
    print("=== Packaging ===")
    package.run()


if __name__ == "__main__":
    run()
