## About ##

This folder contains several files. The files tracked by git are:

* __init__.py
* catalog.py
* fireroad.py
* math_dept.py
* package.py
* update.py
* utils.py
* README.md - this very file!
* .pylintrc

The files intentionally left out of git are:

* catalog.json
* fireroad.json
* __pycache__
* .DS_Store

## Usage ##

Run `python3 update.py` to execute the code. In production, there is a cron job that runs this every hour.

This program scrapes and munges data on MIT classes from two main sources:
* the official catalog: http://student.mit.edu/catalog/index.cgi
* our very own Fireroad project: https://fireroad.mit.edu/courses/all?full=true

It is mainly intended to serve as a data source for the frontend, which is the real deal. This is just the backend.

## How it works ##

`update.py` calls three other programs, in this order: `fireroad.py`, `catalog.py`, `package.py`. Each of these four files has a `run()` function, which is the main entry point to its codebase. Broadly speaking, `fireroad.py` creates `fireroad.json`, `catalog.py` creates `catalog.json`, and `package.py` combines these to create `latest.json` (which is actually stored one folder up the tree, in the `public` directory).

`math_dept.py` is an irregularly run file that helps create override data for courses in the MIT math department (since those are formatted slightly differently). `utils.py` contains a few utility functions and variables, which in turn are used by `fireroad.py` and `package.py`. The file `__init__.py` is empty but is included anyways.

## Contributing ##

This folder is actually a subfolder of a larger git repository. If you want to contribute to this repository, submit a pull request to https://github.com/sipb/hydrant and we'll merge it if it looks good.

Depending on how you work, you might find `pylint` and/or running individual programs one at a time and then playing around with the Python shell to be helpful.