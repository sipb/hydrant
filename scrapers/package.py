"""
We combine the data from the Fireroad API and the data we scrape from the
catalog, into the format specified by src/lib/rawClass.ts.
"""

import datetime
import json
import utils

OVERRIDES = {
    # "22.05": {
    #     "l": [[[[33, 3], [93, 3]], "24-121"]],
    #     "r": [[[[124, 2]], "24-121"]],
    # }
}


def run():
    with open("fireroad.json") as f:
        courses = json.load(f)
    with open("catalog.json") as f:
        catalog = json.load(f)

    for course, info in catalog.items():
        if course in courses:
            courses[course].update(info)
    for course, info in OVERRIDES.items():
        courses[course].update(info)

    term_info = utils.get_term_info()
    now = datetime.datetime.now().strftime("%Y-%m-%d %l:%M %p")
    obj = {
        "termInfo": term_info,
        "lastUpdate": now,
        "classes": courses,
    }

    with open("../public/full.json", "w") as f:
        json.dump(obj, f, separators=(",", ":"))
    print(f"Got {len(courses)} courses")


if __name__ == "__main__":
    run()
