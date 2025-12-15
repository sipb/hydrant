# Hydrant

## Setup

Install:

- Python 3, at least Python 3.8.
- Node.js, at least Node.js 20.
  - One way to manage Node versions is using [nvm](https://github.com/nvm-sh/nvm).

In the root directory, run:

- `pip install -e .[dev]` to install dependencies.
  - This will generate a `Hydrant.egg-info` folder in `src`, feel free to delete it.
- `npm install` to install dependencies.

## Updating

### Local development

There's the frontend, which is the website and the interface. Then there's the backend, or the schedules, which are the files that have information about class schedules.

To spin up the site, we need two steps:

(1) We need to update the backend to get the data. Run `python3 -m scrapers`.

(2) We then can update the frontend, via running `npm run dev`. This will start a developer server. Open a browser tab to [`http://localhost:5173/`](http://localhost:5173/), which will update live as you edit code.

If this is the **first time** you're spinning up the website, the two steps have to be taken in order: step (1), and then step (2). If not followed, you'll see a blank frontend.

After the first time, the step order doesn't matter to bring up the site; in fact, backend step (1) can even be skipped -- since you'd already have locally cached data. Though backend commands are still necessary if you'd like to keep the data updated.

Before making commits, run `black .` (for the backend) and `npm run format` (for the frontend) to ensure that your changes comply with the project's code style. (This will also get checked by CI when you open a pull request.) Both [Black](https://black.readthedocs.io/en/stable/integrations/editors.html) and [Prettier](https://prettier.io/docs/en/editors) have editor integrations as well.

### Changing semesters

Let's say you're updating from e.g. Spring 2023 to Fall 2023.

First, archive the old semester. Make sure you have updated schedule files. Then run `mv public/latest.json public/s23.json`.

Then, update the new semester. Open `public/latestTerm.json`, change `urlName` to `m23` (for the "pre-semester" summer 2023) and `f23` (for the semester fall 2023), and update the dates per [Registrar](https://registrar.mit.edu/calendar).

Next, update the `.gitignore` to ignore `public/m23.json` rather than `public/i23.json`.

Finally, run the normal update process and commit the results to the repo.

### Updating the server

The server's frontend updates based on the `deploy` branch on GitHub, so any changes pushed there will become live.

The server's backend is updated through a cron script that runs `update.py` every hour.

See `deploy/README.md` for more info.

## Development notes

### Architecture

_I want to change..._

- _...the data available to Hydrant._
  - The entry point is `scrapers/update.py`.
  - This goes through the client loader in `src/routes/_index.tsx`, which looks for the data.
  - The exit point is through the constructor of `State` in `src/lib/state.ts`.
- _...the way Hydrant behaves._
  - The entry point is `src/lib/state.ts`.
  - The exit point is through `src/routes/_index.tsx`, which constructs `hydrant` and adds it to a reusable context.
- _...the way Hydrant looks._
  - The entry point is `src/routes/_index.tsx`.
  - We use [Chakra UI](https://chakra-ui.com/) as our component library. Avoid writing CSS.
- _...routes available in Hydrant._
  - Routes are stored in `src/routes.ts` and can be modified there.
  - Run `npm run typecheck` to make sure route types are still ok once you're done

### Technologies

Try not to introduce new technologies that must be separately understood to keep this mostly future-proof. If you introduce something, make sure it'll last a few years. Usually one of these is a sign it'll last:

- some MIT class teaches how to use it
  - e.g. web.lab teaches React, 6.102 teaches Typescript
- it's tiny and used in only a small part of the app
  - e.g. msgpack is only used for URL encoding, nanoid is only used to make IDs
- it's a big, popular, well-documented project that's been around for several years
  - e.g. FullCalendar has been around since 2010, Chakra UI has a large community
