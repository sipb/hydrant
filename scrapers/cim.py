"""
To include CI-M metadata, we scrape the Registrar's website which includes a
list of all CI-M subjects for each course.

run() scrapes this data and writes it to cim.json, in the format:

{
    "6.1800": {
        "cim": [
            "6-1, 6-2, 6-3, 6-4, 6-5, 6-P",
            "10C",
            "18-C",
        ]
    }
}
"""

import itertools
import json
import requests
from bs4 import BeautifulSoup
from collections import OrderedDict


def get_sections():
    """
    Scrapes accordion sections from
    https://registrar.mit.edu/registration-academics/academic-requirements/communication-requirement/ci-m-subjects/subject

    Args: none

    Returns:
    * list[bs4.element.Tag]: The accordion sections that contain lists of CI-M
    subjects
    """
    r = requests.get(
        "https://registrar.mit.edu/registration-academics/academic-requirements/communication-requirement/ci-m-subjects/subject",
        timeout=1,
    )
    soup = BeautifulSoup(r.text, "html.parser")

    return [
        item
        for item in soup.select("[data-accordion-item]")
        if item.select(".ci-m__section")
    ]


def get_courses(section):
    """
    Extracts the courses contained in a section and their corresponding CI-M
    subjects.

    Args:
    * section (bs4.element.Tag): from get_sections()

    Returns:
    * OrderedDict[str, set[str]]: A mapping from each course (major) contained
    within the given section to the set of subject numbers (classes) that may
    satisfy the CI-M requirement for that course number.
    """
    courses = OrderedDict()
    for subsec in section.select(".ci-m__section"):
        title = subsec.select_one(".ci-m__section-title").text.strip().replace("*", "")

        # If no title, add to the previous subsection
        if title:
            subjects = set()
        else:
            title, subjects = courses.popitem()

        subjects |= {
            subj.text.strip() for subj in subsec.select(".ci-m__subject-number")
        }
        courses[title] = subjects
    return courses


def run():
    """
    The main entry point.

    Args: none

    Returns: none
    """
    sections = get_sections()

    # This maps each course number to a set of CI-M subjects for that course
    courses = OrderedDict()
    for section in sections:
        new_courses = get_courses(section)
        assert new_courses.keys().isdisjoint(courses.keys())
        courses.update(new_courses)

    # This maps each subject to a list of courses for which it is a CI-M
    subjects = {}
    for course in courses:
        for subj in courses[course]:
            for number in subj.replace("J", "").split("/"):
                subjects.setdefault(number, {"cim": []})["cim"].append(course)

    with open("cim.json", "w", encoding="utf-8") as f:
        json.dump(subjects, f)


if __name__ == "__main__":
    run()
