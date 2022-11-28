# Firehose

## Setup

Install:

- Python 3, at least Python 3.6.
- Node.js 16, at least Node 16.16.
  - Careful, the latest version is 18!
  - One way manage Node versions is using [nvm](https://github.com/nvm-sh/nvm).

In the root directory, run:

- `pip install -r requirements.txt` to install dependencies.
- `npm install` to install dependencies.

## Updating

### Normal updating

- To update schedules, `cd scrapers` then run `python update.py`.
  - This updates the file `public/latest.json`.
  - It's important for the working directory to be `scrapers`.
  - On the server, there should be a cron script running this every few hours.
- To update the frontend, run `npm build`.
  - Then run `./deploy.sh` or something to deploy it. Need to figure this out.
  - You can run `npm start` for the frontend hotloader.

### Changing semesters

Let's say you're updating from e.g. Spring 2023 to Fall 2023.

- First, archive the old semester:
  - Run `mv public/latest.json public/s23.json`.
- Then, update the new semester:
  - Open `public/latestTerm.json`.
  - Change `urlName` to `f23`.
  - Update the dates per [Registrar](https://registrar.mit.edu/calendar).
- Run the normal update process above.

## Development notes

### Architecture

*I want to change...*

- *...the data available to Firehose.*
  - The entry point is `scrapers/update.py`.
  - This goes through `src/components/App.tsx`, which looks for the data.
  - The exit point is through the constructor of `Firehose` in `src/lib/firehose.ts`.
- *...the way Firehose behaves.*
  - The entry point is `src/lib/firehose.ts`.
  - The exit point is through `src/components/App.tsx`, which constructs `Firehose` and passes it down.
- *...the way Firehose looks.*
  - The entry point is `src/components/App.tsx`.
  - We use [Chakra UI](https://chakra-ui.com/) as our component library. Avoid writing CSS.

### Technologies

Try to introduce as few technologies as possible to keep this mostly future-proof. If you introduce something, make sure it'll last a few years. Usually one of these is a sign it'll last:

- some MIT class teaches how to use it
  - e.g. web.lab teaches React, 6.102 teaches Typescript
- it's tiny and used in only a small part of the app
  - e.g. msgpack-lite is only used for URL encoding, nanoid is only used to make IDs
- it's a big, popular, well-documented project that's been around for several years
  - e.g. FullCalendar has been around since old Firehose, Chakra UI has a large community
