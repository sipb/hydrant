"""
get all classes for 21L along with their human-readable schedule

Functions:
    run()
"""

from __future__ import annotations

from collections.abc import Mapping, MutableMapping

from scrapers.fireroad import (
    CourseValues,
    get_course_data,
    get_raw_data,
    get_term_info,
    url_name_to_term,
)


def get_lit_course_key(course: str, same: str, name: str) -> str:
    """
    Gets the key for a 21L course,
    which is the course name with a [J] if it has a joint section.

    Meant to look like "21L.001 [J] Introduction to Poetry"
    or "21L.002 Introduction to Fiction", like in the Subject Listing.
    """
    return course + ("[J]" if len(same) > 0 else "") + " " + name


def make_lit_schedule(
    lit_courses: list[str], courses: MutableMapping[str, Mapping[str, CourseValues]]
) -> Mapping[str, list[str]]:
    """]
    Makes a mapping from course name to a
    human-readable schedule for all 21L courses.
    """

    lit_schedules: Mapping[str, list[str]] = {}
    for lit_course in lit_courses:
        course_data = courses[lit_course]

        schedule: list[str] = []
        if course_data["tba"]:
            schedule.append("TBA")
        else:
            section_kinds = course_data["sectionKinds"]
            assert isinstance(section_kinds, list)
            for section_kind in section_kinds:
                full_section_text = f"{section_kind.capitalize()}: "
                section_datas = course_data[section_kind + "RawSections"]
                assert isinstance(section_datas, list)
                for section_data in section_datas:
                    room, days, eve, time = section_data.split("/")

                    if full_section_text[-2:] != ": ":
                        full_section_text += " or "

                    if eve == "0":
                        full_section_text += f"{days}{time} ({room})"
                    else:
                        full_section_text += f"{days} EVE ({time}) ({room})"

                schedule.append(full_section_text)

        if schedule:
            lit_schedules[
                get_lit_course_key(
                    lit_course, str(course_data["same"]), str(course_data["name"])
                )
            ] = schedule

    return lit_schedules


def run():
    """Gets all classes for 21L along with their human-readable schedule."""
    data = get_raw_data()
    courses: MutableMapping[str, Mapping[str, CourseValues]] = {}
    term = url_name_to_term(get_term_info("sem")["urlName"])

    for course in data:
        get_course_data(courses, course, term)

    lit_courses: list[str] = []
    for course in courses:
        if course.startswith("21L"):
            lit_courses.append(course)

    lit_schedules = make_lit_schedule(lit_courses, courses)

    # format nicely and output to file
    file_output = ""
    for lit_course, schedules in lit_schedules.items():
        file_output += f"{lit_course}\n"
        for schedule_text in schedules:
            file_output += f"    {schedule_text}\n"
        file_output += "\n"

    with open("lit_schedule.txt", "w+", encoding="utf-8") as f:
        f.write(file_output)


if __name__ == "__main__":
    run()
