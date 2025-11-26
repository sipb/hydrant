#test_parse_timeslot.test.py
import sys
import os
import pytest

sys.path.append(os.path.dirname(__file__))
from scrapers.fireroad import parse_timeslot

# -------------------------------------------------------------------
# TEST CASES
# -------------------------------------------------------------------

def test_am_am():
    """
    Example: 10–11.30 AM
    parse_timeslot("M", "10-11.30", False)
    """
    # start = DAYS[M]+ time_dict[10]=0 + 8 =8
    # end = DAYS[M]+ time_dict[11.30]=0 + 11 = 11
    # length = end-start=11-8= 3
    start, length = parse_timeslot("M", "10-11.30", False)
    assert start == 8
    assert length == 3


def test_pm_pm():
    """
    Example: 1–3 PM
    parse_timeslot("T", "1-3 PM", True)
    """
    # start = DAYS[T]+ time_dict[1]=(34) + 14 =48
    # end = DAYS[T]+ time_dict[3]=(34) + 18 = 52
    # length = end-start=52-48= 4
    start, length = parse_timeslot("T", "1-3 PM", True)
    assert start == 48
    assert length == 4


def test_am_pm():
    """
    Test AM start → PM end 
    Example: 11 AM – 2 PM but written like "11-2 PM"
    """
    start, length = parse_timeslot("R", "11-2 PM", True)
    # start = DAYS[R]+ time_dict[11]=(34*3) + 10 =112
    # end = DAYS[R]+ time_dict[2]=(34*3) + 16 = 118
    # length = end-start=128-122 = 6
    assert start == 112
    assert length == 6


def test_failing_input_from_issue_254():
    """
    Original failing example from GitHub issue:
    day="W", slot="11-6 PM", time_is_pm=True
    """
    start, length = parse_timeslot("W", "11-6 PM", True)

    # start = DAYS[W]+ time_dict[11]=(34*2) + 10 = 78
    # end = DAYS[W]+ time_dict[6]=(34*2) + 24 = 92
    # length = end-start=92-78 = 14
    assert start == 78
    assert length == 14
