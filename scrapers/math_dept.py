"""
This isn't run automatically, but it is a temporary workaround to the math classes being wrong.
Was used to generate the math overrides in package.py; currently unnecessary.

Functions:
* parse_when(when)
* test_parse_when()
* parse_many_timeslots(days, times)
* make_raw_sections(days, times, room):
* make_section_override(timeslots, room)
* get_rows()
* parse_subject(subject)
* parse_row(row)
* run()
"""

from pprint import pprint
from bs4 import BeautifulSoup
import requests
from fireroad import parse_timeslot, parse_section


def parse_when(when):
    """
    Parses when the class happens.

    Args:
    * when (str): A string describing when the class happens.

    Returns:
    * tuple[str]: A parsed version of this string.
    """
    # special casing is good enough (otherwise this could be a for loop)
    if when[1].isdigit():
        r = when[:1], when[1:]
    elif when[2].isdigit():
        r = when[:2], when[2:]
    elif when[3].isdigit():
        r = when[:3], when[3:]
    else:
        assert False
    days, times = r
    # fireroad.py wants dots instead of colons
    times = times.replace(":", ".")
    return days, times

def test_parse_when():
    """
    Test cases for parse_when

    Args: none

    Returns: none
    """
    assert parse_when("F10:30-12") == ("F", "10.30-12")
    assert parse_when("MW1") == ("MW", "1")
    assert parse_when("MWF11") == ("MWF", "11")


def parse_many_timeslots(days, times):
    """
    Parses many timeslots

    Args:
    * day (str): A list of days
    * times (str): The timeslot

    Returns:
    * list[list[int]]: All of the parsed timeslots, as a list
    """
    # parse timeslot wants only one letter
    return [parse_timeslot(day, times, False) for day in days]


def make_raw_sections(days, times, room):
    """
    Formats a raw section

    Args:
    * room (str): The room
    * days (str): The days
    * times (str): The times

    Returns:
    * str: The room, days, and times, presented as a single string
    """
    return f"{room}/{days}/0/{times}"


def make_section_override(timeslots, room):
    """
    Makes a section override

    Args:
    * timeslots (list[list[int]]): The timeslots of the section
    * room (str): The room

    Returns:
    * list[Union[list[list[int]], str]]: The section override
    """
    return [[timeslots, room]]
    # lol this is wrong
    # return [[section, room] for section in timeslots]

def get_rows():
    """
    Scrapes rows from https://math.mit.edu/academics/classes.html

    Args: none

    Returns:
    * bs4.element.ResultSet: The rows of the table listing classes
    """
    response = requests.get("https://math.mit.edu/academics/classes.html", timeout = 1)
    soup = BeautifulSoup(response.text, features="lxml")
    course_list = soup.find("ul", {"class": "course-list"})
    rows = course_list.findAll("li", recursive=False)
    return rows

def parse_subject(subject):
    """
    Parses the subject

    Args:
    * subject (str): The subject name to parse

    Returns:
    * subjects (list[str]): A clean list of subjects corresponding to that subject.
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

def parse_row(row):
    """
    Parses the provided row

    Args:
    * row (bs4.element.Tag): The row that needs to be parsed.

    Returns:
    * dict[str, dict[str, list[Union[list[list[int]], str]]]]: The parsed row 
    """
    result = {}

    subject = row.find("div", {"class": "subject"}).text
    subjects = parse_subject(subject)

    where_when = row.find("div", {"class": "where-when"})
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

def run():
    """
    The main entry point

    Args: none

    Returns:
    * dict[str, dict[str, list[Union[list[list[int]], str]]]]: All the schedules
    """
    rows = get_rows()

    overrides = {}

    for row in rows:
        parsed_row = parse_row(row)
        overrides.update(parsed_row)

    return overrides

if __name__ == "__main__":
    test_parse_when()
    pprint(run())
