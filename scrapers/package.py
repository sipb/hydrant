"""
We combine the data from the Fireroad API and the data we scrape from the
catalog, into the format specified by src/lib/rawClass.ts.

Functions:
* load_json_data(jsonfile): Loads data from the provided JSON file
* merge_data(datasets, keys_to_keep): Combines the datasets.
* run(): The main entry point.

Dependencies:
* datetime
* json
* utils (within this folder)
"""

import datetime
import json
import utils


def load_json_data(jsonfile):
    """
    Loads data from the provided file

    Args:
    * jsonfile (str): The file to load from

    Returns:
    * any: The data contained within the file
    """
    with open(jsonfile, mode="r", encoding="utf-8") as f:
        return json.load(f)


def merge_data(datasets, keys_to_keep):
    """
    Combines the provided datasets, retaining only keys from keys_to_keep.
    NOTE: Later datasets will override earlier ones

    Args:
    * datasets (iterable[dict[any, dict]]):
    * keys_to_keep (iterable): The keys to retain in the output

    Returns:
    * dict[any, dict]: The combined data
    """
    result = {k: {} for k in keys_to_keep}
    for key in keys_to_keep:
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
    fireroad = load_json_data("fireroad.json")
    catalog = load_json_data("catalog.json")
    overrides = load_json_data("overrides.json")

    # The key needs to be in BOTH fireroad and catalog to make it:
    # If it's not in Fireroad, we don't have its schedule.
    # If it's not in catalog, it's not offered this semester.
    courses = merge_data(
        datasets=[fireroad, catalog, overrides],
        keys_to_keep=set(fireroad) & set(catalog),
    )

    term_info = utils.get_term_info()
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    obj = {
        "termInfo": term_info,
        "lastUpdated": now,
        "classes": courses,
    }

    with open("../public/latest.json", mode="w", encoding="utf-8") as f:
        json.dump(obj, f, separators=(",", ":"))
    print(f"Got {len(courses)} courses")


if __name__ == "__main__":
    run()
