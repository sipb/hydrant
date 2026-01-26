"""
Temporary helper to parse EECS Subject Updates (Spring 2026).
Intended to help generate override data for Course 6 special subjects.

Imitates the structure of math_dept.py: scrape a departmental page, parse rows,
and return a dict of overrides.

Functions:
* get_rows()
* parse_schedule(schedule_line)
* is_header(tag, text)
* parse_header(text)
* parse_many_timeslots(days, slot, is_pm_int)
* make_raw_sections(days, slot, room, is_pm_int)
* make_section_override(timeslots, room)
* parse_row(row)
* run()
"""

from pprint import pprint
import re
import sys

from bs4 import BeautifulSoup
import requests
import tomli_w
from .fireroad import parse_timeslot, parse_section
from .utils import TIMES, EVE_TIMES

# The EECS WordPress page renders its subject list by dynamically loading this HTML
# fragment (see network request `.../plugins/subj_2026SP.html` in a browser).
# `requests.get()` of the WordPress page often returns only navigation chrome, so
# this script scrapes the source-of-truth fragment directly.
URL = "https://eecsis.mit.edu/plugins/subj_2026SP.html"
FRONTEND_URL = (
    "https://www.eecs.mit.edu/academics/subject-updates/subject-updates-spring-2026/"
)
# Match a 6.S### subject header, optionally with an "(also ...)" clause.
# Group 1: the 6.S### number
# Group 2 (optional): comma-separated cross-list numbers (for the "same" field)
# Group 3: the title text (excluding the "(also ...)" clause when present)
COURSE_RE = re.compile(
    r"\b(6\.S\d{3})\b"
    r"(?:\s*\(\s*also(?: under)?\s+"
    r"([A-Za-z]{0,5}\d{0,3}[A-Za-z]{0,3}\.[A-Za-z]{0,3}\d{1,4}[A-Za-z]?"
    r"(?:\s*,\s*[A-Za-z]{0,5}\d{0,3}[A-Za-z]{0,3}\.[A-Za-z]{0,3}\d{1,4}[A-Za-z]?)*"
    r")\s*\)\s*)?"
    r"(.*)$",
    re.IGNORECASE,
)
DAY_WORD = {
    "monday": "M",
    "tuesday": "T",
    "wednesday": "W",
    "thursday": "R",
    "friday": "F",
}


def normalize_days(days_raw):
    """
    Normalize day strings into Fireroad-compatible day letters (MTWRF).

    Examples:
    - "TR" -> "TR"
    - "Thursdays" -> "R"
    """
    assert days_raw, "empty day string"

    if days_raw.isupper():
        assert set(days_raw) <= set("MTWRF"), days_raw
        return days_raw

    key = days_raw.lower().rstrip("s")
    assert key in DAY_WORD, days_raw
    return DAY_WORD[key]


def parse_many_timeslots(days, slot, is_pm_int):
    """
    Parses many timeslots.

    Args:
    * days (str): A list of days (e.g. "TR")
    * slot (str): The timeslot (e.g. "1-2.30" or "7-10 PM")
    * is_pm_int (int): 0 for AM-ish slots, 1 for PM-ish slots

    Returns:
    * list[list[int]]: All parsed timeslots, as a list
    """
    assert is_pm_int in (0, 1), is_pm_int
    return [parse_timeslot(day, slot, bool(is_pm_int)) for day in days]


def make_raw_sections(days, slot, room, is_pm_int):
    """
    Formats a raw section (same shape as math_dept.py).
    """
    assert is_pm_int in (0, 1), is_pm_int
    return f"{room}/{days}/{is_pm_int}/{slot}"


def make_section_override(timeslots, room):
    """
    Makes a section override (same shape as math_dept.py).
    """
    return ((timeslots, room),)


