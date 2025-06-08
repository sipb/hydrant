"""
We combine the data from the Fireroad API and the data we scrape from the
catalog, into the format specified by src/lib/rawClass.ts.

Functions:
    load_json_data(jsonfile): Loads data from the provided JSON file
    merge_data(datasets, keys_to_keep): Combines the datasets.
    run(): The main entry point.

Dependencies:
    datetime
    json
    utils (within this folder)
"""

from __future__ import annotations

import datetime
import json
import os
import os.path
import sys
from typing import Any, Union
from collections.abc import Iterable

from .utils import get_term_info

if sys.version_info >= (3, 11):
    import tomllib
else:
    import tomli as tomllib


package_dir = os.path.dirname(__file__)


def load_json_data(json_path: str) -> Any:
    """
    Loads data from the provided file

    Args:
    * json_path (str): The file to load from

    Returns:
    * any: The data contained within the file
    """
    json_path = os.path.join(package_dir, json_path)
    with open(json_path, mode="r", encoding="utf-8") as json_file:
        return json.load(json_file)


def load_toml_data(toml_dir: str) -> dict[str, Any]:
    """
    Loads data from the provided directory that consists exclusively of TOML files

    Args:
    * tomldir (str): The directory to load from

    Returns:
    * dict: The data contained within the directory
    """
    toml_dir = os.path.join(package_dir, toml_dir)
    out: dict[str, Any] = {}
    for fname in os.listdir(toml_dir):
        if fname.endswith(".toml"):
            with open(os.path.join(toml_dir, fname), "rb") as toml_file:
                out.update(tomllib.load(toml_file))
    return out


def merge_data(
    datasets: Iterable[dict[Any, dict[str, Any]]], keys_to_keep: Iterable[str]
) -> dict[Any, dict[str, Any]]:
    """
    Combines the provided datasets, retaining only keys from keys_to_keep.
    NOTE: Later datasets will override earlier ones

    Args:
    * datasets (iterable[dict[any, dict]]):
    * keys_to_keep (iterable): The keys to retain in the output

    Returns:
    * dict[any, dict]: The combined data
    """
    result: dict[str, dict[str, Any]] = {k: {} for k in keys_to_keep}
    for key in keys_to_keep:
        for dataset in datasets:
            if key in dataset:
                result[key].update(dataset[key])
    return result


# pylint: disable=too-many-locals
def run() -> None:
    """
    The main entry point.
    Takes data from fireroad.json and catalog.json; outputs latest.json.
    There are no arguments and no return value.
    """
    fireroad_presem = load_json_data("fireroad-presem.json")
    fireroad_sem = load_json_data("fireroad-sem.json")
    catalog = load_json_data("catalog.json")
    cim = load_json_data("cim.json")
    overrides = load_toml_data("overrides.toml.d")

    # The key needs to be in BOTH fireroad and catalog to make it:
    # If it's not in Fireroad, it's not offered in this semester (fall, etc.).
    # If it's not in catalog, it's not offered this year.
    courses_presem = merge_data(
        datasets=[fireroad_presem, catalog, cim, overrides],
        keys_to_keep=set(fireroad_presem) & set(catalog),
    )
    courses_sem = merge_data(
        datasets=[fireroad_sem, catalog, cim, overrides],
        keys_to_keep=set(fireroad_sem) & set(catalog),
    )

    term_info_presem = get_term_info(False)
    url_name_presem = term_info_presem["urlName"]
    term_info_sem = get_term_info(True)
    url_name_sem = term_info_sem["urlName"]
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

    obj_presem: dict[str, Union[dict[str, Any], str, dict[Any, dict[str, Any]]]] = {
        "termInfo": term_info_presem,
        "lastUpdated": now,
        "classes": courses_presem,
    }
    obj_sem: dict[str, Union[dict[str, Any], str, dict[Any, dict[str, Any]]]] = {
        "termInfo": term_info_sem,
        "lastUpdated": now,
        "classes": courses_sem,
    }

    with open(
        os.path.join(package_dir, f"../public/{url_name_presem}.json"),
        mode="w",
        encoding="utf-8",
    ) as presem_file:
        json.dump(obj_presem, presem_file, separators=(",", ":"))

    with open(
        os.path.join(package_dir, "../public/latest.json"), mode="w", encoding="utf-8"
    ) as latest_file:
        json.dump(obj_sem, latest_file, separators=(",", ":"))

    print(f"{url_name_presem}: got {len(courses_presem)} courses")
    print(f"{url_name_sem}: got {len(courses_sem)} courses")


if __name__ == "__main__":
    run()
