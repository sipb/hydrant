"""
Adds information from PE&W subjects, as given by DAPER.
"""

from __future__ import annotations

import csv
import json
import os
import time as time_c
from datetime import date, time
from typing import Literal, TypedDict

from scrapers.fireroad import parse_section
from scrapers.utils import Term

# ask DAPER how they represent summer...
QUARTERS: dict[int, tuple[Term, Literal[1, 2] | None]] = {
    1: (Term.FA, 1),
    2: (Term.FA, 2),
    3: (Term.SP, 1),
    4: (Term.SP, 2),
    5: (Term.JA, None),
}


class PEWFile(TypedDict):
    """
    Data from CSV file representing PE&W subjects, as given by DAPER
    """

    term: str
    section: str
    title: str
    capacity: int
    days: str
    start_time: str
    end_time: str
    location: str
    start_date: str
    end_date: str
    description: str
    prerequisites: str
    equipment: str
    gir_points: int
    swim_gir: bool
    fee_amount: str


class PEWSchema(TypedDict):
    """
    Information expected by the frontend (see rawPEClass.ts)
    """

    number: str
    name: str
    sections: list[tuple[list[tuple[int, int]], str]]
    rawSections: list[str]
    capacity: int
    startDate: str
    endDate: str
    points: int
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


def read_pew_file(filepath: str) -> list[PEWFile]:
    """
    Parses PE&W data from file according to a specific format from a CSV

    Args:
        filepath (str): The path to the CSV file

    Returns:
        list[PEWFile]: A list of PEWFile dictionaries representing the parsed data
    """
    pew_data: list[PEWFile] = []
    with open(filepath, mode="r", newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            pew_data.append(
                {
                    "term": row["Term"],
                    "section": row["Section"],
                    "title": row["Title"],
                    "capacity": int(row["Capacity"]),
                    "days": row["Day"],
                    "start_time": row["Start time"],
                    "end_time": row["End time"],
                    "location": row["Location"],
                    "start_date": row["Start Date"],
                    "end_date": row["End Date"],
                    "description": row["Description"],
                    "prerequisites": row["Prerequisites"],
                    "equipment": row["Equipment"],
                    "gir_points": int(row["GIR Points"]),
                    "swim_gir": parse_bool(row["Swim GIR"]),
                    "fee_amount": row["Fee Amount"],
                }
            )
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

    >>> term_to_semester_year("2026Q3")
    (2026, <Term.JA: 'IAP'>, None)

    >>> term_to_semester_year("2026Q4")
    (2026, <Term.SP: 'spring'>, 1)
    """

    year, quarter = get_year_quarter(term_str)
    term, semester = QUARTERS[quarter]

    if term == Term.FA:
        year -= 1  # Fall term belongs to the previous academic year

    return (year, term, semester)


def split_section_code(section_code: str) -> tuple[str, str]:
    """
    Splits a section code into its subject and number components.

    Args:
        section_code (str): The section code in the format "PE.0201-1"

    Returns:
        tuple[str, str]: A tuple containing the subject and number components

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


def parse_times_to_raw_section(
    start_time: str, end_time: str, days: str, location: str
) -> str:
    """
    Parses times from CVS to format from Fireroad, for compatibility.

    Args:
        start_time (str): Start time of the class
        end_time (str): End time of the class (or empty string for default)
        days (str): Days the class meets
        location (str): Location of the class

    Returns:
        str: Formatted raw section string
    """
    start_c = time_c.strptime(start_time, "%I:%M %p")
    start = time(start_c.tm_hour, start_c.tm_min)

    if end_time:
        end_c = time_c.strptime(end_time, "%I:%M %p")
        end = time(end_c.tm_hour, end_c.tm_min)
    else:
        end = time(
            start.hour + 1, start.minute
        )  # default to 1 hour if no end time given

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


def pe_rows_to_schema(pe_rows: list[PEWFile]) -> dict[int, dict[str, PEWSchema]]:
    """
    Converts PEWFile dictionaries to a standardized schema dictionary.

    Args:
        pe_file (PEWFile): The PEWFile dictionary to convert

    Returns:
        dict: A dictionary representing the standardized schema,
            keyed by quarter and subject number
    """
    results: dict[int, dict[str, PEWSchema]] = {}

    for pe_row in pe_rows:
        _, quarter = get_year_quarter(pe_row["term"])

        term_results = results.get(quarter)
        if term_results is None:
            term_results = {}
            results[quarter] = term_results

        subject_num, _ = split_section_code(pe_row["section"])
        current_results = term_results.get(subject_num)

        if current_results:
            # ensure all data in current_results (except for section info) are the same
            assert current_results["name"] == pe_row["title"]
            assert current_results["capacity"] == pe_row["capacity"]
            assert current_results["points"] == pe_row["gir_points"]
            assert current_results["swimGIR"] == pe_row["swim_gir"]
            assert current_results["prereqs"] == pe_row["prerequisites"] or (
                current_results["prereqs"] == "None" and pe_row["prerequisites"] == ""
            )
            assert current_results["equipment"] == pe_row["equipment"]
            assert current_results["fee"] == pe_row["fee_amount"]
            assert current_results["description"] == pe_row["description"]

            raw_section = parse_times_to_raw_section(
                pe_row["start_time"],
                pe_row["end_time"],
                pe_row["days"],
                pe_row["location"],
            )
            section = parse_section(raw_section)

            current_results["rawSections"].append(raw_section)
            current_results["sections"].append(section)

            term_results[subject_num] = current_results
        else:
            raw_section = parse_times_to_raw_section(
                pe_row["start_time"],
                pe_row["end_time"],
                pe_row["days"],
                pe_row["location"],
            )
            section = parse_section(raw_section)

            term_results[subject_num] = {
                "number": subject_num,
                "name": pe_row["title"],
                "sections": [section],
                "rawSections": [raw_section],
                "capacity": pe_row["capacity"],
                "startDate": parse_date(pe_row["start_date"]).isoformat(),
                "endDate": parse_date(pe_row["end_date"]).isoformat(),
                "points": pe_row["gir_points"],
                "swimGIR": pe_row["swim_gir"],
                "prereqs": pe_row["prerequisites"] or "None",
                "equipment": pe_row["equipment"],
                "fee": pe_row["fee_amount"],
                "description": pe_row["description"],
                "quarter": quarter,
            }
        results[quarter] = term_results

    return results


def get_pe_files(url_name: str) -> list[str]:
    """
    Gets the list of parsed PE files for a given urlName.

    Args:
        url_name (str): The urlName to get PE files for

    Returns:
        list[str]: The list of PE files for the term

    >>> get_pe_files("f26")
    ['pe-q1.json', 'pe-q2.json']

    >>> get_pe_files("i26")
    ['pe-q5.json']
    """

    assert url_name[0] in ("f", "i", "s", "m"), "Invalid urlName format"

    quarter = {
        "f": [1, 2],  # Fall
        "s": [3, 4],  # Spring
        "i": [5],  # IAP
        "m": [],  # Summer
    }[url_name[0]]

    files = [f"pe-q{q}.json" for q in quarter]

    return files


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
