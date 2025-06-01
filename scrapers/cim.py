"""
To include CI-M metadata, we scrape the Registrar's website which includes a
list of all CI-M subjects for each course.

run() scrapes this data and writes it to cim.json, in the format:

.. code-block:: json
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

import json
import os.path
from collections import OrderedDict
from typing import Dict, List, OrderedDict as OrderedDictType, Set

import requests
from bs4 import BeautifulSoup, Tag

# pylint: disable=line-too-long
CIM_URL = "https://registrar.mit.edu/registration-academics/academic-requirements/communication-requirement/ci-m-subjects/subject"


def get_sections() -> List[Tag]:
    """
    Scrapes accordion sections from Registrar page that contains lists of CI-M

    Returns:
        list[bs4.element.Tag]: The accordion sections that contain lists of CI-M
            subjects
    """
    cim_req = requests.get(
        CIM_URL,
        timeout=5,
    )
    soup = BeautifulSoup(cim_req.text, "html.parser")

    return [
        item
        for item in soup.select("[data-accordion-item]")
        if item.select(".ci-m__section")
    ]


def get_courses(section: Tag) -> OrderedDictType[str, Set[str]]:
    """
    Extracts the courses contained in a section and their corresponding CI-M
    subjects.

    Args:
        section (bs4.element.Tag): from get_sections()

    Returns:
        OrderedDict[str, set[str]]: A mapping from each course (major) contained
            within the given section to the set of subject numbers (classes) that may
            satisfy the CI-M requirement for that course number.
    """
    courses = OrderedDict[str, set[str]]()
    for subsec in section.select(".ci-m__section"):
        title = subsec.select_one(".ci-m__section-title").text.strip().replace("*", "")  # type: ignore

        # If no title, add to the previous subsection
        if title:
            subjects: Set[str] = set()
        else:
            title, subjects = courses.popitem()

        subjects |= {
            subj.text.strip() for subj in subsec.select(".ci-m__subject-number")
        }
        courses[title] = subjects
    return courses


def run() -> None:
    """
    The main entry point.
    """
    sections = get_sections()

    # This maps each course number to a set of CI-M subjects for that course
    courses: OrderedDict[str, Set[str]] = OrderedDict()
    for section in sections:
        new_courses = get_courses(section)
        assert new_courses.keys().isdisjoint(courses.keys())
        courses.update(new_courses)

    # This maps each subject to a list of courses for which it is a CI-M
    subjects: Dict[str, Dict[str, List[str]]] = {}
    for course in courses:
        for subj in courses[course]:
            for number in subj.replace("J", "").split("/"):
                subjects.setdefault(number, {"cim": []})["cim"].append(course)

    fname = os.path.join(os.path.dirname(__file__), "cim.json")
    with open(fname, "w", encoding="utf-8") as cim_file:
        json.dump(subjects, cim_file)


if __name__ == "__main__":
    run()
