"""
This isn't run automatically, but it is a temporary workaround to the math classes being wrong.

Used to generate the math overrides in package.py
"""

from bs4 import BeautifulSoup
from fireroad import parse_timeslot, parse_section
from pprint import pprint
import requests

response = requests.get("https://math.mit.edu/academics/classes.html")
soup = BeautifulSoup(response.text, features="lxml")
course_list = soup.find("ul", {"class": "course-list"})
rows = course_list.findAll("li", recursive=False)

def parse_when(when):
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

assert parse_when("F10:30-12") == ("F", "10.30-12")
assert parse_when("MW1") == ("MW", "1")
assert parse_when("MWF11") == ("MWF", "11")

def parse_many_timeslots(days, times):    
    # parse timeslot wants only one letter
    return [parse_timeslot(day, times) for day in days]        


def make_raw_sections(days, times, room):
    return f"{room}/{days}/0/{times}"

def make_section_override(timeslots, room):
    return [[timeslots, room]]
    # lol this is wrong
    #return [[section, room] for section in timeslots]

overrides = {}

for row in rows:
    subject = row.find("div", {"class": "subject"}).text
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

    where_when = row.find("div", {"class": "where-when"})
    when, where = where_when.findAll("div", recursive=False)
    where = where.text
    when = when.text
    if ";" in when:
        # Don't want to handle special case - calculus, already right
        continue
    days, times = parse_when(when)
    timeslots = parse_many_timeslots(days, times)
    for subject in subjects:
        lecture_raw_sections = make_raw_sections(days, times, where)
        lecture_sections = make_section_override(timeslots, where)
        overrides[subject] = {
            "lectureRawSections": lecture_raw_sections,
            "lectureSections": lecture_sections
        }
        # Make sure the raw thing that I do not comprehend is actually correct
        assert parse_section(lecture_raw_sections) == lecture_sections[0]

pprint(overrides)
