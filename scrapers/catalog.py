"""
We get some of our data from scraping the catalog site.

run() scrapes this data and writes it to catalog.json, in the format:

.. code-block:: json
    {
        "6.3900": {
            "nonext": true | false,
            "repeat": true | false,
            "url": "https://introml.mit.edu",
            "final": true | false,
            "half": false | 1 | 2,
            "limited": true | false,
        }
    }

Functions:
    is_not_offered_this_year(html)
    is_not_offered_next_year(html)
    is_repeat_allowed(html)
    get_url(html)
    has_final(html)
    get_half(html)
    is_limited(html)
    get_course_data(filtered_html)
    get_home_catalog_links()
    get_all_catalog_links(initial_hrefs)
    get_anchors_with_classname(element)
    scrape_courses_from_page(courses, href)
    run()

Constants:
    BASE_URL
    LIMITED_REGEX

Dependencies:
    json
    os.path
    re
    requests
    bs4
"""

from __future__ import annotations

import json
import os.path
import re
from typing import Union
from collections.abc import MutableMapping, Mapping, Iterable

import requests
from bs4 import BeautifulSoup, NavigableString, Tag

BASE_URL = "http://student.mit.edu/catalog"

# various limited/restricted/etc enrollment phrases in course descriptions
# PLEASE use regex101.com to test changes before pushing to production!!!
# text_mining.py also helps by finding test sentences from our entire database

LIMITED_REGEX = re.compile(
    r"""(?x)
    [Ee]nrollment[ ](|is[ ]|may[ ]be[ ]|will[ ]be[ ])
    (limited|restricted|by[ ]application)
    |([Ll]imited|[Rr]estricted)[ ]
    (enrollment|by[ ]lottery|number|\d+|to[ ]\d+)
    |([Ll]imited|[Rr]estricted|([Pp]reference|[Pp]riority)( given| is given)?)
    [ ]to[ ]([A-Za-z0-9-' ]+)?
    (
        students?|freshmen|sophomores|juniors|seniors|majors|minors
        |concentrators|[Ff]ellows|MBAs?|undergraduates|candidates
    )
    |required[ ]prior[ ]to[ ]enrollment
    |have[ ]priority
"""
)


def is_not_offered_this_year(html: BeautifulSoup) -> bool:
    """
    Checks if the class is not offered this year.

    Args:
        html (BeautifulSoup): the input webpage

    Returns:
        bool: True if the class is not offered this year
    """
    if html.find(attrs={"src": "/icns/nooffer.gif"}):
        return True
    if html.find(
        text=re.compile("not offered regularly; consult department", re.IGNORECASE)
    ):
        return True
    return False


def is_not_offered_next_year(html: BeautifulSoup) -> bool:
    """
    Checks if the class is not offered next year.

    Args:
        html (BeautifulSoup): the input webpage

    Returns:
        bool: True if the class is not offered next year
    """
    if html.find(attrs={"src": "/icns/nonext.gif"}):
        return True
    return False


def is_repeat_allowed(html: BeautifulSoup):
    """
    Checks if you're allowed to retake the class for credit.

    Args:
        html (BeautifulSoup): the input webpage

    Returns:
        bool: Whether you're allowed to retake the class for credit
    """
    if html.find(attrs={"src": "/icns/repeat.gif"}):
        return True
    return False


def get_url(html: BeautifulSoup) -> Union[NavigableString, str]:
    """
    Finds a URL on the webpage, if it exists.

    Args:
        html (BeautifulSoup): the input webpage

    Returns:
        str: Some URL on the webpage, or an empty string if there isn't one
    """
    url = html.find(text=re.compile("https?://(?!whereis)"))
    if url:
        return url  # type: ignore
    return ""


def has_final(html: BeautifulSoup) -> bool:
    """
    Checks if the class has a final

    Args:
        html (BeautifulSoup): the input webpage

    Returns:
        bool: Whether the class has a final
    """
    if html.find(text="+final"):
        return True
    return False


def get_half(html: BeautifulSoup) -> Union[int, bool]:
    """
    Checks if the class is a half-semester course.

    Args:
        html (BeautifulSoup): the input webpage

    Returns:
        Union[int, bool]: 1 if the class is in the first half of the term,
            2 if the class is in the second half of the term, False if it is not a half
            semester course
    """
    if html.find(text=re.compile("first half of term")):
        return 1
    if html.find(text=re.compile("second half of term")):
        return 2
    return False


def is_limited(html: BeautifulSoup) -> bool:
    """
    Checks if enrollment in the class is limited.

    Args:
        html (BeautifulSoup): the input webpage

    Returns:
        bool: True if enrollment in the class is limited
    """
    if html.find(text=LIMITED_REGEX):
        return True
    return False


def get_course_data(filtered_html: BeautifulSoup) -> dict[str, Union[bool, int, str]]:
    """
    Gets the metadata about a class from the filtered HTML.

    Args:
        filtered_html (BeautifulSoup): the input webpage

    Returns:
        dict[str, Union[bool, int, str]]: metadata about that particular class
    """
    return {
        "nonext": is_not_offered_next_year(filtered_html),
        "repeat": is_repeat_allowed(filtered_html),
        "url": get_url(filtered_html),
        "final": has_final(filtered_html),
        "half": get_half(filtered_html),
        "limited": is_limited(filtered_html),
    }


