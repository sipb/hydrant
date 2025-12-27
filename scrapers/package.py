"""
We combine the data from the Fireroad API and the data we scrape from the
catalog, into the format specified by src/lib/rawClass.ts.

Functions:
    load_json_data(json_path)
    merge_data(datasets, keys_to_keep)
    get_include(include_dirs)
    run()
"""

from __future__ import annotations

import datetime
import json
import os
import os.path
import sys
from collections.abc import Iterable
from typing import Any

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
        json_path (str): The file to load from

    Returns:
        Any: The data contained within the file
    """
    json_path = os.path.join(package_dir, json_path)
    with open(json_path, mode="r", encoding="utf-8") as json_file:
        return json.load(json_file)


def load_toml_data(overrides_dir: str, subpath=".") -> dict[str, Any]:
    """
    Loads data from the provided directory that consists exclusively of TOML files

    Args:
        overrides_dir (str): The directory to load from
        subpath (str, optional): Load from a subdirectory. Defaults to ".".

    Returns:
        dict[str, Any]: The data contained within the directory
    """
    overrides_path = os.path.join(package_dir, overrides_dir)
    out: dict[str, Any] = {}

    if not os.path.isdir(os.path.join(overrides_path, subpath)):
        # directory doesn't exist, so we return an empty dict
        return out

    # If the path is a directory, we load all TOML files in it
    toml_dir = os.path.join(overrides_path, subpath)
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

    .. note::
        Later datasets will override earlier ones

    Args:
        datasets (Iterable[dict[Any, dict[str, Any]]]):
        keys_to_keep (Iterable[str]): The keys to retain in the output

    Returns:
        dict[Any, dict[str, Any]]: The combined data
    """
    result: dict[str, dict[str, Any]] = {k: {} for k in keys_to_keep}
    for key in keys_to_keep:
        for dataset in datasets:
            if key in dataset:
                result[key].update(dataset[key])
    return result


def get_include(overrides: dict[str, dict[str, Any]]) -> set[str]:
    """
    For the dictionary of classes, check if the key "include" is
    present and if it is True. If so, add class to the resulting set.

    Args:
        overrides (dict[str: Any]): List of override classes from files.

    Returns:
        set[str]: The set of classes to include
    """

    classes = set()

    for override_class, override_vals in overrides.items():
        if "include" in override_vals.keys() and override_vals["include"]:
            classes.add(override_class)

    return classes


def run() -> None:
    """
    The main entry point.
    Takes data from fireroad.json and catalog.json; outputs latest.json.
    There are no arguments and no return value.
    """

    sem_types = ("presem", "sem")  # presem = summer/IAP, sem = fall/spring

    catalog = load_json_data("catalog.json")
    cim = load_json_data("cim.json")
    overrides_all = load_toml_data("overrides.toml.d")

    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

    for sem in sem_types:
        fireroad_sem = load_json_data(f"fireroad-{sem}.json")
        overrides_sem = load_toml_data("overrides.toml.d", sem)

        # The key needs to be in BOTH fireroad and catalog to make it:
        # If it's not in Fireroad, it's not offered in this semester (fall, etc.).
        # If it's not in catalog, it's not offered this year.
        courses = merge_data(
            datasets=[fireroad_sem, catalog, cim, overrides_all, overrides_sem],
            keys_to_keep=(set(fireroad_sem) & set(catalog))
            | get_include(overrides_all)
            | get_include(overrides_sem),
        )

        term_info = get_term_info(sem)
        url_name = term_info["urlName"]

        obj: dict[str, dict[str, Any] | str | dict[Any, dict[str, Any]]] = {
            "termInfo": term_info,
            "lastUpdated": now,
            "classes": courses,
        }

        with open(
            os.path.join(
                package_dir, f"../public/{'latest' if sem == 'sem' else url_name}.json"
            ),
            mode="w",
            encoding="utf-8",
        ) as file:
            json.dump(obj, file, separators=(",", ":"))

        print(f"{url_name}: got {len(courses)} courses")


if __name__ == "__main__":
    run()
