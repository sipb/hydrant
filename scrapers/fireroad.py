"""
We get most of our data from the Fireroad API.

run() scrapes this data and writes it to fireroad.json, in the raw class format
specified in src/lib/rawClass.ts, but missing some keys (which we pull from
catalog.py instead).

The Fireroad API is updated every few minutes, so it should always have the
schedule for the latest term.

Functions:
* parse_timeslot(day, slot, pm)
* parse_section(section)
* parse_schedule(course)
* parse_quarter_info(course)
* parse_attributes(course)
* parse_terms(course)
* parse_prereqs(course)
* get_course_data(courses, course, term)
* get_raw_data()
* run(is_semester_term)
"""

import json
import os.path

import requests
from .utils import (
    Term,
    find_timeslot,
    grouper,
    MONTHS,
    GIR_REWRITE,
    url_name_to_term,
    get_term_info,
)

URL = "https://fireroad.mit.edu/courses/all?full=true"


def parse_timeslot(day, slot, time_is_pm):
    """Parses a timeslot. Example: parse_timeslot("M", "10-11.30", False) -> [4, 3]

    Args:
    * day (str): The day as a string
    * slot (str): The slot as a string
    * time_is_pm (bool): Whether the timeslot is in the evening

    Returns:
    * list[int]: The parsed day and timeslot

    Raises AssertionError if time_is_pm and slot disagree on whether the slot is in
    the evening, or if the start slot is later than the end slot.

    Raises KeyError if no matching timeslot could be found.
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

    return [start_slot, end_slot - start_slot]


def parse_section(section):
    """Parses a section string.
    Example: "32-123/TR/0/11/F/0/2" -> [[[36, 2], [96, 2], [132, 2]], '32-123']

    Args:
    * section (str): The section given as a string

    Returns:
    * list[Union[list[str], str]]: The parsed section.

    Raises AssertionError or KeyError if parse_timeslot does.
    """
    place, *infos = section.split("/")
    slots = []

    for weekdays, is_pm_int, slot in grouper(infos, 3):
        for day in weekdays:
            if day == "S":
                continue
            slots.append(parse_timeslot(day, slot, bool(int(is_pm_int))))

    return [slots, place]


def parse_schedule(schedule):
    """
    Parses the schedule string, which looks like:
    "Lecture,32-123/TR/0/11/F/0/2;Recitation,2-147/MW/0/10,2-142/MW/0/11"

    Args:
    * schedule (str): The schedule string.

    Returns:
    * dict[str, union[list, bool]: The parsed schedule

    Raises AssertionError or KeyError if parse_section does.
    """
    section_tba = False
    result = {}

    # Kinds of sections that exist.
    result["sectionKinds"] = []
    section_kinds = ("Lecture", "Recitation", "Lab", "Design")

    for chunk in schedule.split(";"):
        name, *sections = chunk.split(",")

        if name not in section_kinds:
            print(f"Unknown section kind: {name}")
            continue

        # The key is lowercase
        kind = name.lower()
        result["sectionKinds"].append(kind)

        # Raw section times, e.g. T9.301-11 or TR1,F2.
        result[kind + "RawSections"] = sections

        # Section timeslots and rooms.
        kind_section_name = kind + "Sections"
        result[kind_section_name] = []
        for info in sections:
            if info == "TBA":
                section_tba = True
            else:
                result[kind_section_name].append(parse_section(info))

    # True if some schedule is not scheduled yet.
    result["tba"] = section_tba
    return result


def decode_quarter_date(date: str):
    """
    Decodes a quarter date into a month and day.

    Args:
    * date (str): The date in the format "4/4" or "apr 4".

    Returns:
    * tuple[int, int]: The month and day.
    """
    if "/" in date:
        month, day = date.split("/")
        return int(month), int(day)
    if " " in date:
        month, day = MONTHS[(date.split())[0]], (date.split())[1]
        return int(month), int(day)

    return None


def parse_quarter_info(course):
    """
    Parses quarter info from the course.
    If quarter information key is present, returns either start date, end date, or both.

    Can start with either 0, 1, or 2.
    e.g. "0,apr 14" meaning subject ends on Apr 14,
    or "1,4/4" meaning subject begins on 4/4,
    or "2,4/9 to 5/9" meaning subject meets from 4/9 to 5/9.

    NOTE: dates can appear as either "4/4" or "apr 4".

    Args:
    * course (dict[str, Union[bool, float, int, list[str], str]]): The course object.

    Returns:
    * dict[str, dict[str, str]]: The parsed quarter info.
    """

    quarter_info = course.get("quarter_information", "")
    if quarter_info:
        quarter_info = quarter_info.split(",")

        if quarter_info[0] == "0":
            end_date = decode_quarter_date(quarter_info[1])
            if end_date:
                return {"quarterInfo": {"end": end_date}}

        elif quarter_info[0] == "1":
            start_date = decode_quarter_date(quarter_info[1])
            if start_date:
                return {"quarterInfo": {"start": start_date}}

        elif quarter_info[0] == "2" and "to" in quarter_info[1]:
            dates = quarter_info[1].split(" to ")
            start_date = decode_quarter_date(dates[0])
            end_date = decode_quarter_date(dates[1])
            if start_date and end_date:
                return {"quarterInfo": {"start": start_date, "end": end_date}}

    return {}


def parse_attributes(course):
    """
    Parses attributes of the course.

    Args:
    * course (dict[str, Union[bool, float, int, list[str], str]]): The course object.

    Returns:
    * dict[str, bool]: The attributes of the course.
    """
    hass_code = course.get("hass_attribute", "X")[-1]
    comms_code = course.get("communication_requirement", "")
    gir_attr = course.get("gir_attribute", "")

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


def parse_terms(course):
    """
    Parses the terms of the course.

    Args:
    * course (dict[str, Union[bool, float, int, list[str], str]]): The course object.

    Returns:
    * dict[str, list[str]]: The parsed terms, stored in the key "terms".
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


def parse_prereqs(course):
    """
    Parses prerequisites from the course.

    Args:
    * course (dict[str, Union[bool, float, int, list[str], str]]): The course object.

    Returns:
    * dict[str, str]: The parsed prereqs, in the key "prereqs".
    """
    prereqs = course.get("prerequisites", "")
    for gir, gir_rw in GIR_REWRITE.items():
        prereqs = prereqs.replace(gir, gir_rw)
    if not prereqs:
        prereqs = "None"
    return {"prereqs": prereqs}


def get_course_data(courses, course, term):
    """
    Parses a course from the Fireroad API, and puts it in courses. Skips the
    courses that are not offered in the current term. Returns False if skipped,
    True otherwise. The `courses` variable is modified in place.

    Args:
    * courses (list[dict[str, Union[bool, float, int, list[str], str]]]):
        The list of courses.
    * course (dict[str, Union[bool, float, int, list[str], str]]):
        The course in particular.
    * term (Term): The current term (fall, IAP, or spring).

    Returns:
    * bool: Whether the course was entered into courses.
    """
    course_code = course["subject_id"]
    course_num, course_class = course_code.split(".")
    raw_class = {
        "number": course_code,
        "course": course_num,
        "subject": course_class,
    }

    # terms, prereqs
    raw_class.update(parse_terms(course))
    raw_class.update(parse_prereqs(course))

    if term.name not in raw_class["terms"]:
        return False

    has_schedule = "schedule" in course

    # tba, sectionKinds, lectureSections, recitationSections, labSections,
    # designSections, lectureRawSections, recitationRawSections, labRawSections,
    # designRawSections
    if has_schedule:
        try:
            if term == Term.FA and "scheduleFall" in course:
                raw_class.update(parse_schedule(course["scheduleFall"]))
            elif term == Term.JA and "scheduleIAP" in course:
                raw_class.update(parse_schedule(course["scheduleIAP"]))
            elif term == Term.SP and "scheduleSpring" in course:
                raw_class.update(parse_schedule(course["scheduleSpring"]))
            else:
                raw_class.update(parse_schedule(course["schedule"]))
        except ValueError as val_err:
            # if we can't parse the schedule, warn
            # NOTE: parse_schedule will raise a ValueError
            print(f"Can't parse schedule {course_code}: {val_err!r}")
            has_schedule = False
    if not has_schedule:
        raw_class.update(
            {
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
        )

    # hassH, hassA, hassS, hassE, cih, cihw, rest, lab, partLab
    raw_class.update(parse_attributes(course))
    try:
        raw_class.update(
            {
                "lectureUnits": course["lecture_units"],
                "labUnits": course["lab_units"],
                "preparationUnits": course["preparation_units"],
                "level": course["level"],
                "isVariableUnits": course["is_variable_units"],
                "same": ", ".join(course.get("joint_subjects", [])),
                "meets": ", ".join(course.get("meets_with_subjects", [])),
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

    raw_class.update(
        {
            "description": course.get("description", ""),
            "name": course.get("title", ""),
            "inCharge": ",".join(course.get("instructors", [])),
            "virtualStatus": course.get("virtual_status", "") == "Virtual",
        }
    )

    # nonext, repeat, url, final, half, limited are from catalog.json, not here

    if "old_id" in course:
        raw_class["oldNumber"] = course["old_id"]

    raw_class.update(
        {
            "rating": course.get("rating", 0),
            "hours": course.get("in_class_hours", 0)
            + course.get("out_of_class_hours", 0),
            "size": course.get("enrollment_number", 0),
        }
    )

    courses[course_code] = raw_class
    return True


def get_raw_data():
    """
    Obtains raw data directly from the Fireroad API.
    Helper function for run().

    Args:
    * is_semester_term (bool): whether to look at the semester or the pre-semester term.
    """
    raw_data_req = requests.get(
        URL, timeout=10
    )  # more generous here; empirically usually ~1-1.5 seconds
    text = raw_data_req.text
    data = json.loads(text)
    return data


def run(is_semester_term):
    """
    The main entry point. All data is written to `fireroad.json`.
    If is_semester_term = True, looks at semester term (fall/spring).
    If is_semester_term = False, looks at pre-semester term (summer/IAP)

    Args:
    * is_semester_term (bool): whether to look at the semester or the pre-semester term.

    Returns: none
    """
    data = get_raw_data()
    courses = {}
    term = url_name_to_term(get_term_info(is_semester_term)["urlName"])
    fname = "fireroad-sem.json" if is_semester_term else "fireroad-presem.json"
    fname = os.path.join(os.path.dirname(__file__), fname)
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
