"""
This is the entry point. Run `python3 -m scrapers` to test this code.

In production, there's a cron job that runs this script every hour.

Functions:
* run()
"""

from .catalog import run as catalog_run
from .cim import run as cim_run
from .fireroad import run as fireroad_run
from .package import run as package_run


def run():
    """
    This function is the entry point. There are no arguments.
    """
    print("=== Update fireroad data (pre-semester) ===")
    fireroad_run("presem")
    print("=== Update fireroad data (semester) ===")
    fireroad_run("sem")
    print("=== Update catalog data ===")
    catalog_run()
    print("=== Update CI-M data ===")
    cim_run()
    print("=== Packaging ===")
    package_run()


if __name__ == "__main__":
    run()
