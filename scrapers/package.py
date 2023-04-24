"""
We combine the data from the Fireroad API and the data we scrape from the
catalog, into the format specified by src/lib/rawClass.ts.
"""

import datetime
import json
import utils

OVERRIDES = {
    "2.00B": {
        "b": [],
        "tb": True
    }
    # "22.05": {
    #     "l": [[[[33, 3], [93, 3]], "24-121"]],
    #     "r": [[[[124, 2]], "24-121"]],
    # }
}


def run():
    courses = dict()
    with open("fireroad.json") as f:
        fireroad = json.load(f)
    with open("catalog.json") as f:
        catalog = json.load(f)

    # The key needs to be in BOTH fireroad and catalog to make it:
    # If it's not in Fireroad, we don't have its schedule.
    # If it's not in catalog, it's not offered this semester.
    for course in set(fireroad) & set(catalog):
        courses[course] = fireroad[course]
        courses[course].update(catalog[course])

    for course, info in OVERRIDES.items() & courses:
        courses[course].update(info)

    term_info = utils.get_term_info()
    now = datetime.datetime.now().strftime("%Y-%m-%d %l:%M %p")
    obj = {
        "termInfo": term_info,
        "lastUpdated": now,
        "classes": courses,
    }

    with open("../public/latest.json", "w") as f:
        json.dump(obj, f, separators=(",", ":"))
    print(f"Got {len(courses)} courses")


if __name__ == "__main__":
    run()
