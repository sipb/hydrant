"""
Adds information from PE&W subjects, as given by DAPER.
"""

from __future__ import annotations

import csv
from functools import lru_cache
import json
import os
import time as time_c
from datetime import date, time
from typing import Literal, TypedDict
from urllib.request import Request, urlopen

from bs4 import BeautifulSoup

from scrapers.fireroad import parse_section
from scrapers.utils import Term

PE_CATALOG = (
    "https://physicaleducationandwellness.mit.edu/options-for-points/course-catalog/"
)

# ask DAPER how they represent summer...
QUARTERS: dict[int, tuple[Term, Literal[1, 2] | None]] = {
    1: (Term.FA, 1),
    2: (Term.FA, 2),
    3: (Term.SP, 1),
    4: (Term.SP, 2),
    5: (Term.JA, None),
}

WELLNESS_PREFIXES = ["PE.05", "PE.4"]

PIRATE_CLASSES = [
    "Archery",
    "Fencing",
    "Pistol",
    "Air Pistol",
    "Rifle",  # TODO ask if air rifle is also eligible
    "Sailing",
]

# I don't really like how this looks tbh,
# but typing as a class doesn't allow for spaces in vars
PEWFile = TypedDict(
    "PEWFile",
    {
        "Term": str,
        "Section": str,
        "Title": str,
        "Capacity": str,
        "Day": str,
        "Time": str,
        "Location": str,
        "Start Date": str,
        "End Date": str,
        "Prerequisites": str,
        "Equipment": str,
        "GIR Points": str,
        "Swim GIR": str,
        "Fee Amount": str,
    },
)
"""
Data from CSV file representing PE&W subjects, as given by DAPER
"""


class PEWSchema(TypedDict):
    """
    Information expected by the frontend (see rawPEClass.ts)
    """

    number: str
    name: str
    sectionNumbers: list[str]
    sections: list[tuple[list[tuple[int, int]], str]]
    rawSections: list[str]
    classSize: int
    startDate: str
    endDate: str
    points: int
    wellness: bool
    pirate: bool
    swimGIR: bool
    prereqs: str
    equipment: str
    fee: str
    description: str
    quarter: int


def parse_bool(value: str) -> bool:
    """
    Parses bool from "Y" or "N" (or throws an error)

    Args:
        value (str): The string to parse

    Raises:
        ValueError: If the value is not "Y" or "N"

    Returns:
        bool: The parsed boolean value
    """
    if value.upper() == "Y":
        return True
    if value.upper() == "N":
        return False

    raise ValueError(f"Invalid boolean value: {value}")


def augment_location(location: str) -> str:
    """
    Adds the building number to a location. Returns its input if there are multiple
    locations detected, in which case an override would be more appropriate, or if no
    suitable building could be identified.

    Args:
        location (str): The raw location to parse

    Returns:
        str: The location, with a building number possibly prepended

    >>> augment_location("Du Pont T Club Lounge")
    'W35 - Du Pont T Club Lounge'

    >>> augment_location("Harvard")
    'Harvard'

    >>> augment_location("Du Pont T Club Lounge and 26-100")
    'Du Pont T Club Lounge and 26-100'
    """
    buildings = {
        "Du Pont": "W35",
        "Zesiger": "W35",
        "Rockwell": "W35",
        "Johnson": "W35",
    }

    if " and " in location:
        return location

    for loc, building in buildings.items():
        if location.startswith(loc):
            return f"{building} - {location}"

    return location