def parse_schedule(schedule_line):
    """
    Parse a schedule value like:
      "Lectures: TR2:30-4, room 34-101"
      "Lecture: MW1-2:30, room 32-155; Recitations: Tuesdays 2-3p, room 36-112"
      "Lectures: Thursdays 7-10pm, room 2-131"

    Args:
    * schedule_line (str): The raw schedule line

    Returns:
    * dict[str, list[tuple[str, str, str, int]]]: Mapping kind -> list of
      (days, slot, room, is_pm_int)
    """
    assert schedule_line and schedule_line != "TBD", schedule_line

    chunks = list(filter(None, schedule_line.split(";")))
    out: dict[str, list[tuple[str, str, str, int]]] = {}

    for i, raw_chunk in enumerate(chunks):
        kind = "lecture"
        chunk = raw_chunk.strip()

        m_kind = re.match(
            (
                r"^(?P<kind>"
                r"Lectures?|Lecture|"
                r"Recitations?|Recitation|"
                r"Labs?|Lab|"
                r"Designs?|Design"
                r"):\s*"
            ),
            chunk,
            re.IGNORECASE,
        )
        if m_kind is not None:
            kind = m_kind.group("kind").lower().rstrip("s")
            chunk = chunk[m_kind.end() :]
        else:
            assert i == 0, "Only the first chunk may omit its kind (assumed lecture)"

        m = re.match(
            r"^(?P<days>(?:[MTWRF]+)|(?:Monday|Tuesday|Wednesday|Thursday|Friday|"
            r"Mondays|Tuesdays|Wednesdays|Thursdays|Fridays))\s*"
            r"(?P<start>[0-9]+(?:[.:][0-9]{2})?)"
            r"(?:\s*(?P<start_ampm>am|pm|a|p))?\s*-\s*"
            r"(?P<end>[0-9]+(?:[.:][0-9]{2})?)"
            r"(?:\s*(?P<end_ampm>am|pm|a|p))?\s*,\s*room\s+"
            r"(?P<room>[A-Za-z0-9-]+)(?:\s+.*)?$",
            chunk,
            re.IGNORECASE,
        )
        assert m is not None, chunk

        days = normalize_days(m.group("days"))
        room = m.group("room")
        assert room, chunk

        start = m.group("start").replace(":", ".")
        end = m.group("end").replace(":", ".")

        is_day = start in TIMES and end in TIMES
        is_eve = start in EVE_TIMES and end in EVE_TIMES
        assert is_day or is_eve, (start, end)
        is_pm_int = 0 if is_day else 1

        slot = f"{start}-{end}" + (" PM" if is_pm_int == 1 else "")

        out.setdefault(kind, []).append((days, slot, room, is_pm_int))

    return out


def get_rows():
    """
    Scrapes the EECS subject updates page and returns "rows", each representing
    one 6.S### entry as a list of text blocks (header + body).

    Args: none

    Returns:
    * list[list[str]]: Rows for each detected 6.S### subject
    """
    response = requests.get(
        URL,
        timeout=10,
        headers={"User-Agent": "hydrant-scrapers (https://github.com/sipb/hydrant)"},
    )
    response.raise_for_status()
    soup = BeautifulSoup(response.text, features="lxml")
    page_text = soup.get_text(" ", strip=True)
    assert COURSE_RE.search(page_text) is not None, f"No 6.S### entries found on {URL}"

    # Each subject block begins with an h6 heading containing the subject number.
    rows = soup.find_all("h6")
    assert rows, "No <h6> course headings found"
    return rows


def is_header(tag_name, text):
    """
    Heuristic: a header is an h2/h3/h4 (or short paragraph) that contains a 6.S###.
    """
    if COURSE_RE.search(text) is None:
        return False
    if tag_name in ("h2", "h3", "h4", "h5", "h6"):
        return True
    return text.startswith("6.S") and len(text) <= 140


def parse_header(text):
    """
    Parse a header block containing a course number.

    Returns:
    * tuple[str, str, str | None]: (course_number, title_fragment, same_csv)
    """
    match = COURSE_RE.search(text)
    assert match
    course = match.group(1)
    same_as = match.group(2)
    title = match.group(3).lstrip(" :-–—\t").rstrip("§ ")
    return course, title, same_as


