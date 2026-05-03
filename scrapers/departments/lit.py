# get all classes for 21L along with their human-readable schedule

from collections.abc import Mapping, MutableMapping

from scrapers.fireroad import (
    CourseValues,
    get_course_data,
    get_raw_data,
    get_term_info,
    url_name_to_term,
)


def run():
    data = get_raw_data()
    courses: MutableMapping[str, Mapping[str, CourseValues]] = {}
    term = url_name_to_term(get_term_info("sem")["urlName"])
    missing = 0

    for course in data:
        included = get_course_data(courses, course, term)
        if not included:
            missing += 1

    lit_courses: list[str] = []
    for course in courses:
        if course.startswith("21L"):
            lit_courses.append(course)

    lit_schedules: Mapping[str, list[str]] = {}
    for lit_course in lit_courses:
        course_data = courses[lit_course]
        course_name = course_data["name"]
        same_subjects = course_data["same"]
        assert isinstance(course_name, str)
        assert isinstance(same_subjects, str)

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
                    if eve == "0":
                        schedule_text = f"{days}{time} ({room})"
                    else:
                        schedule_text = f"{days} EVE ({time}) ({room})"

                    if full_section_text[-2:] != ": ":
                        full_section_text += " or "

                    full_section_text += schedule_text
                schedule.append(full_section_text)

        if schedule:
            lit_schedules[
                f"{lit_course}{'[J]' if len(same_subjects) > 0 else ''} {course_name}"
            ] = schedule

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