def read_pew_file(filepath: str) -> list[PEWFile]:
    """
    Parses PE&W data from file according to a specific format from a CSV

    Args:
        filepath (str): The path to the CSV file

    Returns:
        list[PEWFile]: A list of PEWFile dictionaries representing the parsed data
    """
    pew_data: list[PEWFile]
    cols = getattr(PEWFile, "__annotations__").keys()
    with open(filepath, mode="r", newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        pew_data = []
        for row in reader:
            assert all(
                col in row for col in cols
            ), f"Missing columns in PEW file: {filepath}"
            pew_data.append({col: row[col] for col in cols})  # type: ignore
    return pew_data


def get_year_quarter(term_str: str) -> tuple[int, int]:
    """
    Extracts the quarter from a term string.

    Args:
        term_str (str): The term string in the format "YYYYQ"

    Returns:
        tuple[int, int]: The year and quarter extracted from the term string

    Raises:
        ValueError: If the term string format is invalid

    >>> get_year_quarter("2026Q2")
    (2026, 2)

    >>> get_year_quarter("2026Q3")
    (2026, 3)
    """

    # Validate term string format
    if len(term_str) != 6 or term_str[4] != "Q" or int(term_str[5]) not in QUARTERS:
        raise ValueError(f"Invalid term string format: {term_str}")

    year = int(term_str[:4])
    quarter = int(term_str[5])
    return year, quarter


def term_to_semester_year(term_str: str) -> tuple[int, Term, Literal[1, 2] | None]:
    """
    Converts a term string to a Term enum and semester half
    along with the academic year.

    Args:
        term_str (str): The term string in the format "YYYYQ"
            where Q is the quarter number

    Returns:
        tuple[int, Term, Literal[1, 2] | None]: A tuple containing
            the year, Term enum, and semester half

    >>> term_to_semester_year("2026Q2")
    (2025, <Term.FA: 'fall'>, 2)

    >>> term_to_semester_year("2026Q5")
    (2026, <Term.JA: 'IAP'>, None)

    >>> term_to_semester_year("2026Q3")
    (2026, <Term.SP: 'spring'>, 1)
    """

    year, quarter = get_year_quarter(term_str)
    term, semester = QUARTERS[quarter]

    if term == Term.FA:
        year -= 1  # Fall term belongs to the previous academic year

    return (year, term, semester)


def split_section_code(section_code: str) -> tuple[str, str]:
    """
    Splits a section code into its subject and section number components.

    Args:
        section_code (str): The section code in the format "PE.0201-1"

    Returns:
        tuple[str, str]: A tuple containing the subject and section number components

    Raises:
        ValueError: If the section code format is invalid

    >>> split_section_code("PE.0201-1")
    ('PE.0201', '1')

    >>> split_section_code("PE.0613-4")
    ('PE.0613', '4')
    """
    if "-" not in section_code:
        raise ValueError(f"Invalid section code format: {section_code}")
    subject, number = section_code.rsplit("-", 1)
    return subject, number


def parse_date(date_str: str) -> date:
    """
    Parses a date string in the format "MM/DD/YYYY" to a datetime.date object.

    Args:
        date_str (str): The date string in the format "MM/DD/YYYY"

    Returns:
        datetime.date: The parsed date object

    Raises:
        ValueError: If the date string format is invalid

    >>> parse_date("9/1/2023")
    datetime.date(2023, 9, 1)

    >>> parse_date("12/31/2024")
    datetime.date(2024, 12, 31)
    """
    month, day, year = map(int, date_str.split("/"))
    return date(year, month, day)


def parse_times_to_raw_section(start_time: str, days: str, location: str) -> str:
    """
    Parses times from CVS to format from Fireroad, for compatibility.

    Args:
        start_time (str): Start time of the class
        days (str): Days the class meets
        location (str): Location of the class

    Returns:
        str: Formatted raw section string
    """
    start_c = time_c.strptime(start_time, "%I:%M %p")
    start = time(start_c.tm_hour, start_c.tm_min)
    end = time(
        start.hour + 1, start.minute
    )  # default to 1 hour, can be changed in overrides

    start_raw_time = (
        f"{12 - ((- start.hour) % 12)}" f"{'.30' if start.minute > 29 else ''}"
    )
    end_raw_time = (
        f"{12 - ((- end.hour) % 12)}"
        f"{'.30' if end.minute > 29 else ''}"
        f"{' PM' if end.hour >= 17 else ''}"
    )
    evening = "1" if end.hour >= 17 else "0"

    return f"{location}/{days}/{evening}/{start_raw_time}-{end_raw_time}"


def parse_data(row: PEWFile, quarter: int) -> PEWSchema:
    """
    Parses a single PEWFile row into PEWSchema format.

    Args:
        row (PEWFile): The PEWFile row to parse
        quarter (int): The quarter the data is for

    Returns:
        PEWSchema: The parsed PEWSchema object
    """
    number, section_num = split_section_code(row["Section"])
    raw_section = parse_times_to_raw_section(
        row["Time"],
        row["Day"],
        augment_location(row["Location"]),
    )
    section = parse_section(raw_section)

    return {
        "number": number,
        "name": row["Title"],
        "sectionNumbers": [section_num],
        "rawSections": [raw_section],
        "sections": [section],
        "classSize": int(row["Capacity"]),
        "startDate": parse_date(row["Start Date"]).isoformat(),
        "endDate": parse_date(row["End Date"]).isoformat(),
        "points": int(row["GIR Points"]),
        "wellness": any(number.startswith(prefix) for prefix in WELLNESS_PREFIXES),
        "pirate": any(row["Title"].startswith(prefix) for prefix in PIRATE_CLASSES),
        "swimGIR": parse_bool(row["Swim GIR"]),
        "prereqs": row["Prerequisites"] or "None",
        "equipment": row["Equipment"],
        "fee": row["Fee Amount"],
        "description": get_pe_catalog_descriptions().get(number, ""),
        "quarter": quarter,
    }


def pe_rows_to_schema(pe_rows: list[PEWFile]) -> dict[int, dict[str, PEWSchema]]:
    """
    Converts PEWFile dictionaries to a standardized schema dictionary.

    Args:
        pe_rows (list[PEWFile]): The list of PEWFile dictionaries to convert

    Returns:
        dict: A dictionary representing the standardized schema,
            keyed by quarter and subject number
    """

    results: dict[int, dict[str, PEWSchema]] = {}

    for pe_row in pe_rows:
        _, quarter = get_year_quarter(pe_row["Term"])

        term_results = results.get(quarter)
        if term_results is None:
            term_results = {}
            results[quarter] = term_results

        data = parse_data(pe_row, quarter)
        current_results = term_results.get(data["number"])

        if current_results:
            # ensure all data in current_results (except for section info) are the same
            assert current_results["name"] == data["name"]
            assert current_results["classSize"] == data["classSize"]
            assert current_results["points"] == data["points"]
            assert current_results["swimGIR"] == data["swimGIR"]
            assert current_results["prereqs"] == data["prereqs"] or (
                current_results["prereqs"] == "None" and not data["prereqs"]
            )
            assert current_results["equipment"] == data["equipment"]
            assert current_results["fee"] == data["fee"]

            current_results["sectionNumbers"].append(data["sectionNumbers"][0])
            current_results["rawSections"].append(data["rawSections"][0])
            current_results["sections"].append(data["sections"][0])

            term_results[data["number"]] = current_results
        else:
            term_results[data["number"]] = data

        results[quarter] = term_results

    return results


@lru_cache(maxsize=None)
def get_pe_catalog_descriptions() -> dict[str, str]:
    """
    Scrapes PE&W course descriptions from the DAPER PE&W catalog.

    Returns:
        dict[str, str]: A dictionary mapping course numbers to their descriptions.
    """

    request = Request(PE_CATALOG)
    request.add_header("User-Agent", "Mozilla/5.0 (compatible; HydrantBot/1.0)")
    with urlopen(request, timeout=15) as response:
        soup = BeautifulSoup(response.read().decode("utf-8"), features="lxml")

    accordions = soup.select("div.accordion")
    descriptions: dict[str, str] = {}

    for accordion in accordions:
        header = accordion.find(class_="header")
        assert header
        header_small = header.find("small")
        assert header_small
        header_text = header_small.get_text(strip=True)

        description = accordion.find(class_="accoridon-content")
        assert description
        description_p = description.find("p")
        assert description_p
        description_text = description_p.get_text(strip=True)

        descriptions[header_text] = description_text

    return descriptions


def get_pe_quarters(url_name: str) -> list[str]:
    """
    Gets the list of parsed PE files for a given urlName.

    Args:
        url_name (str): The urlName to get PE files for

    Returns:
        list[str]: The list of PE quarters for the term

    >>> get_pe_quarters("f26")
    [1, 2]

    >>> get_pe_quarters("i26")
    [5]
    """

    assert url_name[0] in ("f", "i", "s", "m"), "Invalid urlName format"

    return {
        "f": [1, 2],  # Fall
        "s": [3, 4],  # Spring
        "i": [5],  # IAP
        "m": [],  # Summer
    }[url_name[0]]


def run():
    """
    Main entry point for PE data
    """

    # get list of csv files in the pe data directory
    pe_folder = os.path.join(os.path.dirname(__file__), "pe")
    pe_files = os.listdir(pe_folder)

    pe_files_data = []
    for pe_file in pe_files:
        if pe_file.endswith(".csv"):
            # process the data as needed
            pe_files_data.extend(read_pew_file(os.path.join(pe_folder, pe_file)))

    pe_data = pe_rows_to_schema(pe_files_data)

    for quarter, quarter_data in pe_data.items():
        print(f"Processed PE data for quarter {quarter}: {len(quarter_data)} subjects")
        fname = os.path.join(os.path.dirname(__file__), f"pe-q{quarter}.json")

        with open(fname, "w", encoding="utf-8") as pe_output_file:
            json.dump(quarter_data, pe_output_file)

    return pe_data


if __name__ == "__main__":
    run()
