"""
Fetches information about the locations of MIT buildings from an ArcGIS endpoint
provided by MIT Facilities (more info: <https://maps-fisgis.hub.arcgis.com/>).

This is written to the file locations.json, in the following format:
.. code-block:: json
    {
        "56": {
            "number": "56",
            "x": 766928.3517173745,
            "y": 2956695.64603492
        }
    }

The x and y values, in the Massachusetts Mainland projection, are given by the
average of the locations of the building access points (entrances).

Functions:
    get_raw_data()
    convert_data(rows)
    run()
"""

from __future__ import annotations

import json
import os
import socket
import statistics
from functools import lru_cache
from typing import TypedDict
from urllib.error import URLError

from scrapers.utils import read_csv

# pylint: disable=line-too-long
LOCATIONS_URL = "https://hub.arcgis.com/api/download/v1/items/b935e99782064e2da7cc8e08ba10c1cb/csv?layers=3"

AccessPoint = TypedDict(
    "AccessPoint",
    {
        "FID": str,
        "OBJECTID": str,
        "X_Coord": str,
        "Y_Coord": str,
        "Location": str,
        "FACILITY": str,
        "Display": str,
        "Level": str,
        "Visitor": str,
        "Public": str,
        "Kiosk": str,
        "QR_Code": str,
        "Accessible": str,
        "Power": str,
        "x": str,
        "y": str,
    },
)
"""
A row from the raw CSV data fetched from ArcGIS.
"""


class BuildingInfo(TypedDict):
    """
    Information about a building, in the format expected by the frontend (see raw.ts)
    """

    number: str
    x: float
    y: float


@lru_cache(maxsize=None)
def get_raw_data() -> list[AccessPoint]:
    """
    Fetches the raw CSV data from the MIT Facilities ArcGIS endpoint.

    Returns:
        Any: The raw data from the ArcGIS endpoint.

    Raises:
        URLError: If there is a protocol error.
        socket.timeout: If the request times out.
    """

    return read_csv(LOCATIONS_URL, AccessPoint)


def convert_data(rows: list[AccessPoint]) -> dict[str, BuildingInfo]:
    """
    Converts the raw CSV data to a dict mapping building numbers to BuildingInfo
    objects. Each BuildingInfo object contains the average of the latitudes and
    longitudes of the access points corresponding to that building.

    Args:
        rows (list[AccessPoint]): The raw CSV data fetched from the ArcGIS endpoint.

    Returns:
        dict[str, BuildingInfo]: A dictionary mapping building numbers to BuildingInfo objects.
    """
    out: dict[str, BuildingInfo] = {}
    buildings = set(row["FACILITY"] for row in rows)

    for building in buildings:
        xs, ys = zip(
            *(
                (float(row["x"]), float(row["y"]))
                for row in rows
                if row["FACILITY"] == building
            )
        )
        x = statistics.mean(xs)
        y = statistics.mean(ys)
        out[building] = {
            "number": building,
            "x": x,
            "y": y,
        }

    return out


def run():
    """
    The main entry point. All data are written to `locations.json`.
    """
    fname = os.path.join(os.path.dirname(__file__), "locations.json")

    try:
        rows = get_raw_data()
    except (URLError, socket.timeout, UnicodeDecodeError) as e:
        print(f"Unable to scrape locations data: {e}")
        if not os.path.exists(fname):
            with open(fname, "w", encoding="utf-8") as location_file:
                json.dump({}, location_file)
        return

    locations = convert_data(rows)

    with open(fname, "w", encoding="utf-8") as locations_file:
        json.dump(locations, locations_file)

    print(f"Processed location data for {len(locations)} buildings")


if __name__ == "__main__":
    run()
