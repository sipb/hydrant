"""
Mines hydrant data

Functions:
    has_keyword(sometext)
    find_key_sentences(sometext)
    get_description_list(dataset)
    get_my_data()
    find_matching_records(descriptions)
    run()

Constants:
    KEYWORDS
    FOLDER
    FILEPATHS
"""

from __future__ import annotations

import json
from typing import Iterable
from collections.abc import Mapping
from nltk.tokenize import word_tokenize, sent_tokenize  # type: ignore

KEYWORDS = ["limited", "restricted", "enrollment", "preference", "priority"]
FOLDER = "../public/"
FILEPATHS = ["f22.json", "f23.json", "f24.json", "i25.json", "s23.json", "s24.json"]


def has_keyword(sometext: str) -> bool:
    """
    Checks if the given text contains any of the keywords.

    Args:
        sometext (str): The text to search for keywords

    Returns:
        bool: True if sometext contains a keyword, False otherwise
    """
    words = word_tokenize(sometext)  # word_tokenize better than the  in operator
    lowered_words = [w.lower() for w in words]  # make it case insensitive
    for keyword in KEYWORDS:
        if keyword in lowered_words:
            return True
    return False


def find_key_sentences(sometext: str) -> list[str]:
    """
    Returns a list of all sentences that contain a keyword

    Args:
        sometext (str): The text to search for keywords

    Returns:
        list[str]: A list of sentences that contain a keyword
    """
    my_sentences = sent_tokenize(sometext)  # sent_tokenize is much better than .split()
    return [sentence for sentence in my_sentences if has_keyword(sentence)]


def get_description_list(
    dataset: Mapping[str, Mapping[str, Mapping[str, str]]],
) -> list[str]:
    """
    Obtains a list of descriptions from the dataset

    Args:
        dataset (Mapping[str, Mapping[str, Mapping[str, str]]]):
            The dataset containing class information

    Returns:
        list[str]: A list of descriptions from the dataset
    """
    classlist = dataset["classes"].values()
    return [record["description"] for record in classlist]


def get_my_data() -> list[str]:
    """
    obtains the data

    Returns:
        list[str]: A list of descriptions from all the JSON files
    """
    descriptions: list[str] = []
    for filepath in FILEPATHS:
        full_path = FOLDER + filepath
        with open(full_path, "r", encoding="utf-8") as file:
            rawdata = json.load(file)
            descriptions.extend(get_description_list(rawdata))
    return descriptions


def find_matching_records(descriptions: Iterable[str]) -> list[str]:
    """
    find sentences from record descriptions that contain a keyword

    Args:
        descriptions (Iterable[str]): A list of descriptions to search for keywords

    Returns:
        list[str]: A sorted list of unique sentences that contain a keyword
    """
    result: list[str] = []
    for description in descriptions:
        result.extend(find_key_sentences(description))
    return list(sorted(set(result)))


def run() -> None:
    """
    The main function!
    """
    mydata = get_my_data()
    mymatches = find_matching_records(mydata)
    for match in mymatches:
        print(match)


if __name__ == "__main__":
    run()
