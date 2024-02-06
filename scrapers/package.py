"""
We combine the data from the Fireroad API and the data we scrape from the
catalog, into the format specified by src/lib/rawClass.ts.
"""

import datetime
import json
import utils

OVERRIDES = {
    "8.01": {
        "lectureRawSections": [
            "26-152/MW/0/9-10.30/F/0/9",
            "26-152/MW/0/10.30-12/F/0/11",
            "26-152/MW/0/1-2.30/F/0/1",
            "26-152/MW/0/3-4.30/F/0/3",
            "26-152/TR/0/9-10.30/F/0/10",
            "26-152/TR/0/11-12.30/F/0/12",
            "26-152/TR/0/3-4.30/F/0/4"
        ],
        "lectureSections": [
            [
                [[2, 3], [62, 3], [122, 2]],
                "26-152"
            ],
            [
                [[5, 3], [65, 3], [126, 2]],
                "26-152"
            ],
            [
                [[10, 3], [70, 3], [130, 2]],
                "26-152"
            ],
            [
                [[14, 3], [74, 3], [134, 2]],
                "26-152"
            ],
            [
                [[32, 3], [92, 3], [124, 2]],
                "26-152"
            ],
            [
                [[36, 3], [96, 3], [128, 2]],
                "26-152"
            ],
            [
                [[44, 3], [104, 3], [136, 2]],
                "26-152"
            ]
        ],
    },
    "21M.846": {
        "n": "Staging Frenchness",
        "d": "Exploration of contemporary theater of France, French West Africa, French Caribbean, and Québec. Focus is on staging of gender, race, nation, culture. Coursework includes readings, discussion, brief presentations and short writings, with some in-class reading of scenes and a group final project. No final paper or final exam. All course materials in English (reading may be done in French if desired). No prerequisites and no experience in French or theater required. Counts toward the French and/or Theater Arts concentration, minor, and major.",
    },
    # "2.00B": {
    #     "b": [],
    #     "tb": True,
    # },
    # "22.05": {
    #     "l": [[[[33, 3], [93, 3]], "24-121"]],
    #     "r": [[[[124, 2]], "24-121"]],
    # },
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

    with open("../public/latest.json", "w") as f:
        json.dump(obj, f, separators=(",", ":"))
    print(f"Got {len(courses)} courses")


if __name__ == "__main__":
    run()
