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
import os
import os.path
import sys

if sys.version_info >= (3, 11):
    import tomllib
else:
    import tomli as tomllib


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


def load_toml_data(tomldir):
    """
    Loads data from the provided directory that consists exclusively of TOML files

    Args:
    * tomldir (str): The directory to load from

    Returns:
    * dict: The data contained within the directory
    """
    out = {}
    for fname in os.listdir(tomldir):
        if fname.endswith(".toml"):
            with open(os.path.join(tomldir, fname), "rb") as f:
                out.update(tomllib.load(f))
    return out


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
    fireroad_presem = load_json_data("fireroad-presem.json")
    fireroad_sem = load_json_data("fireroad-sem.json")
    catalog = load_json_data("catalog.json")
    overrides = load_toml_data("overrides.toml.d")

    # The key needs to be in BOTH fireroad and catalog to make it:
    # If it's not in Fireroad, it's not offered in this semester (fall, etc.).
    # If it's not in catalog, it's not offered this year.
    courses_presem = merge_data(
        datasets=[fireroad_presem, catalog, overrides],
        keys_to_keep=set(fireroad_presem) & set(catalog),
    )
    courses_sem = merge_data(
        datasets=[fireroad_sem, catalog, overrides],
        keys_to_keep=set(fireroad_sem) & set(catalog),
    )

    term_info_presem = utils.get_term_info(False)
    url_name_presem = term_info_presem["urlName"]
    term_info_sem = utils.get_term_info(True)
    url_name_sem = term_info_sem["urlName"]
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

    obj_presem = {
        "termInfo": term_info_presem,
        "lastUpdated": now,
        "classes": courses_presem,
    }
    obj_sem = {
        "termInfo": term_info_sem,
        "lastUpdated": now,
        "classes": courses_sem,
    }

    with open(f"../public/{url_name_presem}.json", mode="w", encoding="utf-8") as f:
        json.dump(obj_presem, f, separators=(",", ":"))
    with open("../public/latest.json", mode="w", encoding="utf-8") as f:
        json.dump(obj_sem, f, separators=(",", ":"))
    print(f"{url_name_presem}: got {len(courses_presem)} courses")
    print(f"{url_name_sem}: got {len(courses_sem)} courses")


if __name__ == "__main__":
    run()
