"""
We combine the data from the Fireroad API and the data we scrape from the
catalog, into the format specified by src/lib/rawClass.ts.

Data:
* OVERRIDES: dict[str, dict[str, list]]: The list of overrides

Functions:
* run(): The main entry point.
* get_json_data(jsonfile): Gets data from the specified JSON file.
"""

import datetime
import json
import os
import utils

# set the current working directory to avoid bugs
os.chdir(os.path.dirname(os.path.abspath(__file__)))

def get_json_data(jsonfile):
    """
    Gets data from a JSON file.

    Args:
    * jsonfile (str): The file to read from.

    Returns:
    * Any: The data inside the file.
    """
    with open(jsonfile, mode = "r", encoding = "utf-8") as f:
        return json.load(f)

def run():
    """
    The main entry point.
    Takes data from fireroad.json and catalog.json; outputs latest.json.
    There are no arguments and no return value.
    """
    # call get_overrides
    OVERRIDES = get_json_data("overrides.json")
    fireroad = get_json_data("fireroad.json")
    catalog = get_json_data("catalog.json")

    # main logic
    courses = {}

    # The key needs to be in BOTH fireroad and catalog to make it:
    # If it's not in Fireroad, we don't have its schedule.
    # If it's not in catalog, it's not offered this semester.
    for course in set(fireroad) & set(catalog):
        courses[course] = fireroad[course]
        courses[course].update(catalog[course])

    for course, info in OVERRIDES.items():
        if course in courses:
            courses[course].update(info)

    term_info = utils.get_term_info()
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    obj = {
        "termInfo": term_info,
        "lastUpdated": now,
        "classes": courses,
    }

    with open("../public/latest.json", mode = "w", encoding = "utf-8") as f:
        json.dump(obj, f, separators=(",", ":"))
    print(f"Got {len(courses)} courses")


if __name__ == "__main__":
    run()
