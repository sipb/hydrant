# Hydrant

## Setup

Install:

- Python 3, at least Python 3.6.
- Node.js 18.17 or above.
  - One way manage Node versions is using [nvm](https://github.com/nvm-sh/nvm).

In the root directory, run:

- `npm install` to install dependencies.

## Updating

### Local development

There's the frontend, which is the website and the interface. Then there's the backend, which serves information about class schedules and links data stored in Hydrant to the FireRoad API.

To update the frontend (source code in the `src/` directory), you can run `npm start` and open the link that shows up in your terminal window. As you change the source code, the site should update in real-time, but you can reload if you want to make sure you're using the latest version.

To work on the backend (located in `src-server/`), it's a similar process. If you run `npm start`, you can edit any of the files in `src-server/` to reload the Node.js server automatically with your changes. If you just want to tinker with the API without touching the frontend code, you can alternatively run `npm run start:frontend`.

*NB: Hydrant is currently in the process of moving to a Node.js-only backend! For now, you'll need to do the following steps as well.*
 
To update the backend's data files, `cd scrapers` then run `python update.py`.

Make sure to update the backend data before you run the frontend for the first time.

### Changing semesters

Let's say you're updating from e.g. Spring 2023 to Fall 2023.

First, archive the old semester. Make sure you have updated schedule files. Then run `mv src-server/data/latest.json src-server/data/s23.json`.

Then, update the new semester. Open `src-server/data/latestTerm.json`, change `urlName` to `f23`, and update the dates per [Registrar](https://registrar.mit.edu/calendar).

Finally, run the normal update process and commit the results to the repo.

### Updating the server

The server's frontend updates based on the `deploy` branch on GitHub, so any changes pushed there will become live.

The server's backend is updated by an automatic deploy to an XVM instance via the same `deploy` branch.

See `deploy/README.md` for more info.

## Development notes

### Architecture

*I want to change...*

- *...the data available to Hydrant.*
  - The entry point is `scrapers/update.py`.
  - This goes through `src/components/App.tsx`, which looks for the data.
  - The exit point is through the constructor of `State` in `src/lib/state.ts`.
- *...the way Hydrant behaves.*
  - The entry point is `src/lib/state.ts`.
  - The exit point is through `src/components/App.tsx`, which constructs `hydrant` and passes it down.
- *...the way Hydrant looks.*
  - The entry point is `src/components/App.tsx`.
  - We use [Chakra UI](https://chakra-ui.com/) as our component library. Avoid writing CSS.

### Technologies

Try to introduce as few technologies as possible to keep this mostly future-proof. If you introduce something, make sure it'll last a few years. Usually one of these is a sign it'll last:

- some MIT class teaches how to use it
  - e.g. web.lab teaches React, 6.102 teaches Typescript
- it's tiny and used in only a small part of the app
  - e.g. msgpack-lite is only used for URL encoding, nanoid is only used to make IDs
- it's a big, popular, well-documented project that's been around for several years
  - e.g. FullCalendar has been around since 2010, Chakra UI has a large community
