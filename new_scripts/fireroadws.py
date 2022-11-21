import json
import requests
import itertools
import constants
from sys import stderr

# copied from csb.py

url = 'https://fireroad.mit.edu/courses/all?full=true'

text = requests.get(url).text
raw_classes = json.loads(text)
print(f"got {len(raw_classes)} classes")
classes = {}

gir_rewrite = {
    'GIR:CAL1': 'Calculus I (GIR)',
    'GIR:CAL2': 'Calculus II (GIR)',
    'GIR:PHY1': 'Physics I (GIR)',
    'GIR:PHY2': 'Physics II (GIR)',
    'GIR:CHEM': 'Chemistry (GIR)',
    'GIR:BIOL': 'Biology (GIR)',
}

def parse_prereqs(prereqs):
    if len(prereqs) == 0:
        return 'None'
    for gir, gir_rw in gir_rewrite.items():
        prereqs = prereqs.replace(gir, gir_rw)
    return prereqs

def chunk3(it):
    it = iter(it)
    while True:
        first = next(it, None)
        if first is None: break
        yield first, next(it), next(it)

def find_timeslot(slot, pm):
    return (constants.eve_times if pm else constants.times)[slot]

def parse_timeslot(info, weekdays):
    weekdays = weekdays.replace("S", "") # TODO: report saturdays
    pm, info = info.endswith(" PM"), info.rstrip(" PM")
    if "-" in info:
        start, end = info.split("-")
        time, length = find_timeslot(start, pm), find_timeslot(end, pm)
    else:
        time, length = find_timeslot(info, pm), 2
    return [[time + constants.days[day], length] for day in weekdays]

def parse_section(section):
    place, *infos = section.split("/")
    slots = []
    for weekdays, _STUB, timeslot in chunk3(infos):
        slots += parse_timeslot(timeslot, weekdays)
    return [slots, place]

def parse_schedule(schedule):
    buckets = {}
    raw_buckets = {}

    chunks = schedule.split(";")
    section_tba = False
    for chunk in chunks:
        name, *sections = chunk.split(",")
        buckets[name] = [parse_section(info) for info in sections if info != "TBA"]
        section_tba = section_tba or any(info == "TBA" for info in sections)
        raw_buckets[name] = sections

    return [
        (buckets.get(ty, []), raw_buckets.get(ty, []))
        for ty in ("Lecture", "Recitation", "Lab", "Design")
    ], section_tba

classes = {}
missing_schedules = []
for clz in raw_classes:
    course_code = clz["subject_id"]
    course_num, course_class = course_code.split(".")

    if "schedule" in clz:
        # TODO propagate design section info?
        ((lec, raw_lec), (rec, raw_rec), (lab, raw_lab), (des, raw_des)), section_tba = parse_schedule(clz["schedule"])
    else:
        # TODO fail more gracefully?
        missing_schedules.append(course_code)
        continue

    sections = [
        code for code, info
        in [("l", lec), ("r", rec), ("b", lab)]
        if info
    ]

    # hass code
    # TODO hacky, enum this to check data shape
    hass_code = clz["hass_attribute"][-1] if "hass_attribute" in clz else "X"

    comms_code = clz.get("communication_requirement", "")
    gir_attr = clz.get("gir_attribute", "")

    limited = "limited" in clz.get("description", "") # TODO hacky? cloned from coursews

    terms = [
        name for name, attr
        in [("FA", "offered_fall"), ("JA", "offered_IAP"),
            ("SP", "offered_spring"), ("SU", "offered_summer")]
        if clz[attr]
    ]

    struct = {
        "no": course_code,
        "co": course_num,
        "cl": course_class,
        "tb": section_tba,

        "s": sections,
        "l": lec,
        "r": rec,
        "b": lab,
        "lr": raw_lec,
        "rr": raw_rec,
        "br": raw_lab,

        "hh": hass_code == "H",
        "ha": hass_code == "A",
        "hs": hass_code == "S",
        "he": hass_code == "E",
        "ci": comms_code == "CI-H",
        "cw": comms_code == "CI-HW",
        "re": gir_attr == "REST",
        "la": gir_attr == "LAB",
        "pl": gir_attr == "LAB2",

        # lec/rec units
        "u1": clz["lecture_units"],
        # lab/field units
        "u2": clz["lab_units"],
        # all else
        "u3": clz["preparation_units"],

        "le": clz["level"],

        "sa": clz.get("joint_subjects", []),
        "mw": clz.get("meets_with_subjects", []),

        "t": terms,
        "pr": parse_prereqs(clz.get("prerequisites", "")),
        "d": clz.get("description", ""),
        "n": clz["title"],
        "i": "", # TODO stub: firehose doesn't have this info
        "lm": limited,
    }
    classes[course_code] = struct

with open('ws_froad', 'w') as f:
    json.dump(classes, f)

with open('all_classes', 'w') as f:
    json.dump(list(classes.keys()), f)

if missing_schedules:
    print(f"{len(missing_schedules)} classes were omitted due to missing schedules. Check `missing' for a list.")
    with open('missing', 'w') as f:
        json.dump(missing_schedules, f)
