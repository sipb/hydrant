"""
We get most of our data from the Fireroad API.

run() scrapes this data and writes it to fireroad.json, in the raw class format
specified in src/lib/rawClass.ts, but missing some keys (which we pull from
catalog.py instead).

The Fireroad API is updated every few minutes, so it should always have the
schedule for the latest term.

Functions:
    parse_timeslot(day, slot, pm)
    parse_section(section)
    parse_schedule(course)
    parse_quarter_info(course)
    parse_attributes(course)
    parse_terms(course)
    parse_prereqs(course)
    get_course_data(courses, course, term)
    get_raw_data()
    run(is_semester_term)
"""

from __future__ import annotations

import json
import os.path
import socket
from functools import lru_cache
from typing import Any, Union, Dict, List, Tuple
from urllib.error import URLError
from urllib.request import urlopen

from .utils import (
    GIR_REWRITE,
    MONTHS,
    Term,
    find_timeslot,
    get_term_info,
    grouper,
    url_name_to_term,
)

URL = "https://fireroad.mit.edu/courses/all?full=true"

# type declarations

UnionOfDifferentThings = Union[
    str,
    bool,
    float,
    int,
    Dict[str, Tuple[int, int]],
    List[str],
    Dict[str, Union[List[str], bool]],
]

Course = Dict[str, UnionOfDifferentThings]

CourseListing = Dict[str, Course]


def parse_timeslot(day: str, slot: str, time_is_pm: bool) -> Tuple[int, int]:
    """Parses a timeslot.

    >>> parse_timeslot("M", "10-11.30", False)
    (8, 3)

    Args:
        day (str): The day as a string
        slot (str): The slot as a string
        time_is_pm (bool): Whether the timeslot is in the evening

    Raises:
        AssertionError: If time_is_pm and slot disagree on whether the slot is in
            the evening, or if the start slot is later than the end slot.
        KeyError: If no matching timeslot could be found.

    Returns:
        List[int]: The parsed day and timeslot
    """
    assert time_is_pm == slot.endswith(" PM")
    slot = slot.rstrip(" PM")

    if "-" in slot:
        start, end = slot.split("-")
        try:
            start_slot = find_timeslot(day, start, time_is_pm)
            end_slot = find_timeslot(day, end, time_is_pm)
        except KeyError:
            # Maybe the start time is AM but the end time is PM
            start_slot = find_timeslot(day, start, False)
            end_slot = find_timeslot(day, end, True)
    else:
        start_slot = find_timeslot(day, slot, time_is_pm)
        # Slot is one hour long, so length is 2.
        end_slot = start_slot + 2

    assert end_slot > start_slot

    return start_slot, end_slot - start_slot


def parse_section(section: str) -> Tuple[List[Tuple[int, int]], str]:
    """Parses a section string.

    >>> parse_section("32-123/TR/0/11/F/0/2")
    ([[36, 2], [96, 2], [132, 2]], '32-123')

    Args:
        section (str): The section given as a string

    Returns:
        List[Union[List[str], str]]: The parsed section.
    """
    place, *infos = section.split("/")
    slots: List[Tuple[int, int]] = []

    for weekdays, is_pm_int, slot in grouper(infos, 3):
        for day in weekdays:
            if day == "S":
                continue
            slots.append(parse_timeslot(day, slot, bool(int(is_pm_int))))

    return slots, place


def parse_schedule(schedule: str) -> Dict[str, Union[List[str], bool]]:
    """
    Parses the schedule string, which looks like:
    "Lecture,32-123/TR/0/11/F/0/2;Recitation,2-147/MW/0/10,2-142/MW/0/11"

    Args:
        schedule (str): The schedule string.

    Returns:
        Dict[str, union[list, bool]: The parsed schedule
    """
    section_tba = False
    result: Dict[str, Union[List[str], bool]] = {}

    # Kinds of sections that exist.
    section_kinds = ("Lecture", "Recitation", "Lab", "Design")

    result_section_kinds: List[str] = []

    for chunk in schedule.split(";"):
        name, *sections = chunk.split(",")

        if name not in section_kinds:
            print(f"Unknown section kind: {name}")
            continue

        # The key is lowercase
        kind = name.lower()
        result_section_kinds.append(kind)

        # Raw section times, e.g. T9.301-11 or TR1,F2.
        result[kind + "RawSections"] = sections

        # Section timeslots and rooms.
        kind_section_name = kind + "Sections"
        result[kind_section_name] = []
        for info in sections:
            if info == "TBA":
                section_tba = True
            else:
                result[kind_section_name].append(parse_section(info))  # type: ignore

    # True if some schedule is not scheduled yet.
    result["sectionKinds"] = result_section_kinds
    result["tba"] = section_tba
    return result


def decode_quarter_date(date: str) -> Union[Tuple[int, int], None]:
    """
    Decodes a quarter date into a month and day.

    Args:
        date (str): The date in the format "4/4" or "apr 4".

    Returns:
        Tuple[int, int]: The month and day.
    """
    if "/" in date:
        month, day = date.split("/")
        return int(month), int(day)
    if " " in date:
        # NOTE: if we reuse the `month` variable, mypy will complain!
        other_month, other_day = MONTHS[(date.split())[0]], (date.split())[1]
        return int(other_month), int(other_day)

    return None


