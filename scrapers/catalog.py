import json
import re
import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

BASE_URL = "http://student.mit.edu/catalog/search.cgi"

def get_old_course_num(html):
    course_title = html.find("h3").get_text()
    # Old course number is on 2nd line if the text is not "(New)"
    title_split = course_title.split('\n')
    if len(title_split) > 2 and title_split[1] != "(New)":
        return title_split[1][1:-1]
    return None

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
        if (old_course_num := get_old_course_num(html)):
            courses[course_num]["old_num"] = old_course_num

    with open("sublist", "w") as f:
        json.dump(courses, f)
    print("Unknown courses: ", unknown_courses)

def get_course_data(filtered_html):
    no_next = is_not_offered_next_year(filtered_html)
    level = get_level(filtered_html)
    repeat = is_repeat_allowed(filtered_html)
    half = get_half(filtered_html)
    final = has_final(filtered_html)

    course_data = {
        "no_next": no_next,
        "repeat": repeat,
        "half": half,
        "url": "", # urls are all just empty
        "level": level,
        "final": final,
    }
    if (old_course_num := get_old_course_num(filtered_html)):
        course_data["old_num"] = old_course_num

    return course_data

def run():
    with open("all_classes") as f:
        class_num_list = json.load(f)
    scrape_classes(class_num_list)

HOME_URL = "http://student.mit.edu/catalog"
def get_home_catalog_links():
    r = requests.get(HOME_URL + "/index.cgi")
    html = BeautifulSoup(r.content, "html.parser")
    list_items = html.find_all("li")
    hrefs = []
    for li in list_items:
        ele = li.find("a", href=True)
        if ele:
            hrefs.append(ele["href"])
    return hrefs

def get_all_catalog_links(initial_hrefs):
    hrefs = []
    for il in initial_hrefs:
        r = requests.get(f"{HOME_URL}/{il}")
        html = BeautifulSoup(r.content, "html.parser")
        # Links should be in the only table in the #contentmini div 
        table = html.find("div", id="contentmini").find("table")
        # The table doesn't make the first page a link
        hrefs.append(il)
        hrefs.extend([ele["href"] for ele in table.findAll("a", href=True)])
    return hrefs


def scrape_courses_from_page(courses, href):
    '''Fills courses with course data from the href'''
    r = requests.get(f"{HOME_URL}/{href}")
    # The "html.parser" parses pretty badly
    html = BeautifulSoup(r.content, "lxml")

    pretty = html.split()
    print(pretty)


    first_ele = html.find("a", href=False)
    current_course = [first_ele]
    course_nums = [first_ele["name"]]
    for sib in first_ele.next_siblings:
        # Each class seems be split with an <a> element with nothing inside 
        # but with a name attribute that is the course number. There are other
        # <a> elements inside but they are not on the same level, so they won't
        # be caught by next_sibling
        if sib.name == "a" and sib.get("href") is None:
            # If there is nothing between the <a> elements, that means they are
            # range classes (e.g 11.S196-11.S199). So we continue as we haven't
            # reached the html that contains actual data, but we keep track of
            # the course numbers we see
            most_recent_elem = current_course[-1]
            if most_recent_elem.name == "a" and most_recent_elem.get("href") is None:
                course_nums.append(sib["name"])
                continue
            filtered_html = BeautifulSoup()
            filtered_html.extend(current_course)
            course_data = get_course_data(filtered_html)
            for course_num in course_nums:
                courses[course_num] = course_data
            # Move to the next course
            current_course = [sib]
            course_nums = [sib["name"]]
            continue
        current_course.append(sib)
    # Last element
    if current_course and current_course[0].name == "a" and current_course[0].get("href") is None:
        filtered_html = BeautifulSoup()
        filtered_html.extend(current_course)
        course_data = get_course_data(filtered_html)
        for course_num in course_nums:
            courses[course_num] = course_data

if __name__ == "__main__":
    home_hrefs = get_home_catalog_links()
    all_hrefs = get_all_catalog_links(home_hrefs)
    all_hrefs = ["m4g.html"]
    courses = dict()
    for href in all_hrefs:
        scrape_courses_from_page(courses, href)
    print(courses["15.THG"])
    # with open('new_lol', "w") as f:
    #     json.dump(courses, f)

