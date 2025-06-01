"""
Utility data and functions for the scrapers folder.

Data:
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
    get_term_info()
"""

from itertools import zip_longest
import json
import os.path
from enum import Enum
from typing import Any, Dict, Generator, Iterable, Tuple

GIR_REWRITE = {
    "GIR:CAL1": "Calculus I (GIR)",
    "GIR:CAL2": "Calculus II (GIR)",
    "GIR:PHY1": "Physics I (GIR)",
    "GIR:PHY2": "Physics II (GIR)",
    "GIR:CHEM": "Chemistry (GIR)",
    "GIR:BIOL": "Biology (GIR)",
}

TIMESLOTS = 30

DAYS = {
    "M": 0,
    "T": TIMESLOTS,
    "W": TIMESLOTS * 2,
    "R": TIMESLOTS * 3,
    "F": TIMESLOTS * 4,
}

TIMES = {
    "8": 0,
    "8.30": 1,
    "9": 2,
    "9.30": 3,
    "10": 4,
    "10.30": 5,
    "11": 6,
    "11.30": 7,
    "12": 8,
    "12.30": 9,
    "1": 10,
    "1.30": 11,
    "2": 12,
    "2.30": 13,
    "3": 14,
    "3.30": 15,
    "4": 16,
    "4.30": 17,
    "5": 18,
    "5.30": 19,
}

EVE_TIMES = {
    "12": 8,
    "12.30": 9,
    "1": 10,
    "1.30": 11,
    "2": 12,
    "2.30": 13,
    "3": 14,
    "3.30": 15,
    "4": 16,
    "4.30": 17,
    "5": 18,
    "5.30": 19,
    "6": 20,
    "6.30": 21,
    "7": 22,
    "7.30": 23,
    "8": 24,
    "8.30": 25,
    "9": 26,
    "9.30": 27,
    "10": 28,
    "10.30": 29,
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
    Example: find_timeslot("W", "11.30", False) -> 67

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
    if day not in DAYS or slot not in time_dict:  # error handling!
        raise ValueError(f"Invalid timeslot {day}, {slot}, {is_slot_pm}")
    return DAYS[day] + time_dict[slot]


def zip_strict(*iterables: Iterable[Any]) -> Generator[Tuple[Any, ...], Any, None]:
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
) -> Generator[Tuple[Any, ...], Any, None]:
    """
    Groups items of the iterable in equally spaced blocks of group_size items.
    If the iterable's length ISN'T a multiple of group_size, you'll get a
    ValueError on the last iteration.

    Example: grouper("ABCDEFGHI", 3) -> ABC DEF GHI

    From https://docs.python.org/3/library/itertools.html#itertools-recipes.

    Args:
        iterable (Iterable[Any]): an iterator
        group_size (int): The size of the groups

    Returns:
        Generator[Tuple[Any, ...], Any, None]: The result of the grouping, which you can iterate over.
    """
    args = [iter(iterable)] * group_size
    return zip_strict(*args)


def get_term_info(is_semester_term: bool) -> Dict[str, Any]:
    """
    Gets the latest term info from "../public/latestTerm.json" as a dictionary.
    If is_semester_term = True, looks at semester term (fall/spring).
    If is_semester_term = False, looks at pre-semester term (summer/IAP)

    Args:
        is_semester_term (bool): whether to look at the semester
            or the pre-semester term.

    Returns:
        Dict[str, Any]: the term info for the selected term from latestTerm.json.
    """
    fname = os.path.join(os.path.dirname(__file__), "../public/latestTerm.json")
    with open(fname, encoding="utf-8") as latest_term_file:
        term_info = json.load(latest_term_file)
    if is_semester_term:
        return term_info["semester"]

    return term_info["preSemester"]


def url_name_to_term(url_name: str) -> Term:
    """
    Extract the term (without academic year) from a urlName.

    >>> url_name_to_term("f24")
    Term.FA

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
