"""
Utility data and functions for the scrapers folder.

Constants:
    GIR_REWRITE: dict[str, str]
    TIMESLOTS: int
    DAYS: dict[str, int]
    TIMES: dict[str, int]
    EVE_TIMES: dict[str, int]
    Term: enum.EnumType

Functions:
    find_timeslot(day, slot, pm)
    zip_strict(*iterables)
    grouper(iterable, n)
    get_term_info(sem_term)
    url_name_to_term(url_name)
"""

from __future__ import annotations

import csv
import json
import os.path
from enum import Enum
from itertools import zip_longest
from typing import Any, Generator, Iterable, Literal
from urllib.parse import urlparse
from urllib.request import urlopen

GIR_REWRITE = {
    "GIR:CAL1": "Calculus I (GIR)",
    "GIR:CAL2": "Calculus II (GIR)",
    "GIR:PHY1": "Physics I (GIR)",
    "GIR:PHY2": "Physics II (GIR)",
    "GIR:CHEM": "Chemistry (GIR)",
    "GIR:BIOL": "Biology (GIR)",
}

TIMESLOTS = 68

DAYS = {
    "M": 0,
    "T": TIMESLOTS,
    "W": TIMESLOTS * 2,
    "R": TIMESLOTS * 3,
    "F": TIMESLOTS * 4,
}

TIMES = {
    "6": 0,
    "7": 4,
    "8": 8,
    "9": 12,
    "10": 16,
    "11": 20,
    "12": 24,
    "1": 28,
    "2": 32,
    "3": 36,
    "4": 40,
    "5": 44,
}

EVE_TIMES = {
    "12": 24,
    "1": 28,
    "2": 32,
    "3": 36,
    "4": 40,
    "5": 44,
    "6": 48,
    "7": 52,
    "8": 56,
    "9": 60,
    "10": 64,
}

MINUTES = {
    "": 0,
    "00": 0,
    "15": 1,
    "30": 2,
    "45": 3,
}

MONTHS = {
    "jan": 1,
    "feb": 2,
    "mar": 3,
    "apr": 4,
    "may": 5,
    "jun": 6,
    "jul": 7,
    "aug": 8,
    "sep": 9,
    "oct": 10,
    "nov": 11,
    "dec": 12,
}


class Term(Enum):
    """Terms for the academic year."""

    FA = "fall"
    JA = "IAP"
    SP = "spring"
    SU = "summer"


def find_timeslot(day: str, slot: str, is_slot_pm: bool) -> int:
    """
    Finds the numeric code for a timeslot.

    >>> find_timeslot("W", "11.30", False)
    158

    Args:
        day (str): The day of the timeslot
        slot (str): The time of the timeslot
        is_slot_pm (bool): Whether the timeslot is in the evening

    Raises:
        ValueError: If no matching timeslot could be found.

    Returns:
        int: A numeric code for the timeslot
    """
    time_dict = EVE_TIMES if is_slot_pm else TIMES
    slot_split = slot.split(".")
    hour, minute = [slot_split[0], slot_split[1] if len(slot_split) > 1 else ""]
    if day not in DAYS or hour not in time_dict:  # error handling!
        raise ValueError(f"Invalid timeslot {day}, {slot}, {is_slot_pm}")
    return DAYS[day] + time_dict[hour] + MINUTES[minute]


def zip_strict(*iterables: Iterable[Any]) -> Generator[tuple[Any, ...], Any, None]:
    """
    Helper function for grouper.
    Groups values of the iterator on the same iteration together.

    Raises:
        ValueError: If iterables have different lengths.

    Yields:
        Tuple[Any, ...]: A generator, which you can iterate over.
    """
    sentinel = object()
    for group in zip_longest(*iterables, fillvalue=sentinel):
        if any(sentinel is t for t in group):
            raise ValueError("Iterables have different lengths")
        yield group


def grouper(
    iterable: Iterable[Any], group_size: int
) -> Generator[tuple[Any, ...], Any, None]:
    """
    Groups items of the iterable in equally spaced blocks of group_size items.
    If the iterable's length ISN'T a multiple of group_size, you'll get a
    ValueError on the last iteration.

    >>> list(grouper("ABCDEFGHI", 3))
    [('A', 'B', 'C'), ('D', 'E', 'F'), ('G', 'H', 'I')]

    From https://docs.python.org/3/library/itertools.html#itertools-recipes.

    Args:
        iterable (Iterable[Any]): an iterator
        group_size (int): The size of the groups

    Returns:
        Generator[Tuple[Any, ...], Any, None]:
            The result of the grouping, which you can iterate over.
    """
    args = [iter(iterable)] * group_size
    return zip_strict(*args)


def get_term_info(sem_term: Literal["sem", "presem"]) -> dict[str, Any]:
    """
    Gets the latest term info from "../public/latestTerm.json" as a dictionary.
    If sem_term = "sem", looks at semester term (fall/spring).
    If sem_term = "presem", looks at pre-semester term (summer/IAP)

    Args:
        is_semester_term (Literal["sem", "presem"]): whether to look at the semester
            or the pre-semester term.

    Returns:
        Dict[str, Any]: the term info for the selected term from latestTerm.json.
    """
    fname = os.path.join(os.path.dirname(__file__), "../public/latestTerm.json")
    with open(fname, encoding="utf-8") as latest_term_file:
        term_info = json.load(latest_term_file)

    if sem_term == "sem":
        return term_info["semester"]
    return term_info["preSemester"]


def url_name_to_term(url_name: str) -> Term:
    """
    Extract the term (without academic year) from a urlName.

    >>> url_name_to_term("f24")
    <Term.FA: 'fall'>

    Args:
        url_name (string): a urlName representing a term, as found in latestTerm.json.

    Raises:
        ValueError: If the url_name does not start with a valid term character.

    Returns:
        Term: the enum value corresponding to the current term (without academic year).
    """
    if url_name[0] == "f":
        return Term.FA
    if url_name[0] == "i":
        return Term.JA
    if url_name[0] == "s":
        return Term.SP
    if url_name[0] == "m":
        return Term.SU

    raise ValueError(f"Invalid term {url_name[0]}")


def is_url(path_string: str) -> bool:
    """Check if the string has a URL-like scheme and network location."""
    try:
        result = urlparse(path_string)
        # Check if both a scheme (e.g., 'http', 'https')
        # AND a network location (e.g., 'www.google.com') are present
        return bool(result.scheme and result.netloc)
    except ValueError:
        return False


def read_csv(path: str, types_dict: type) -> list:
    """
    Parses data from file according to a specific format from a CSV

    Args:
        filepath (str): The path to the CSV file, either file path or URL
        types_dict (type): The TypedDict type representing the data format

    Returns:
        list[types_dict]: A list of TypedDict dictionaries representing the parsed data
    """

    assert hasattr(types_dict, "__annotations__"), "types_dict must be a TypedDict type"

    data = []
    cols = getattr(types_dict, "__annotations__").keys()

    path_is_url = is_url(path)

    if path_is_url:
        with_open = urlopen(path, timeout=15)
    else:
        with_open = open(path, mode="r", newline="", encoding="utf-8")

    with with_open as csvfile:
        reader = csv.DictReader(
            csvfile
            if not path_is_url
            else csvfile.read().decode("utf-8")[1:].splitlines()  # type: ignore
        )
        for row in reader:
            assert all(
                col in row for col in cols
            ), f"Missing columns in CSV file: {path}"
            data.append({col: row[col] for col in cols})  # type: ignore

    return data
