"""
We combine the data from the Fireroad API and the data we scrape from the
catalog, into the format specified by src/lib/rawClass.ts.

Functions:
* get_json_data(jsonfile): Gets data from the specified JSON file.
* merge_data(keys_to_keep, datasets): A helper function to merge the various datasets together.
* run(): The main entry point.
"""

import datetime
import json
import os
import utils

# set the current working directory to avoid bugs
os.chdir(os.path.dirname(os.path.abspath(__file__)))

def get_json_data(jsonfile):
    """
    Gets data from a JSON file.

    Args:
    * jsonfile (str): The file to read from.

    Returns:
    * Any: The data inside the file.
    """
    with open(jsonfile, mode = "r", encoding = "utf-8") as f:
        return json.load(f)

def merge_data(keys_to_keep, datasets):
    """
    Merges multiple datasets into one.
    Later datasets in the `datasets` parameter override earlier ones.

    Args:
    * keys_to_keep (Iterable): The keys to keep when merging.
    * datasets (list[dict[any, dict[any, any]]]): The datasets to merge together.

    Returns:
    * dict[any, dict[any, any]]: The merged dataset.
    """
    result = {}
    for key in keys_to_keep:
        result[key] = {}
        for dataset in datasets:
            if key in dataset:
                result[key].update(dataset[key])
    return result


def run():
    """
    The main entry point.
    Takes data from fireroad.json and catalog.json; outputs latest.json.
    There are no arguments and no return value.
    """
    # get all the data
    OVERRIDES = get_json_data("overrides.json")
    fireroad = get_json_data("fireroad.json")
    catalog = get_json_data("catalog.json")

    # merge all the data together!
    # The key needs to be in BOTH fireroad and catalog to make it:
    # If it's not in Fireroad, we don't have its schedule.
    # If it's not in catalog, it's not offered this semester.
    courses = merge_data(
        keys_to_keep = set(fireroad) & set(catalog),
        datasets = [fireroad, catalog, OVERRIDES]
    )

    # package for distribution
    term_info = utils.get_term_info()
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    obj = {
        "termInfo": term_info,
        "lastUpdated": now,
        "classes": courses,
    }

    with open("../public/latest.json", mode = "w", encoding = "utf-8") as f:
        json.dump(obj, f, separators=(",", ":"))

    # print for sanity checking
    print(f"Got {len(courses)} courses")


if __name__ == "__main__":
    run()
