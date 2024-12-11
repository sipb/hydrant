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
* parse_attributes(course)
* parse_terms(course)
* parse_prereqs(course)
* get_course_data(courses, course)
* run()
"""

import json
import requests
import utils

URL = "https://fireroad.mit.edu/courses/all?full=true"


def parse_timeslot(day, slot, pm):
    """Parses a timeslot. Example: parse_timeslot("M", "10-11.30", False) -> [4, 3]

    Args:
    * day (str): The day as a string
    * slot (str): The slot as a string
    * pm (bool): Whether the timeslot is in the evening

    Returns:
    * list[int]: The parsed day and timeslot

    Raises AssertionError if pm and slot disagree on whether the slot is in the
    evening, or if the start slot is later than the end slot.

    Raises KeyError if no matching timeslot could be found.
    """
    assert pm == slot.endswith(" PM")
    slot = slot.rstrip(" PM")

    if "-" in slot:
        start, end = slot.split("-")
        try:
            start_slot = utils.find_timeslot(day, start, pm)
            end_slot = utils.find_timeslot(day, end, pm)
        except KeyError:
            # Maybe the start time is AM but the end time is PM
            start_slot = utils.find_timeslot(day, start, False)
            end_slot = utils.find_timeslot(day, end, True)
    else:
        start_slot = utils.find_timeslot(day, slot, pm)
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

    for weekdays, pm, slot in utils.grouper(infos, 3):
        for day in weekdays:
            if day == "S":
                continue  # TODO: handle saturday
            slots.append(parse_timeslot(day, slot, bool(int(pm))))

    return [slots, place]


def parse_schedule(course):
    """
    Parses the schedule string, which looks like:
    "Lecture,32-123/TR/0/11/F/0/2;Recitation,2-147/MW/0/10,2-142/MW/0/11"

    Args:
    * course (dict[str, Union[bool, float, int, list[str], str]]): The course object.

    Returns:
    * dict[str, union[list, bool]: The parsed schedule

    Raises AssertionError or KeyError if parse_section does.
    """
    schedule = course["schedule"]
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
        kindSectionsName = kind + "Sections"
        result[kindSectionsName] = []
        for info in sections:
            if info == "TBA":
                section_tba = True
            else:
                result[kindSectionsName].append(parse_section(info))

    # True if some schedule is not scheduled yet.
    result["tba"] = section_tba
    return result


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
    for gir, gir_rw in utils.GIR_REWRITE.items():
        prereqs = prereqs.replace(gir, gir_rw)
    if not prereqs:
        prereqs = "None"
    return {"prereqs": prereqs}


def get_course_data(courses, course):
    """
    Parses a course from the Fireroad API, and puts it in courses. Skips the
    courses Fireroad doesn't have schedule info for. Returns False if skipped,
    True otherwise. The `courses` variable is modified in place.

    Args:
    * courses (list[dict[str, Union[bool, float, int, list[str], str]]]): The list of courses.
    * course (dict[str, Union[bool, float, int, list[str], str]]): The course in particular.

    Returns:
    * bool: Whether Fireroad has schedule information for this course.
    """
    course_code = course["subject_id"]
    course_num, course_class = course_code.split(".")
    raw_class = {
        "number": course_code,
        "course": course_num,
        "subject": course_class,
    }

    if "schedule" not in course:
        # TODO: Do something else with this?
        return False

    # tba, sectionKinds, lectureSections, recitationSections, labSections,
    # designSections, lectureRawSections, recitationRawSections, labRawSections,
    # designRawSections
    try:
        raw_class.update(parse_schedule(course))
    except Exception as e:
        # if we can't parse the schedule, warn
        print(f"Can't parse schedule {course_code}: {e!r}")
        return False

    # hassH, hassA, hassS, hassE, cih, cihw, rest, lab, partLab
    raw_class.update(parse_attributes(course))
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
    # This should be the case with variable-units classes, but just to make
    # sure.
    if raw_class["isVariableUnits"]:
        assert raw_class["lectureUnits"] == 0
        assert raw_class["labUnits"] == 0
        assert raw_class["preparationUnits"] == 0

    # terms, prereqs
    raw_class.update(parse_terms(course))
    raw_class.update(parse_prereqs(course))

    raw_class.update(
        {
            "description": course.get("description", ""),
            "name": course.get("title", ""),
            # TODO: improve instructor parsing
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


def run():
    """
    The main entry point. All data is written to `fireroad.json`.

    There are no arguments and there is no return value.
    """
    text = requests.get(URL).text
    data = json.loads(text)
    courses = dict()
    missing = 0

    for course in data:
        has_schedule = get_course_data(courses, course)
        if not has_schedule:
            missing += 1

    with open("fireroad.json", "w") as f:
        json.dump(courses, f)
    print(f"Got {len (courses)} courses")
    print(f"Skipped {missing} courses due to missing schedules")


if __name__ == "__main__":
    run()
