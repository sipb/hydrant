import json
import re
import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

# TODO: rewrite from sublist_ws.py
BASE_URL = "http://student.mit.edu/catalog/search.cgi"

# Level is obtained in sublist_ws.py but not used in combiner
def get_level(html):
    if html.find(attrs={"src": "/icns/under.gif"}):
        return "U"
    elif html.find(attrs={"src": "/icns/grad.gif"}):
        return "G"
    raise Exception("Level not found")

def is_not_offered_next_year(html):
    # determines if it is not offered next year
    if html.find(attrs={"src": "/icns/nonext.gif"}):
        return True
    return False

def is_repeat_allowed(html):
    if html.find(attrs={"src": "/icns/repeat.gif"}):
        return True
    return False

def get_half(html):
    # Returns 1 for 1st half, 2 for 2nd half, False if not a half semester course
    if html.find(text=re.compile("first half of term")):
        return 1
    elif html.find(text=re.compile("second half of term")):
        return 2
    return False

def has_final(html):
    if html.find(text="+final"):
        return True
    return False

def filter_html(html, course_num):
    h3s = html.findAll("h3")
    def in_special_class_range(title):
        '''
        This function is used to check if a course_num is inside a range
        Special Classes only have one subject listed with ranges such as 11.S196-11.S199
        '''
        # The range should be the first string delimited by white space
        title_range = title.split(" ")[0]
        # Some classes don't have ".S" such as 12.751-12.759
        delimiter = ".S" if ".S" in title_range else "."
        match = re.match(fr"(\w+){delimiter}(\d+)-(\w+){delimiter}(\d+)", title_range)
        if match is None:
            return False
        # Should be same dept
        assert match.group(1) == match.group(3)
        course_dept, course_after_delim = course_num.split(delimiter)
        if match.group(1) != course_dept:
            return False
        num_range = range(int(match.group(2)), int(match.group(4)))
        if int(course_after_delim) not in num_range:
            return False
        return True

    h3_to_use = next((h3 for h3 in h3s if course_num in h3.get_text() or in_special_class_range(h3.get_text())), None)
    if not h3_to_use:
        # Subject cannot be found!
        return None

    elements = [h3_to_use]
    for sibling in h3_to_use.next_siblings:
        # Seems like the next result details is seperated by a <p>
        # There will be <a> tag containing course number of next result but that should be fine
        if sibling.name == "p":
            break
        elements.append(sibling)
    # We don't append during the loop or else it will modify next_siblings
    filtered = BeautifulSoup()
    filtered.extend(elements)
    return filtered

def scrape_classes(course_nums):
    unknown_courses = []
    courses = dict()
    for course_num in (pbar := tqdm(course_nums)):
        pbar.set_description(f"Processing course number: {course_num}")

        r = requests.get(f"{BASE_URL}?search={course_num}")
        html = BeautifulSoup(r.content, 'html.parser')
        html = filter_html(html, course_num)
        if not html:
            unknown_courses.append(course_num)
            continue
        no_next = is_not_offered_next_year(html)
        level = get_level(html)
        repeat = is_repeat_allowed(html)
        half = get_half(html)
        final = has_final(html)

        courses[course_num] = {
            "no_next": no_next,
            "repeat": repeat,
            "half": half,
            "url": "", # urls are all just empty
            "level": level,
            "final": final,
        }
    with open("sublist", "w") as f:
        json.dump(courses, f)
    print("Unknown courses: ", unknown_courses)

def run():
    with open("all_classes") as f:
        class_num_list = json.load(f)
    scrape_classes(class_num_list)

if __name__ == "__main__":
    run()