def parse_quarter_info(
    course: Course,
) -> Dict[str, Dict[str, Tuple[int, int]]]:
    """
    Parses quarter info from the course.
    If quarter information key is present, returns either start date, end date, or both.

    Can start with either 0, 1, or 2.
    e.g. "0,apr 14" meaning subject ends on Apr 14,
    or "1,4/4" meaning subject begins on 4/4,
    or "2,4/9 to 5/9" meaning subject meets from 4/9 to 5/9.

    .. note::
        dates can appear as either "4/4" or "apr 4".

    Args:
        course (Course): The course object.

    Returns:
        Dict[str, Dict[str, Tuple[int, int]]]: The parsed quarter info.
    """

    quarter_info = course.get("quarter_information", "")
    assert isinstance(quarter_info, str)
    if quarter_info:
        quarter_info_list = quarter_info.split(",")

        if quarter_info_list[0] == "0":
            end_date = decode_quarter_date(quarter_info_list[1])
            if end_date:
                return {"quarterInfo": {"end": end_date}}

        elif quarter_info_list[0] == "1":
            start_date = decode_quarter_date(quarter_info_list[1])
            if start_date:
                return {"quarterInfo": {"start": start_date}}

        elif quarter_info_list[0] == "2" and "to" in quarter_info_list[1]:
            dates = quarter_info_list[1].split(" to ")
            start_date = decode_quarter_date(dates[0])
            end_date = decode_quarter_date(dates[1])
            if start_date and end_date:
                return {"quarterInfo": {"start": start_date, "end": end_date}}

    return {}


def parse_attributes(
    course: Course,
) -> Dict[str, bool]:
    """
    Parses attributes of the course.

    Args:
        course (Course):
            The course object.

    Returns:
        Dict[str, bool]: The attributes of the course.
    """
    hass_codes = course.get("hass_attribute", "X")
    comms_code = course.get("communication_requirement", "")
    gir_attr = course.get("gir_attribute", "")

    assert isinstance(hass_codes, str)
    hass_code: str = hass_codes[-1]

    return {
        "hassH": hass_code == "H",
        "hassA": hass_code == "A",
        "hassS": hass_code == "S",
        "hassE": hass_code == "E",
        "cih": comms_code == "CI-H",
        "cihw": comms_code == "CI-HW",
        "rest": gir_attr == "REST",
        "lab": gir_attr == "LAB",
        "partLab": gir_attr == "LAB2",
    }


def parse_terms(
    course: Course,
) -> Dict[str, List[str]]:
    """
    Parses the terms of the course.

    Args:
        course (Course):
            The course object.

    Returns:
        Dict[str, List[str]]: The parsed terms, stored in the key "terms".
    """
    terms = [
        name
        for name, attr in [
            ("FA", "offered_fall"),
            ("JA", "offered_IAP"),
            ("SP", "offered_spring"),
            ("SU", "offered_summer"),
        ]
        if course[attr]
    ]
    return {"terms": terms}


def parse_prereqs(
    course: Course,
) -> Dict[str, str]:
    """
    Parses prerequisites from the course.

    Args:
        course (Course): The course object.

    Returns:
        Dict[str, str]: The parsed prereqs, in the key "prereqs".
    """
    prereqs = course.get("prerequisites", "")
    assert isinstance(prereqs, str)
    for gir, gir_rw in GIR_REWRITE.items():
        prereqs = prereqs.replace(gir, gir_rw)
    if not prereqs:
        prereqs = "None"
    return {"prereqs": prereqs}


def get_schedule_data(course: Course, term: Term) -> Dict[str, Union[List[str], bool]]:
    """
    Helper function for `get_course_data`

    Args:
        course (Course): the course
        term (Term): the term

    Returns:
        (Dict[str, Union[List[str], bool]]): schedule-related data
    """
    has_schedule = "schedule" in course
    if has_schedule:
        # helper variable to make code DRYer
        term_to_parse: str = ""
        if term == Term.FA and "schedule_fall" in course:
            term_to_parse = "schedule_fall"
        elif term == Term.JA and "schedule_IAP" in course:
            term_to_parse = "schedule_IAP"
        elif term == Term.SP and "schedule_spring" in course:
            term_to_parse = "schedule_spring"
        else:
            term_to_parse = "schedule"

        course_schedule = course[term_to_parse]
        assert isinstance(course_schedule, str)
        try:
            return parse_schedule(course_schedule)
        except ValueError as val_err:
            # if we can't parse the schedule, warn
            # NOTE: parse_schedule will raise a ValueError
            print(f"Can't parse schedule {course.get('subject_id', '')}: {val_err!r}")
            has_schedule = False
    if not has_schedule:
        return {
            "tba": False,
            "sectionKinds": [],
            "lectureSections": [],
            "recitationSections": [],
            "labSections": [],
            "designSections": [],
            "lectureRawSections": [],
            "recitationRawSections": [],
            "labRawSections": [],
            "designRawSections": [],
        }
    raise AssertionError("This shouldn't be possible")