def get_home_catalog_links() -> Iterable[str]:
    """
    Scrapes the home page of the catalog to get the
    links to the major-specific subpages.

    Returns:
        Iterable[str]: relative links to major-specific subpages to scrape
    """
    catalog_req = requests.get(BASE_URL + "/index.cgi", timeout=3)
    html = BeautifulSoup(catalog_req.content, "html.parser")
    home_list = html.select_one("td[valign=top][align=left] > ul")
    return (a["href"] for a in home_list.find_all("a", href=True))  # type: ignore


def get_all_catalog_links(initial_hrefs: Iterable[str]) -> list[str]:
    """
    Find all links from the headers before the subject listings

    Args:
        initial_hrefs (Iterable[str]): initial list of relative links to subpages

    Returns:
        list[str]: A more complete list of relative links to subpages to scrape
    """
    hrefs: list[str] = []
    for initial_href in initial_hrefs:
        href_req = requests.get(f"{BASE_URL}/{initial_href}", timeout=3)
        html = BeautifulSoup(href_req.content, "html.parser")
        # Links should be in the only table in the #contentmini div
        tables: Tag = html.find("div", id="contentmini").find_all(  # type: ignore
            "table"
        )
        hrefs.append(initial_href)
        for table in tables:
            hrefs.extend(
                [ele["href"] for ele in table.findAll("a", href=True)]  # type: ignore
            )
    return hrefs


def get_anchors_with_classname(element: Tag) -> Union[list[Tag], None]:
    """
    Returns the anchors with the class name if the element itself is one or
    anchors are inside of the element. Otherwise, returns None.

    Args:
        element (Tag): the input HTML tag

    Returns:
        Union[list[Tag], None]: a list of links, or None
    """
    anchors = None
    # This is the usualy case, where it's one element
    if element.name == "a" and element.get("href") is None:
        anchors = [element]
    # This is the weird case where the <a> is inside a tag
    # And sometimes the tag has multiple <a> e.g. HST.010 and HST.011
    elif isinstance(element, Tag):  # type: ignore
        anchors = element.find_all("a", href=False)
    if not anchors:
        return None

    # We need this because apparently there are anchors with names such as "PIP"
    return list(
        filter(lambda a: re.match(r"\w+\.\w+", a["name"]), anchors)  # type: ignore
    )


def scrape_courses_from_page(
    courses: MutableMapping[str, Mapping[str, Union[bool, int, str]]], href: str
) -> None:
    """
    Fills courses with course data from the href

    This function does NOT return a value. Instead, it modifies the `courses` variable.

    Args:
        courses (MutableMapping[str, Mapping[str, Union[bool, int, str]]]):
            a dictionary to fill with course data
        href (str): the relative link to the page to scrape
    """
    href_req = requests.get(f"{BASE_URL}/{href}", timeout=3)
    # The "html.parser" parses pretty badly
    html = BeautifulSoup(href_req.content, "lxml")
    classes_content: Tag = html.find(
        "table", width="100%", border="0"
    ).find(  # type: ignore
        "td"
    )

    # For index idx, contents[idx] corresponds to the html content for the courses in
    # course_nums_list[i]. The reason course_nums_list is a list of lists is because
    # there are courses that are ranges but have the same content
    course_nums_list: list[list[str]] = []
    contents: list[list[Tag]] = []
    for ele in classes_content.contents:
        anchors = get_anchors_with_classname(ele)  # type: ignore
        if anchors:
            new_course_nums = [anchor["name"] for anchor in anchors]
            # This means the course listed is a class range (e.g. 11.S196-11.S199)
            # Thus, we continue looking for content but also add an extra course_num
            if contents and not contents[-1]:
                course_nums_list[-1].extend(new_course_nums)  # type: ignore
                continue
            course_nums_list.append(new_course_nums)  # type: ignore
            contents.append([])
        else:
            if not course_nums_list:
                continue
            contents[-1].append(ele)  # type: ignore

    assert len(course_nums_list) == len(contents)
    for course_nums, content in zip(course_nums_list, contents):
        filtered_html = BeautifulSoup()
        filtered_html.extend(content)
        course_data = get_course_data(filtered_html)
        if not is_not_offered_this_year(filtered_html):
            for course_num in course_nums:
                courses[course_num] = course_data


def run() -> None:
    """
    The main function! This calls all the other functions in this file.
    """
    home_hrefs = get_home_catalog_links()
    all_hrefs = get_all_catalog_links(home_hrefs)
    courses: MutableMapping[str, Mapping[str, Union[bool, int, str]]] = {}
    for href in all_hrefs:
        print(f"Scraping page: {href}")
        scrape_courses_from_page(courses, href)
    print(f"Got {len(courses)} courses")

    fname = os.path.join(os.path.dirname(__file__), "catalog.json")
    with open(fname, "w", encoding="utf-8") as catalog_file:
        json.dump(courses, catalog_file)


if __name__ == "__main__":
    run()
