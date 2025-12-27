"""
Temporary workaround to the math classes being wrong (2023).
Was used to generate the math overrides in package.py; currently unnecessary.

Functions:
    parse_when(when)
    parse_many_timeslots(days, times)
    make_raw_sections(days, times, room):
    make_section_override(timeslots, room)
    get_rows()
    parse_subject(subject)
    parse_row(row)
    run()
"""

from __future__ import annotations

from collections.abc import Iterable, Sequence
from pprint import pprint
from urllib.request import urlopen

from bs4 import BeautifulSoup, Tag

from .fireroad import parse_section, parse_timeslot


def parse_when(when: str) -> tuple[str, str]:
    """
    Parses when the class happens.

    Args:
        when (str): A string describing when the class happens.

    Returns:
        tuple[str, str]: A parsed version of this string.

    >>> parse_when("F10:30-12")
    ('F', '10.30-12')

    >>> parse_when("MW1")
    ('MW', '1')

    >>> parse_when("MWF11")
    ('MWF', '11')
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


def parse_many_timeslots(days: str, times: str) -> Iterable[tuple[int, int]]:
    """
    Parses many timeslots

    Args:
        day (str): A list of days
        times (str): The timeslot

    Returns:
        Iterable[tuple[int, int]]: All of the parsed timeslots, as a list
    """
    # parse timeslot wants only one letter
    return (parse_timeslot(day, times, False) for day in days)


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
    timeslots: Sequence[Sequence[int]], room: str
) -> tuple[tuple[Sequence[Sequence[int]], str]]:
    """
    Makes a section override

    Args:
        timeslots (Sequence[Sequence[int]]): The timeslots of the section
        room (str): The room

    Returns:
        tuple[tuple[Sequence[Sequence[int]], str]]: The section override
    """
    return ((timeslots, room),)
    # lol this is wrong
    # return [[section, room] for section in timeslots]


def get_rows() -> list[Tag]:
    """
    Scrapes rows from https://math.mit.edu/academics/classes.html

    Returns:
        bs4.element.ResultSet: The rows of the table listing classes
    """
    with urlopen("https://math.mit.edu/academics/classes.html", timeout=1) as response:
        soup = BeautifulSoup(response.read().decode("utf-8"), features="lxml")
    course_list = soup.find("ul", {"class": "course-list"})
    assert course_list is not None

    rows = course_list.find_all("li", recursive=False)
    return rows


def parse_subject(subject: str) -> list[str]:
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
) -> dict[str, dict[str, str | tuple[tuple[Sequence[Sequence[int]], str]]]]:
    """
    Parses the provided row

    Args:
        row (bs4.element.Tag): The row that needs to be parsed.

    Returns:
        dict[str, dict[str, str | tuple[tuple[Sequence[Sequence[int]], str]]]]:
            The parsed row
    """
    result: dict[str, dict[str, str | tuple[tuple[Sequence[Sequence[int]], str]]]] = {}

    subject_row = row.find("div", {"class": "subject-row"})
    assert subject_row is not None

    subject = subject_row.string or ""
    subjects = parse_subject(subject)

    where_when = row.find("div", {"class": "where-when"})
    assert where_when is not None

    when, where = where_when.find_all("div", recursive=False)
    where = where.string or ""
    when = when.string or ""
    if ";" in when:
        # Don't want to handle special case - calculus, already right
        return {}
    days, times = parse_when(when)
    timeslots = list(parse_many_timeslots(days, times))
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


def run() -> dict[str, dict[str, str | tuple[tuple[Sequence[Sequence[int]], str]]]]:
    """
    The main entry point

    Returns:
        dict[str, dict[str, str | tuple[tuple[Sequence[Sequence[int]], str]]]]:
            All the schedules
    """
    rows = get_rows()
    overrides: dict[
        str, dict[str, str | tuple[tuple[Sequence[Sequence[int]], str]]]
    ] = {}

    for row in rows:
        parsed_row = parse_row(row)
        overrides.update(parsed_row)

    return overrides


if __name__ == "__main__":
    pprint(run())