def parse_units(units_str):
    """
    Parse units string like "3-0-9" or "12" into (lecture, lab, prep, isVariable).

    Args:
        units_str (str): Units string from the webpage

    Returns:
        tuple | None:
            (lectureUnits, labUnits, preparationUnits, isVariableUnits), or None if
            can't parse.
    """
    # Parse formats like "3-0-9"
    if "-" in units_str:
        parts = units_str.split("-")
        if len(parts) == 3:
            return (int(parts[0]), int(parts[1]), int(parts[2]), False)
        raise ValueError(f"Invalid units string: {units_str}")

    # Single number like "12" - variable units
    if units_str.isdigit():
        return (0, 0, 0, True)

    # Can't parse
    raise ValueError(f"Invalid units string: {units_str}")


def parse_level(level_str):
    """
    Parse level string to "U" or "G".

    Args:
        level_str (str): Level string from the webpage

    Returns:
        str: "U" for undergraduate, "G" for graduate
    """
    # Note: might be both "undergraduate" and "graduate"
    level_str = level_str.lower()
    if "graduate" in level_str and "undergrad" not in level_str:
        return "G"
    return "U"


def parse_row(row):
    """
    Parses a single row (one subject entry).

    Args:
    * row (list[str]): header + body blocks

    Returns:
    * dict[str, dict[str, str]]: A single-entry overrides dict
    """
    header = row.get_text(" ", strip=True)
    course, title, same_as = parse_header(header)
    data = {"url": f'{FRONTEND_URL}#{course.replace(".", "_", 1)}'}

    if title:
        data["name"] = title
    if same_as:
        data["same"] = same_as

    # The fragment lays out each subject as:
    #   <h6> ... </h6>
    #   <hr/>
    #   <table> key/value metadata </table>
    #   <hr/>
    #   <div> description ... </div>
    table = row.find_next_sibling("table")
    assert table is not None, f"Missing metadata table for {course}"

    meta = {}
    for tr in table.find_all("tr"):
        tds = tr.find_all("td")
        if len(tds) != 2:
            continue
        key = tds[0].get_text(" ", strip=True).rstrip(":")
        val = tds[1].get_text(" ", strip=True)
        if key and val:
            meta[key] = val

    # Parse Level (only if present)
    if "Level" in meta:
        data["level"] = parse_level(meta["Level"])

    # Parse Units (only if present and parseable)
    if "Units" in meta:
        units_result = parse_units(meta["Units"])
        if units_result is not None:
            lecture, lab, prep, is_var = units_result
            data["lectureUnits"] = lecture
            data["labUnits"] = lab
            data["preparationUnits"] = prep
            data["isVariableUnits"] = is_var

    if "Instructors" in meta:
        data["inCharge"] = meta["Instructors"]

    if "Prereqs" in meta:
        data["prereqs"] = meta["Prereqs"]

    if "Schedule" in meta and meta["Schedule"] != "TBD":
        schedule = parse_schedule(meta["Schedule"])
        for kind, meetings in schedule.items():
            raw_key = f"{kind}RawSections"
            sec_key = f"{kind}Sections"

            raw_sections: list[str] = []
            sections = []
            for days, slot, room, is_pm_int in meetings:
                raw = make_raw_sections(days, slot, room, is_pm_int)
                raw_sections.append(raw)
                sections.append(parse_section(raw))

            data[raw_key] = raw_sections
            data[sec_key] = sections

    desc_div = table.find_next_sibling("div")
    assert desc_div is not None, f"Missing description block for {course}"
    data["description"] = desc_div.get_text(" ", strip=True)

    return {course: data}


def run():
    """
    The main entry point.

    Args: none

    Returns:
    * dict[str, dict[str, str]]: Overrides keyed by subject number.
    """
    rows = get_rows()
    overrides = {}
    for row in rows:
        overrides.update(parse_row(row))
    return overrides


if __name__ == "__main__":
    result = run()
    if "--toml" in sys.argv:
        result = tomli_w.dumps(result)
    pprint(result)
