# REMOVE THIS FILE BEFORE MERGING

import glob
import json

schedules = glob.glob("./public/*.json")

for schedule in schedules:
    with open(schedule, "r", encoding="utf-8") as f:
        data = json.load(f)

    for course_num, course in data["classes"].items():
        hass_code = []
        comms_code = ""
        gir_attr = ""

        hassH = course.pop("hassH", False)
        hassA = course.pop("hassA", False)
        hassS = course.pop("hassS", False)
        hassE = course.pop("hassE", False)

        if hassH:
            hass_code.append("H")
        if hassA:
            hass_code.append("A")
        if hassS:
            hass_code.append("S")
        if hassE:
            hass_code.append("E")

        cih = course.pop("cih", False)
        ci = course.pop("ci", False)

        cihw = course.pop("cihw", False)
        cw = course.pop("cw", False)

        if cih or ci:
            comms_code = "CI-H"
        elif cihw or cw:
            comms_code = "CI-HW"
        else:
            comms_code = ""

        rest = course.pop("rest", False)
        lab = course.pop("lab", False)
        partLab = course.pop("partLab", False)

        if rest:
            gir_attr = "REST"
        elif lab:
            gir_attr = "LAB"
        elif partLab:
            gir_attr = "LAB2"
        else:
            gir_attr = ""

        course["hass"] = hass_code
        course["comms"] = comms_code
        course["gir"] = gir_attr

        data["classes"][course_num] = course


    with open(schedule, "w", encoding="utf-8") as f:
        json.dump(data, f)


