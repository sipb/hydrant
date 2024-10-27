"""
Utility data and functions for the scrapers folder.

Data:
* GIR_REWRITE: dict[str, str]
* TIMESLOTS: int
* DAYS: dict[str, int]
* TIMES: dict[str, int]
* EVE_TIMES: dict[str, int]

Functions:
* find_timeslot(day, slot, pm)
* zip_strict(*iterables)
* grouper(iterable, n)
* get_term_info()
"""


import itertools
import json

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
    "6": 20,
    "6.30": 21,
    "7": 22,
    "7.30": 23,
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


def find_timeslot(day, slot, pm):
    """find_timeslot("W", "11.30", False) -> 67"""
    if pm:
        return DAYS[day] + EVE_TIMES[slot]
    return DAYS[day] + TIMES[slot]


def zip_strict(*iterables):
    """zip(strict=True) polyfill."""
    sentinel = object()
    for tuple in itertools.zip_longest(*iterables, fillvalue=sentinel):
        if any(sentinel is t for t in tuple):
            raise ValueError('Iterables have different lengths')
        yield tuple


def grouper(iterable, n):
    """
    grouper("ABCDEFG", 3) -> ABC DEF

    From https://docs.python.org/3/library/itertools.html#itertools-recipes.
    """
    args = [iter(iterable)] * n
    return zip_strict(*args)


def get_term_info():
    """Get the latest term info."""
    with open("../public/latestTerm.json") as f:
        term_info = json.load(f)
    return term_info
