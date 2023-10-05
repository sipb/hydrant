"""
We get most of our data from the Fireroad API.

run() scrapes this data and writes it to fireroad.json, in the raw class format
specified in src/lib/rawClass.ts, but missing some keys (which we pull from
catalog.py instead).

The Fireroad API is updated every few minutes, so it should always have the
schedule for the latest term.
"""

import json
import requests
import utils

URL = "https://fireroad-dev.mit.edu/courses/all?full=true"


def parse_timeslot(day, slot):
    """parse_timeslot("M", "10-11.30") -> [4, 3]"""
    pm, slot = slot.endswith(" PM"), slot.rstrip(" PM")

    if "-" in slot:
        start, end = slot.split("-")
        start_slot = utils.find_timeslot(day, start, pm)
        end_slot = utils.find_timeslot(day, end, pm)
    else:
        start_slot = utils.find_timeslot(day, slot, pm)
        # Slot is one hour long, so length is 2.
        end_slot = start_slot + 2

    return [start_slot, end_slot - start_slot]


def parse_section(section):
    """Parses a section string like "32-123/TR/0/11/F/0/2"."""
    place, *infos = section.split("/")
    slots = []

    for weekdays, _, slot in utils.grouper(infos, 3):
        for day in weekdays:
            if day == "S":
                continue  # TODO: handle saturday
            slots.append(parse_timeslot(day, slot))

    return [slots, place]


def parse_schedule(course):
    """
    Parses the schedule string, which looks like:
    "Lecture,32-123/TR/0/11/F/0/2;Recitation,2-147/MW/0/10,2-142/MW/0/11"
    """
    schedule = course["schedule"]
    section_tba = False
    result = {}

    # Kinds of sections that exist.
    result["s"] = []
    section_kinds = (
        "Lecture",
        "Recitation",
        "Lab",
        "Design"
    )

    for chunk in schedule.split(";"):
        name, *sections = chunk.split(",")

        if name not in section_kinds:
            print(f"Unknown section kind: {name}")
            continue

        # The key is lowercase
        kind = name.lower()
        result["s"].append(kind)

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
    result["tb"] = section_tba
    return result


def parse_attributes(course):
    hass_code = course.get("hass_attribute", "X")[-1]
    comms_code = course.get("communication_requirement", "")
    gir_attr = course.get("gir_attribute", "")

    return {
        "hh": hass_code == "H",
        "ha": hass_code == "A",
        "hs": hass_code == "S",
        "he": hass_code == "E",
        "ci": comms_code == "CI-H",
        "cw": comms_code == "CI-HW",
        "re": gir_attr == "REST",
        "la": gir_attr == "LAB",
        "pl": gir_attr == "LAB2",
    }


def parse_terms(course):
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
    return {"t": terms}


def parse_prereqs(course):
    prereqs = course.get("prerequisites", "")
    for gir, gir_rw in utils.GIR_REWRITE.items():
        prereqs = prereqs.replace(gir, gir_rw)
    if not prereqs:
        prereqs = "None"
    return {"pr": prereqs}


def get_course_data(courses, course):
    """
    Parses a course from the Fireroad API, and puts it in courses. Skips the
    courses Fireroad doesn't have schedule info for. Returns False if skipped,
    True otherwise.
    """
    course_code = course["subject_id"]
    course_num, course_class = course_code.split(".")
    raw_class = {
        "no": course_code,
        "co": course_num,
        "cl": course_class,
    }

    if "schedule" not in course:
        # TODO: Do something else with this?
        return False

    # tb, s, l, r, b, lr, rr, br
    try:
        raw_class.update(parse_schedule(course))
    except Exception as e:
        # if we can't parse the schedule, warn
        print(f"Can't parse schedule {course_code}: {e}")
        return False

    # hh, ha, hs, he, ci, cw, re, la, pl
    raw_class.update(parse_attributes(course))
    raw_class.update(
        {
            "u1": course["lecture_units"],
            "u2": course["lab_units"],
            "u3": course["preparation_units"],
            "le": course["level"],
            "vu": course["is_variable_units"],
            "sa": ", ".join(course.get("joint_subjects", [])),
            "mw": ", ".join(course.get("meets_with_subjects", [])),
        }
    )
    # This should be the case with variable-units classes, but just to make sure.
    if raw_class["vu"]:
        raw_class["u1"] = raw_class["u2"] = raw_class["u3"] = 0

    # t, pr
    raw_class.update(parse_terms(course))
    raw_class.update(parse_prereqs(course))

    raw_class.update(
        {
            "d": course.get("description", ""),
            "n": course.get("title", ""),
            # TODO: improve instructor parsing
            "i": ",".join(course.get("instructors", [])),
            "v": course.get("virtual_status", "") == "Virtual",
        }
    )

    # nx, rp, u, f, hf, lm are from catalog.json, not here

    if "old_id" in course:
        raw_class["on"] = course["old_id"]

    raw_class.update(
        {
            "ra": course.get("rating", 0),
            "h": course.get("in_class_hours", 0) + course.get("out_of_class_hours", 0),
            "si": course.get("enrollment_number", 0),
        }
    )

    courses[course_code] = raw_class
    return True


def run():
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
