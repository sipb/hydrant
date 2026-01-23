import { redirect } from "react-router";

import { fetchNoCache, type SemesterData, getStateMaps } from "../lib/hydrant";
import { getClosestUrlName, Term, type LatestTermInfo } from "../lib/dates";
import { State } from "../lib/state";
import { Class } from "../lib/class";

import type { Route } from "./+types/export";

/**
 * "Integration callbacks" allow other SIPB projects to integrate with Hydrant by redirecting to
 * https://hydrant.mit.edu/#/export with a `callback` as a query parameter.
 *
 * Currently, the only application that uses this is the Matrix class group chat picker,
 * but in the future, a prompt "[Application name] would like to access your Hydrant class list"
 * could be implemented.
 */
const ALLOWED_INTEGRATION_CALLBACKS = [
  "https://matrix.mit.edu/classes/hydrantCallback",
  "https://uplink.mit.edu/classes/hydrantCallback",
];

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const searchParams = new URL(request.url).searchParams;
  const currentTerm = searchParams.get("t");
  const callback = searchParams.get("callback");

  const latestTerm = await fetchNoCache<LatestTermInfo>("/latestTerm.json");
  const { urlName } = getClosestUrlName(
    currentTerm,
    latestTerm.semester.urlName,
  );

  const term = urlName === latestTerm.semester.urlName ? "latest" : urlName;

  const { classes, lastUpdated, termInfo, pe } =
    await fetchNoCache<SemesterData>(`/${term}.json`);
  const { classesMap, peClassesMap } = getStateMaps(classes, pe);

  const hydrantObj = new State(
    classesMap,
    peClassesMap,
    new Term(termInfo),
    lastUpdated,
    latestTerm.semester.urlName,
  );

  if (!callback || !ALLOWED_INTEGRATION_CALLBACKS.includes(callback)) {
    console.warn("callback", callback, "not in allowed callbacks list!");
    window.alert(`${callback ?? ""} is not allowed to read your class list!`);

    return redirect("/");
  }

  const encodedClasses = hydrantObj.selectedActivities
    .filter((activity) => activity instanceof Class)
    .map((cls) => `&class=${cls.number}`)
    .join("");
  const filledCallback = `${callback}?hydrant=true${encodedClasses}`;
  return redirect(filledCallback);
}
