"""
Temporary workaround to the math classes being wrong (2023).
Was used to generate the math overrides in package.py; currently unnecessary.

Functions:
    parse_when(when)
    test_parse_when()
    parse_many_timeslots(days, times)
    make_raw_sections(days, times, room):
    make_section_override(timeslots, room)
    get_rows()
    parse_subject(subject)
    parse_row(row)
    run()
"""

from pprint import pprint
from typing import Any, Dict, List, Tuple, Union
from bs4 import BeautifulSoup, ResultSet, Tag
import requests
from .fireroad import parse_timeslot, parse_section


def parse_when(when: str) -> Tuple[str, str]:
    """
    Parses when the class happens.

    Args:
        when (str): A string describing when the class happens.

    Returns:
        tuple[str, str]: A parsed version of this string.
    """
    # special casing is good enough (otherwise this could be a for loop)
    if when[1].isdigit():
        day_times = when[:1], when[1:]
    elif when[2].isdigit():
        day_times = when[:2], when[2:]
    elif when[3].isdigit():
        day_times = when[:3], when[3:]
    else:
        assert False
    days, times = day_times
    # fireroad.py wants dots instead of colons
    times = times.replace(":", ".")
    return days, times


def test_parse_when() -> None:
    """
    Test cases for parse_when
    """
    assert parse_when("F10:30-12") == ("F", "10.30-12")
    assert parse_when("MW1") == ("MW", "1")
    assert parse_when("MWF11") == ("MWF", "11")


def parse_many_timeslots(days: str, times: str) -> List[List[int]]:
    """
    Parses many timeslots

    Args:
        day (str): A list of days
        times (str): The timeslot

    Returns:
        list[list[int]]: All of the parsed timeslots, as a list
    """
    # parse timeslot wants only one letter
    return [parse_timeslot(day, times, False) for day in days]


def make_raw_sections(days: str, times: str, room: str) -> str:
    """
    Formats a raw section

    Args:
        room (str): The room
        days (str): The days
        times (str): The times

    Returns:
        str: The room, days, and times, presented as a single string
    """
    return f"{room}/{days}/0/{times}"


def make_section_override(
    timeslots: List[List[int]], room: str
) -> List[List[Union[List[List[int]], str]]]:
    """
    Makes a section override

    Args:
        timeslots (list[list[int]]): The timeslots of the section
        room (str): The room

    Returns:
        list[list[Union[list[list[int]], str]]]: The section override
    """
    return [[timeslots, room]]
    # lol this is wrong
    # return [[section, room] for section in timeslots]


def get_rows() -> ResultSet[Any]:
    """
    Scrapes rows from https://math.mit.edu/academics/classes.html

    Returns:
        bs4.element.ResultSet: The rows of the table listing classes
    """
    response = requests.get("https://math.mit.edu/academics/classes.html", timeout=1)
    soup = BeautifulSoup(response.text, features="lxml")
    course_list: Tag = soup.find("ul", {"class": "course-list"})  # type: ignore
    rows = course_list.findAll("li", recursive=False)
    return rows


def parse_subject(subject: str) -> List[str]:
    """
    Parses the subject

    Args:
        subject (str): The subject name to parse

    Returns:
        list[str]: A clean list of subjects corresponding to that subject.
    """
    # remove "J" from joint subjects
    subject = subject.replace("J", "")

    # special case specific to math, if a slash it means that there
    # is an additional graduate subject ending in 1
    if " / " in subject:
        subject = subject.split(" / ")[0]
        subjects = [subject, f"{subject}1"]
    else:
        subjects = [subject]
    assert ["/" not in subject for subject in subjects]

    return subjects


def parse_row(
    row: Tag,
) -> Dict[str, Dict[str, Union[str, List[list[Union[List[List[int]], str]]]]]]:
    """
    Parses the provided row

    Args:
        row (bs4.element.Tag): The row that needs to be parsed.

    Returns:
        dict[str, dict[str, Union[str, list[list[Union[list[list[int]], str]]]]]]:
            The parsed row
    """
    result: Dict[
        str, Dict[str, Union[str, List[List[Union[List[List[int]], str]]]]]
    ] = {}

    subject: str = row.find("div", {"class": "subject"}).text  # type: ignore
    subjects = parse_subject(subject)

    where_when: Tag = row.find("div", {"class": "where-when"})  # type: ignore
    when, where = where_when.findAll("div", recursive=False)
    where = where.text
    when = when.text
    if ";" in when:
        # Don't want to handle special case - calculus, already right
        return {}
    days, times = parse_when(when)
    timeslots = parse_many_timeslots(days, times)
    for subject in subjects:
        lecture_raw_sections = make_raw_sections(days, times, where)
        lecture_sections = make_section_override(timeslots, where)
        result[subject] = {
            "lectureRawSections": lecture_raw_sections,
            "lectureSections": lecture_sections,
        }
        # Make sure the raw thing that I do not comprehend is actually correct
        assert parse_section(lecture_raw_sections) == lecture_sections[0]
    return result


def run() -> Dict[str, Dict[str, Union[str, List[List[Union[List[List[int]], str]]]]]]:
    """
    The main entry point

    Returns:
        dict[str, dict[str, Union[str, list[list[Union[list[list[int]], str]]]]]]:
            All the schedules
    """
    rows = get_rows()
    overrides: Dict[
        str, Dict[str, Union[str, List[List[Union[List[List[int]], str]]]]]
    ] = {}

    for row in rows:
        parsed_row = parse_row(row)
        overrides.update(parsed_row)

    return overrides


if __name__ == "__main__":
    test_parse_when()
    pprint(run())