def get_course_data(
    courses: CourseListing,
    course: Course,
    term: Term,
) -> bool:
    """
    Parses a course from the Fireroad API, and puts it in courses. Skips the
    courses that are not offered in the current term. Returns False if skipped,
    True otherwise. The `courses` variable is modified in place.

    Args:
        courses (CourseListing):
            The list of courses.
        course (Course):
            The course in particular.
        term (Term): The current term (fall, IAP, or spring).

    Returns:
        bool: Whether the course was entered into courses.
    """
    course_code = course.get("subject_id", "")
    assert isinstance(course_code, str)
    course_num, course_class = course_code.split(".")
    raw_class: Course = {
        "number": course_code,
        "course": course_num,
        "subject": course_class,
    }

    # prereqs
    raw_class.update(parse_prereqs(course))

    # terms
    terms_dict = parse_terms(course)
    raw_class.update(terms_dict)
    if term.name not in terms_dict.get("terms", []):
        return False

    # tba, sectionKinds, lectureSections, recitationSections, labSections,
    # designSections, lectureRawSections, recitationRawSections, labRawSections,
    # designRawSections
    raw_class.update(get_schedule_data(course, term))

    # hassH, hassA, hassS, hassE, cih, cihw, rest, lab, partLab
    raw_class.update(parse_attributes(course))

    samelist = course.get("joint_subjects", [])
    meetslist = course.get("meets_with_subjects", [])
    assert isinstance(samelist, list)
    assert isinstance(meetslist, list)
    try:
        raw_class.update(
            {
                "lectureUnits": course["lecture_units"],
                "labUnits": course["lab_units"],
                "preparationUnits": course["preparation_units"],
                "level": course["level"],
                "isVariableUnits": course["is_variable_units"],
                "same": ", ".join(samelist),
                "meets": ", ".join(meetslist),
            }
        )
    except KeyError as key_err:
        print(f"Can't parse {course_code}: {key_err!r}")
        return False
    # This should be the case with variable-units classes, but just to make
    # sure.
    if raw_class["isVariableUnits"]:
        assert raw_class["lectureUnits"] == 0
        assert raw_class["labUnits"] == 0
        assert raw_class["preparationUnits"] == 0

    # Get quarter info if available
    raw_class.update(parse_quarter_info(course))

    instructor_list = course.get("instructors", [])
    assert isinstance(instructor_list, list)
    raw_class.update(
        {
            "description": course.get("description", ""),
            "name": course.get("title", ""),
            "inCharge": ",".join(instructor_list),
            "virtualStatus": course.get("virtual_status", "") == "Virtual",
        }
    )

    # nonext, repeat, url, final, half, limited are from catalog.json, not here

    if "old_id" in course:
        raw_class["oldNumber"] = course["old_id"]

    # NOTE: a priori these could be different types
    # (the most elegant way to fix this would probably be JSON schema validation)
    in_class_hours = course.get("in_class_hours", 0)
    out_of_class_hours = course.get("out_of_class_hours", 0)

    # workaround since we can't use the "|" symbol
    assert(isinstance(in_class_hours, (int, float)))
    assert(isinstance(out_of_class_hours, (int, float)))

    raw_class.update(
        {
            "rating": course.get("rating", 0),
            "hours": in_class_hours + out_of_class_hours,
            "size": course.get("enrollment_number", 0),
        }
    )

    courses[course_code] = raw_class
    return True


@lru_cache(maxsize=None)
def get_raw_data() -> Any:
    """
    Obtains raw data directly from the Fireroad API.
    Helper function for run().

    Returns:
        Any: The raw data from the Fireroad API.
    """
    with urlopen(URL, timeout=15) as raw_data_req:
        text = raw_data_req.read().decode("utf-8")
    data = json.loads(text)
    return data


def run(is_semester_term: bool) -> None:
    """
    The main entry point. All data is written to `fireroad.json`.
    If is_semester_term = True, looks at semester term (fall/spring).
    If is_semester_term = False, looks at pre-semester term (summer/IAP)

    Args:
        is_semester_term (bool): whether to look at the semester
            or the pre-semester term.
    """
    fname = "fireroad-sem.json" if is_semester_term else "fireroad-presem.json"
    fname = os.path.join(os.path.dirname(__file__), fname)

    try:
        data = get_raw_data()
    except (URLError, socket.timeout):
        print("Unable to scrape FireRoad data.")
        if not os.path.exists(fname):
            with open(fname, "w", encoding="utf-8") as fireroad_file:
                json.dump({}, fireroad_file)
        return

    courses: CourseListing = {}
    term = url_name_to_term(get_term_info(is_semester_term)["urlName"])
    missing = 0

    for course in data:
        included = get_course_data(courses, course, term)
        if not included:
            missing += 1

    with open(fname, "w", encoding="utf-8") as fireroad_file:
        json.dump(courses, fireroad_file)
    print(f"Got {len (courses)} courses")
    print(f"Skipped {missing} courses that are not offered in the {term.value} term")


if __name__ == "__main__":
    run(False)
    run(True)
