## About

This folder contains several files. The files tracked by git are:

- `__init__.py`
- `__main__.py`
- `catalog.py`
- `cim.py`
- `fireroad.py`
- `math_dept.py`
- `package.py`
- `update.py`
- `utils.py`
- `README.md` - this very file!
- `.pylintrc`
- `overrides.json` - to override scraped data; currently empty

The files intentionally left out of git are:

- `catalog.json`
- `cim.json`
- `fireroad.json`
- `fireroad-presem.json`
- `__pycache__`
- `.DS_Store`

## Usage

Run `python3 -m scrapers` from the root directory to execute the code. In production, there is a cron job that runs this every hour.

This program gets its data from MIT classes from two sources:

- the official catalog: http://student.mit.edu/catalog/index.cgi
- the Fireroad API: https://fireroad.mit.edu/courses/all?full=true

It is mainly intended to serve as a data source for the frontend, which is the real deal. This is just the backend.

## How it works

`__main__.py` calls four other programs, in this order: `fireroad.py`, `catalog.py`, `cim.py`, `package.py`. Each of these four files has a `run()` function, which is its main entry point to the codebase. Broadly speaking:

- `fireroad.py` creates `fireroad.json` and `fireroad-presem.json`
- `catalog.py` creates `catalog.json`
- `cim.py` creates `cim.json`
- `package.py` combines these to create `../public/latest.json` and another JSON file under `../public/` that corresponds to IAP or summer. (This is the final product that our frontend ingests.)

`math_dept.py` is an irregularly run file that helps create override data for courses in the MIT math department (since those are formatted slightly differently). `utils.py` contains a few utility functions and variables, which in turn are used by `fireroad.py` and `package.py`. The file `__init__.py` is empty but we include it anyways for completeness.

## Contributing

This folder is actually a subfolder of a larger git repository. If you want to contribute to this repository, submit a pull request to https://github.com/sipb/hydrant and we'll merge it if it looks good.

Depending on how you work, you might find `pylint` and/or running individual programs one at a time and then playing around with the Python shell to be helpful.
