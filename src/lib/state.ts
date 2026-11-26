import { nanoid } from "nanoid";

import type {
  Timeslot,
  Activity,
  Section,
  SectionLockOption,
  Sections,
} from "./activity";
import { CustomActivity } from "./activity";
import { scheduleSlots } from "./calendarSlots";
import { Class } from "./class";
import { Term, getTerms } from "./dates";
import type { ColorScheme } from "./colors";
import { chooseColors, fallbackColor, getDefaultColorScheme } from "./colors";
import type { MeasurementSystem } from "./measurement";
import { getDefaultMeasurementSystem } from "./measurement";
import type { RawClass, RawPEClass, BuildingInfo } from "./raw";
import { Store } from "./store";
import { sum, urldecode, urlencode } from "./utils";
import type {
  DeflatedSave,
  HydrantState,
  Preferences,
  Save,
  SyncConflict,
  SyncConflictChoice,
  UntaggedSchedule,
} from "./schema";
import type { ScheduleContents, SyncScheduleOperation } from "./auth";
import {
  deleteSchedule,
  getFavoriteCourses,
  getSchedule,
  getSchedules,
  setFavoriteCourses,
  syncSchedule,
} from "./auth";
import {
  agentName,
  fromScheduleContents,
  isEmptyState,
  isoNow,
  notBefore,
  remoteName,
  termSuffix,
  toScheduleContents,
} from "./sync";
import { BANNER_LAST_CHANGED, DEFAULT_PREFERENCES } from "./schema";
import { PEClass } from "./pe";

/**
 * Global State object. Maintains global program state (selected classes,
 * schedule options selected, activities, etc.).
 */
export class State {
  /** Map from class number to Class object. */
  classes: Map<string, Class>;
  /** Map from class number to PEClass object. */
  peClasses: Map<string, PEClass>;
  /** Possible section choices. */
  options: Section[][] = [[]];
  /** Current number of schedule conflicts. */
  conflicts = 0;
  /** Browser-specific saved state. */
  store: Store;
  /** Stores unknown subjects */
  unknownSubjects = new Set<string>();

  // The following are React state, so should be private. Even if we pass the
  // State object to React components, they shouldn't be looking at these
  // directly; they should have it passed down to them as props from App.
  //
  // All of our program state is on this level as well; a user's schedule is
  // determined by the current term (which determines rawClasses and therefore
  // classes), plus the selected activities. So to save/load schedules, all we
  // need is to save/load selected activities.

  /** Activity whose description is being viewed. */
  private viewedActivity: Activity | undefined;
  /** Selected class activities. */
  private selectedClasses: Class[] = [];
  /** Selected PE and Wellness classes. */
  private selectedPEClasses: PEClass[] = [];
  /** Selected custom activities. */
  private selectedCustomActivities: CustomActivity[] = [];
  /** Selected schedule option; zero-indexed. */
  private selectedOption = 0;
  /** Currently loaded save slot, empty if none of them. */
  private saveId = "";
  /** Names of each save slot. */
  private saves: Save[] = [];
  /** Current preferences. */
  private preferences: Preferences = DEFAULT_PREFERENCES;
  /** Set of starred class numbers */
  private starredClasses = new Set<string>();
  /** Set of starred PE class numbers */
  private starredPEClasses = new Set<string>();
  /** Current access token */
  private accessToken?: string = undefined;
  /** Fireroad username of the current access token */
  private username?: string = undefined;
  /** Saves changed both here and on Fireroad, shown to the user in order */
  private syncConflicts: (SyncConflict & {
    remoteId: number;
    contents: ScheduleContents | "";
  })[] = [];
  /** Fireroad schedules from other clients, waiting for the user to pick a term */
  private untaggedSchedules: (UntaggedSchedule & {
    downloaded: string;
    contents: ScheduleContents;
  })[] = [];
  /** Debounce timers for syncing each save */
  private syncTimers = new Map<string, ReturnType<typeof setTimeout>>();
  /** Fireroad requests run one at a time, so files aren't created twice */
  private syncQueue: Promise<void> = Promise.resolve();

  /** React callback to update state. */
  callback: ((state: HydrantState) => void) | undefined;
  /** React callback to update fits schedule filter. */
  fitsScheduleCallback: (() => void) | undefined;

  constructor(
    rawClasses: Map<string, RawClass>,
    rawPEClasses: Record<number, Map<string, RawPEClass>>,
    /** A mapping from building numbers to BuildingInfo objects. */
    public readonly locations: Map<string, BuildingInfo>,
    /** The current term object. */
    public readonly term: Term,
    /** String representing last update time. */
    public readonly lastUpdated: string,
    /** The latest term's urlName. */
    public readonly latestUrlName: string,
  ) {
    this.classes = new Map();
    this.peClasses = new Map();
    this.store = new Store(term.toString());
    rawClasses.forEach((cls, number) => {
      this.classes.set(number, new Class(cls, this.colorScheme));
    });
    Object.entries(rawPEClasses).forEach(([quarter, map]) => {
      map.forEach((cls, number) => {
        this.peClasses.set(
          `Q${quarter}.${number}`,
          new PEClass(cls, this.colorScheme),
        );
      });
    });
    this.initState();
  }

  /** All activities. */
  get selectedActivities(): Activity[] {
    return [
      ...this.selectedClasses,
      ...this.selectedPEClasses,
      ...this.selectedCustomActivities,
    ];
  }

  /** The color scheme. */
  get colorScheme(): ColorScheme {
    if (this.preferences.colorScheme) {
      return this.preferences.colorScheme;
    }

    // If no color scheme is set, use the default one
    return getDefaultColorScheme();
  }

  /** The measurement system. */
  get measurementSystem(): MeasurementSystem {
    if (this.preferences.measurementSystem) {
      return this.preferences.measurementSystem;
    }

    // If no measurement system is set, use the default one
    return getDefaultMeasurementSystem();
  }

  /** The count of number of finals a student has. */
  get finalsCount(): number {
    return this.selectedClasses.filter((cls) => cls.flags.final).length;
  }

  //========================================================================
  // Activity handlers

  /** Set the current activity being viewed. */
  setViewedActivity(activity: Activity | undefined): void {
    this.viewedActivity = activity;
    this.updateState();
  }

  /** @returns True if activity is one of the currently selected activities. */
  isSelectedActivity(activity: Activity): boolean {
    return this.selectedActivities.some(
      (activity_) => activity_.id === activity.id,
    );
  }

  /**
   * Adds an activity, selects it, and updates.
   *
   * @param activity - Activity to be added. If null, creates a new CustomActivity
   *   and adds it.
   */
  addActivity(activity?: Activity): void {
    const toAdd = activity ?? new CustomActivity(this.colorScheme);
    this.setViewedActivity(toAdd);
    if (this.isSelectedActivity(toAdd)) return;
    if (toAdd instanceof Class) {
      this.selectedClasses.push(toAdd);
    }
    if (toAdd instanceof PEClass) {
      this.selectedPEClasses.push(toAdd);
    }
    if (toAdd instanceof CustomActivity) {
      this.selectedCustomActivities.push(toAdd);
    }
    this.updateActivities();
  }

  /** Remove an activity and update. */
  removeActivity(activity: Activity): void {
    if (!this.isSelectedActivity(activity)) return;
    if (activity instanceof Class) {
      this.selectedClasses = this.selectedClasses.filter(
        (activity_) => activity_.id !== activity.id,
      );
    } else if (activity instanceof PEClass) {
      this.selectedPEClasses = this.selectedPEClasses.filter(
        (activity_) => activity_.id !== activity.id,
      );
    } else {
      this.selectedCustomActivities = this.selectedCustomActivities.filter(
        (activity_) => activity_.id !== activity.id,
      );
      this.setViewedActivity(undefined);
    }
    this.updateActivities();
  }

  /** Add activity if it exists, remove if it doesn't. */
  toggleActivity(activity?: Activity): void {
    if (!activity) return;
    if (this.isSelectedActivity(activity)) {
      this.removeActivity(activity);
    } else {
      this.addActivity(activity);
    }
  }

  /** Set the background color of an activity, then update. */
  setBackgroundColor(activity: Activity, color?: string): void {
    activity.backgroundColor = color ?? fallbackColor(this.colorScheme);
    activity.manualColor = Boolean(color);
    this.updateActivities();
  }

  /** Lock a specific section of a class. */
  lockSection(secs: Sections, sec: SectionLockOption): void {
    secs.lockSection(sec);
    this.updateActivities();
  }

  //========================================================================
  // CustomActivity handlers

  /** Rename a given non-activity. */
  renameCustomActivity(customActivity: CustomActivity, name: string): void {
    const customActivity_ = this.selectedCustomActivities.find(
      (customActivity_) => customActivity_.id === customActivity.id,
    );

    if (!customActivity_) return;

    customActivity_.name = name;
    this.updateState();
  }

  /** Changes the room for a given custom activity. */
  relocateCustomActivity(
    customActivity: CustomActivity,
    room: string | undefined,
  ): void {
    const customActivity_ = this.selectedCustomActivities.find(
      (customActivity_) => customActivity_.id === customActivity.id,
    );

    if (!customActivity_) return;

    customActivity_.room = room;
    this.updateState();
  }

  /** Add the timeslot to currently viewed activity. */
  addTimeslot(customActivity: CustomActivity, slot: Timeslot): void {
    customActivity.addTimeslot(slot);
    this.updateActivities();
  }

  /** Remove all equal timeslots from currently viewed activity. */
  removeTimeslot(customActivity: CustomActivity, slot: Timeslot): void {
    customActivity.removeTimeslot(slot);
    this.updateActivities();
  }

  //========================================================================
  // State management

  /**
   * Update React state by calling React callback, and store state into
   * localStorage.
   */
  updateState(save = true): void {
    this.callback?.({
      selectedActivities: this.selectedActivities,
      viewedActivity: this.viewedActivity,
      selectedOption: this.selectedOption,
      totalOptions: this.options.length,
      units: sum(this.selectedClasses.map((cls) => cls.totalUnits)),
      hours: sum(this.selectedActivities.map((activity) => activity.hours)),
      warnings: Array.from(
        new Set([
          ...this.selectedActivities.flatMap((cls) =>
            "warnings" in cls ? cls.warnings.messages : [],
          ),
          ...(this.unknownSubjects.size > 0
            ? [
                `Unknown subjects: ${Array.from(this.unknownSubjects).join(", ")}`,
              ]
            : []),
        ]),
      ),
      saveId: this.saveId,
      saves: this.saves,
      preferences: this.preferences,
      syncConflict: this.syncConflicts[0],
      untaggedSchedules: this.untaggedSchedules,
    });
    if (save) {
      this.storeSave(this.saveId, false);
    }
  }

  /**
   * Change the current section of each class to match this.options[index].
   * If index does not exist, change it to this.options[0].
   */
  selectOption(index?: number): void {
    this.selectedOption = this.options[index ?? 0] ? (index ?? 0) : 0;
    for (const sec of this.options[this.selectedOption]) {
      sec.secs.selected = sec;
    }
    this.updateState(false);
  }

  /**
   * Update selected activities: reschedule them and assign colors. Call after
   * every update of this.selectedClasses, this.selectedPEClasses,
   * or this.selectedCustomActivities.
   */
  updateActivities(save = true): void {
    chooseColors(this.selectedActivities, this.colorScheme);
    const result = scheduleSlots(
      this.selectedClasses,
      this.selectedPEClasses,
      this.selectedCustomActivities,
    );
    this.options = result.options;
    this.conflicts = result.conflicts;
    this.selectOption();
    this.fitsScheduleCallback?.();
    if (save) this.storeSave(this.saveId);
  }

  /**
   * Does {@param cls} fit into current schedule without increasing conflicts?
   * Used for the "fits schedule" filter in ClassTable. Might be slow; careful
   * with using this too frequently.
   */
  fitsSchedule(cls: Class | PEClass): boolean {
    return (
      !this.isSelectedActivity(cls) &&
      (cls.sections.length === 0 ||
        (this.selectedClasses.length === 0 &&
          this.selectedPEClasses.length === 0 &&
          this.selectedCustomActivities.length === 0) ||
        scheduleSlots(
          this.selectedClasses.concat(cls instanceof Class ? [cls] : []),
          this.selectedPEClasses.concat(cls instanceof PEClass ? [cls] : []),
          this.selectedCustomActivities,
        ).conflicts === this.conflicts)
    );
  }

  /** Set the preferences. */
  setPreferences(preferences: Preferences, save = true): void {
    this.preferences = preferences;
    chooseColors(this.selectedActivities, this.colorScheme);
    this.updateState(save);
  }

  /** Star or unstar a class */
  toggleStarClass(cls: Class): void {
    if (this.starredClasses.has(cls.id)) {
      this.starredClasses.delete(cls.id);
    } else {
      this.starredClasses.add(cls.id);
    }
    const starredArray = Array.from(this.starredClasses);

    this.store.globalSet("starredClasses", starredArray);
    if (this.accessToken)
      void setFavoriteCourses(this.accessToken, starredArray);
    this.updateState();
  }

  /** Check if a class is starred */
  isClassStarred(cls: Class): boolean {
    return this.starredClasses.has(cls.id);
  }

  /** Get all starred classes */
  getStarredClasses(): Class[] {
    return Array.from(this.starredClasses)
      .map((id) => this.classes.get(id))
      .filter((cls): cls is Class => cls !== undefined);
  }

  /** Star or unstar a class */
  toggleStarPEClass(cls: PEClass): void {
    if (this.starredPEClasses.has(cls.id)) {
      this.starredPEClasses.delete(cls.id);
    } else {
      this.starredPEClasses.add(cls.id);
    }
    this.store.set("starredPEClasses", Array.from(this.starredPEClasses));
    this.updateState();
  }

  /** Check if a class is starred */
  isPEClassStarred(cls: PEClass): boolean {
    return this.starredPEClasses.has(cls.id);
  }

  /** Get all starred classes */
  getStarredPEClasses(): PEClass[] {
    return (
      Array.from(this.starredPEClasses)
        // also look up Q3 for backwards compatibility
        .map((id) => this.peClasses.get(id) ?? this.peClasses.get(`Q3.${id}`))
        .filter((cls): cls is PEClass => cls !== undefined)
    );
  }

  get showBanner(): boolean {
    return (
      this.preferences.showBanner ||
      this.preferences.showBannerChanged === undefined ||
      this.preferences.showBannerChanged < BANNER_LAST_CHANGED
    );
  }

  set showBanner(show: boolean) {
    this.preferences.showBanner = show;
    this.preferences.showBannerChanged =
      Temporal.Now.instant().epochMilliseconds;
    this.updateState();
  }

  /** Get latest quarter of PE classes */
  get latestQuarter(): number {
    const allQuarters = new Set<number>();
    this.peClasses.forEach((cls) => {
      const quarter = cls.rawClass.quarter;
      allQuarters.add(quarter);
    });

    // for 1 < 2 < 5 < 3 < 4
    const quarterOrder: Record<number, number> = {
      1: 0,
      2: 1,
      // 5 is iap for some reason :(
      5: 2,
      3: 3,
      4: 4,
    };

    const sortedQuarters = Array.from(allQuarters).sort((a, b) => {
      return quarterOrder[a] - quarterOrder[b];
    });

    return sortedQuarters[sortedQuarters.length - 1];
  }

  //========================================================================
  // Loading and saving

  /** Clear (almost) all program state. This doesn't clear class state. */
  reset(): void {
    this.selectedClasses = [];
    this.selectedPEClasses = [];
    this.selectedCustomActivities = [];
    this.selectedOption = 0;
  }

  /** Deflate program state to something JSONable. */
  deflate(): DeflatedSave {
    return [
      this.selectedClasses.map((cls) => cls.deflate()),
      this.selectedCustomActivities.length > 0
        ? this.selectedCustomActivities.map((customActivity) =>
            customActivity.deflate(),
          )
        : null,
      this.selectedOption,
      this.selectedPEClasses.map((cls) => cls.deflate()),
    ];
  }

  /** Parse all program state. */
  inflate(obj: DeflatedSave | null): void {
    if (!obj) return;
    this.reset();
    const [classes, customActivities, selectedOption, peClasses] = obj;
    for (const deflated of classes) {
      const subject = typeof deflated === "string" ? deflated : deflated[0];
      const cls = this.classes.get(subject);
      // if we can't find the class, add it to unknownSubjects so we can show a warning
      if (!cls) {
        this.unknownSubjects.add(subject);
        continue;
      }

      cls.inflate(deflated);
      this.selectedClasses.push(cls);
    }
    if (customActivities) {
      for (const deflated of customActivities) {
        const customActivity = new CustomActivity(this.colorScheme);
        customActivity.inflate(deflated);
        this.selectedCustomActivities.push(customActivity);
      }
    }
    this.selectedOption = selectedOption ?? 0;
    for (const deflated of peClasses ?? []) {
      const subject = typeof deflated === "string" ? deflated : deflated[0];
      // also look up Q3 for backwards compatibility
      const cls =
        this.peClasses.get(subject) ?? this.peClasses.get(`Q3.${subject}`);
      // if we can't find the class, add it to unknownSubjects so we can show a warning
      if (!cls) {
        this.unknownSubjects.add(subject);
        continue;
      }

      cls.inflate(deflated);
      this.selectedPEClasses.push(cls);
    }
    this.saveId = "";
    this.updateActivities(false);
  }

  /** Attempt to load from a slot. Return whether it succeeds. */
  loadSave(id: string): void {
    // if we loaded from a url, clear the ?s= first
    const url = new URL(window.location.href);
    if (url.searchParams.has("s")) {
      url.searchParams.delete("s");
      window.history.pushState({}, "", url);
    }
    const storage = this.storedSave(id);
    if (!storage) return;
    this.inflate(storage);
    this.saveId = id;
    this.updateState(false);
  }

  /** Store state as a save in localStorage, and store save metadata. */
  storeSave(id?: string, update = true): void {
    if (id) {
      const deflated = this.deflate();
      if (JSON.stringify(deflated) !== JSON.stringify(this.storedSave(id))) {
        this.store.set(id, deflated);
        this.markChanged(id);
      }
    }
    this.store.set("saves", this.saves);
    this.store.globalSet("preferences", this.preferences);
    if (update) {
      this.updateState(false);
    }
  }

  /** Add a new save. If reset, then make the new save blank. */
  addSave(
    reset: boolean,
    name = `Schedule ${(this.saves.length + 1).toString()}`,
  ): void {
    const id = nanoid(8);
    this.saveId = id;
    this.saves.push({ id, name });
    if (reset) this.reset();
    this.storeSave(id);
  }

  /** Rename a given save. */
  renameSave(id: string, name: string): void {
    const save = this.findSave(id);
    if (!save || !name) return;
    save.name = name;
    this.markChanged(id);
    this.storeSave();
  }

  /** Remove the given slot.  */
  removeSave(id: string): void {
    const removed = this.findSave(id);
    if (removed) this.deleteRemote(removed);
    this.saves = this.saves.filter((save) => save.id !== id);
    if (this.saves.length === 0) {
      this.addSave(true);
    }
    if (id === this.saveId) {
      this.loadSave(this.saves[0].id);
    }
    this.storeSave();
  }

  /** Return a URL that can be opened to recover the state. */
  urlify(): string {
    const encoded = urlencode(this.deflate());
    const url = new URL(window.location.href);
    url.searchParams.set("s", encoded);
    return url.href;
  }

  /** Set a schedule as the default schedule */
  set defaultSchedule(id: string | null) {
    this.preferences = {
      ...this.preferences,
      defaultScheduleId: id,
    };
    this.updateState();
  }

  /** Get the current default schedule id */
  get defaultSchedule(): string | null {
    return this.preferences.defaultScheduleId;
  }

  /** Initialize the state from either the URL, default schedule, or first schedule. */
  initState(): void {
    const preferences = this.store.globalGet("preferences");
    if (preferences) {
      this.preferences = preferences;
    }
    const url = new URL(window.location.href);
    const save = url.searchParams.get("s");
    const saves = this.store.get("saves");
    if (saves) {
      this.saves = saves;
    }
    if (!this.saves.length) {
      this.saves = [];
      this.addSave(true);
    }
    if (save) {
      this.inflate(urldecode(save) as DeflatedSave);
    } else {
      // Try to load default schedule if set, otherwise load first save
      const defaultScheduleId = this.preferences.defaultScheduleId;
      if (
        defaultScheduleId &&
        this.saves.some((save) => save.id === defaultScheduleId)
      ) {
        this.loadSave(defaultScheduleId);
      } else {
        this.loadSave(this.saves[0].id);
      }
    }
    // Load starred classes from storage
    this.starredClasses = new Set(this.store.globalGet("starredClasses"));

    // backwards compatibility, change from term store to global store
    const storedStarredTerm = this.store.get("starredClasses") as
      string[] | null;
    if (storedStarredTerm) {
      storedStarredTerm.forEach((cls) => this.starredClasses.add(cls));
      this.store.globalSet("starredClasses", Array.from(this.starredClasses));
      this.store.delete("starredClasses");
    }
  }

  loadAccessToken(token?: string, username?: string): void {
    if (token === this.accessToken) {
      return;
    }

    this.accessToken = token;
    this.username = username;
    this.syncTimers.forEach((_, id) => {
      this.cancelSync(id);
    });
    this.syncConflicts = [];
    this.untaggedSchedules = [];

    if (token && username) {
      // pull schedules from other devices, then push everything here
      this.enqueueSync(async () => {
        await this.pullSaves(token, username);
        this.saves.forEach((save) => {
          this.enqueueSync(() => this.syncSave(save.id));
        });
      });
    }

    if (token) {
      // user signed in, merge remote favorites with local ones
      getFavoriteCourses(token)
        .then(async (favoriteCourses) => {
          favoriteCourses.forEach((cls) => this.starredClasses.add(cls));

          const starredArray = Array.from(this.starredClasses);
          this.store.globalSet("starredClasses", starredArray);
          this.updateState(false);

          // push stars made while signed out back up to fireroad
          if (starredArray.length > favoriteCourses.length) {
            await setFavoriteCourses(token, starredArray);
          }
        })
        .catch((err: unknown) => {
          console.error("Failed to sync favorite courses:", err);
        });
    }
    // on sign out, keep local favorites but don't sync anything
  }

  //========================================================================
  // Fireroad schedule sync

  /** Name of this device on Fireroad, so other devices can tell it apart. */
  private get syncAgent(): string {
    let agent = this.store.globalGet("syncAgent");
    if (!agent) {
      agent = agentName(navigator.userAgent, nanoid(4));
      this.store.globalSet("syncAgent", agent);
    }
    return agent;
  }

  /**
   * A name not used by any other save, adding "(2)", "(3)", etc. if needed.
   * Fireroad names must be unique, and this term's names match local ones.
   */
  private uniqueSaveName(name: string, save?: Save): string {
    const taken = new Set(
      this.saves.filter((other) => other !== save).map((other) => other.name),
    );
    const base = name.replace(/ \(\d+\)$/, "");
    let unique = name;
    for (let i = 2; taken.has(unique); i++) {
      unique = `${base} (${i.toString()})`;
    }
    return unique;
  }

  private storedSave(id: string): DeflatedSave | null {
    return this.store.get(id) as DeflatedSave | null;
  }

  private findSave(id: string): Save | undefined {
    return this.saves.find((save) => save.id === id);
  }

  /** Add a save with contents from Fireroad, returning its id. */
  private addRemoteSave(
    name: string,
    contents: ScheduleContents,
    changed?: string,
    remote?: Save["remote"],
  ): string {
    const id = nanoid(8);
    this.saves.push({ id, name, changed, remote });
    this.store.set(id, fromScheduleContents(contents, this.classes));
    return id;
  }

  /** Fireroad copy of a save, if it belongs to the signed in user. */
  private remoteOf(save: Save): Save["remote"] {
    return save.remote && save.remote.user === this.username
      ? save.remote
      : undefined;
  }

  /** Run a Fireroad operation after all previous ones finish. */
  private enqueueSync(op: () => Promise<void>): void {
    this.syncQueue = this.syncQueue.then(op).catch((err: unknown) => {
      console.error("Failed to sync schedules with Fireroad:", err);
    });
  }

  /** Send a sync operation from this device to Fireroad. */
  private sendSync(token: string, op: Omit<SyncScheduleOperation, "agent">) {
    return syncSchedule(token, {
      ...op,
      changed: notBefore(op.changed, op.downloaded),
      agent: this.syncAgent,
    });
  }

  /** Cancel a pending debounced sync of a save. */
  private cancelSync(id: string): void {
    clearTimeout(this.syncTimers.get(id));
    this.syncTimers.delete(id);
  }

  private dropConflicts(saveId: string): void {
    this.syncConflicts = this.syncConflicts.filter(
      (conflict) => conflict.saveId !== saveId,
    );
  }

  /** Record that a save changed locally, and sync it soon. */
  private markChanged(id: string): void {
    const save = this.findSave(id);
    if (!save) return;
    save.changed = isoNow();

    if (!this.accessToken) return;
    this.cancelSync(id);
    this.syncTimers.set(
      id,
      setTimeout(() => {
        this.syncTimers.delete(id);
        this.enqueueSync(() => this.syncSave(id));
      }, SYNC_DELAY),
    );
  }

  /** Delete the Fireroad copy of a save that is being removed. */
  private deleteRemote(save: Save): void {
    this.cancelSync(save.id);
    this.dropConflicts(save.id);

    const token = this.accessToken;
    const remote = this.remoteOf(save);
    if (!token || !remote) return;
    this.enqueueSync(() => deleteSchedule(token, remote.id));
  }

  /** Add Fireroad schedules for this term that aren't on this device yet. */
  private async pullSaves(token: string, username: string): Promise<void> {
    const files = await getSchedules(token);
    const known = new Set(
      this.saves.flatMap((save) => {
        const remote = this.remoteOf(save);
        return remote ? [remote.id] : [];
      }),
    );
    // if this device only has blank schedules, replace them
    const blankIds = this.saves.every(
      (save) => !this.remoteOf(save) && isEmptyState(this.storedSave(save.id)),
    )
      ? new Set(this.saves.map((save) => save.id))
      : new Set<string>();

    const skipped = new Set(this.store.globalGet("syncSkipped")?.[username]);
    const ownSuffix = termSuffix(this.term);
    const otherTermSuffixes = getTerms(this.latestUrlName)
      .filter((term) => term.urlName !== this.term.urlName)
      .map(termSuffix);

    let added = false;
    this.untaggedSchedules = [];
    for (const [key, summary] of Object.entries(files)) {
      const remoteId = parseInt(key, 10);
      if (known.has(remoteId) || skipped.has(remoteId)) continue;
      // other terms' schedules are pulled when that term is opened
      if (
        !summary.name.endsWith(ownSuffix) &&
        otherTermSuffixes.some((suffix) => summary.name.endsWith(suffix))
      ) {
        continue;
      }

      const file = await getSchedule(token, remoteId);
      const hydrant = file.contents.hydrant;
      if (!hydrant) {
        this.untaggedSchedules.push({
          remoteId,
          name: file.name,
          changed: file.changed,
          subjects: file.contents.selectedSubjects.map((s) => s.subject_id),
          downloaded: file.downloaded,
          contents: file.contents,
        });
        continue;
      }
      if (hydrant.term !== this.term.urlName) continue;

      this.addRemoteSave(hydrant.name, file.contents, file.changed, {
        id: remoteId,
        user: username,
        downloaded: file.downloaded,
      });
      added = true;
    }

    if (added && blankIds.size > 0) {
      this.saves = this.saves.filter((save) => !blankIds.has(save.id));
      blankIds.forEach((id) => {
        this.store.delete(id);
      });
    }
    this.storeSave();
    if (added && blankIds.has(this.saveId)) this.loadSave(this.saves[0].id);
  }

  /**
   * Tag untagged schedules with the chosen terms, or `null` to never import
   * them. Schedules without a choice are asked about again next login.
   */
  importUntaggedSchedules(choices: Record<number, string | null>): void {
    const token = this.accessToken;
    const username = this.username;
    if (!token || !username) return;

    const chosen = this.untaggedSchedules.filter(
      (file) => file.remoteId in choices,
    );
    this.untaggedSchedules = this.untaggedSchedules.filter(
      (file) => !(file.remoteId in choices),
    );

    const skippedIds = chosen
      .filter((file) => choices[file.remoteId] === null)
      .map((file) => file.remoteId);
    if (skippedIds.length > 0) {
      const skipped = this.store.globalGet("syncSkipped") ?? {};
      skipped[username] = [...(skipped[username] ?? []), ...skippedIds];
      this.store.globalSet("syncSkipped", skipped);
    }

    chosen.forEach((file) => {
      const term = choices[file.remoteId];
      if (term) {
        this.enqueueSync(() => this.tagSchedule(token, username, file, term));
      }
    });
    this.updateState(false);
  }

  /** Close the untagged schedules dialog until next login. */
  dismissUntaggedSchedules(): void {
    this.untaggedSchedules = [];
    this.updateState(false);
  }

  /** Save a term into an untagged Fireroad schedule, adding it if it's this term. */
  private async tagSchedule(
    token: string,
    username: string,
    file: State["untaggedSchedules"][number],
    term: string,
  ): Promise<void> {
    const result = await this.sendSync(token, {
      id: file.remoteId,
      name: remoteName(file.name, new Term({ urlName: term })),
      contents: { ...file.contents, hydrant: { term, name: file.name } },
      changed: isoNow(),
      downloaded: file.downloaded,
    });
    // anything else means it changed elsewhere since download; ask next login
    if (result.result !== "update_remote") return;
    if (term !== this.term.urlName || username !== this.username) return;

    const id = this.addRemoteSave(
      this.uniqueSaveName(file.name),
      file.contents,
      result.changed,
      { id: file.remoteId, user: username, downloaded: result.changed },
    );
    // push the full Hydrant state, and the new name if it had to change
    this.markChanged(id);
    this.storeSave();
  }

  /** Sync one save with Fireroad, creating the Fireroad copy if needed. */
  private async syncSave(id: string, override = false): Promise<void> {
    const token = this.accessToken;
    const username = this.username;
    const save = this.findSave(id);
    const state = this.storedSave(id);
    if (!token || !username || !save || !state) return;

    const remote = this.remoteOf(save);
    // don't clutter Fireroad with blank schedules that were never synced
    if (!remote && isEmptyState(state)) return;

    if (!remote) save.name = this.uniqueSaveName(save.name, save);

    const result = await this.sendSync(token, {
      id: remote?.id,
      name: remoteName(save.name, this.term),
      contents: toScheduleContents(
        state,
        this.term.urlName,
        save.name,
        this.classes,
      ),
      changed: save.changed ?? isoNow(),
      downloaded: remote?.downloaded,
      override,
    });

    if (!this.saves.includes(save) || username !== this.username) {
      // removed or signed out while syncing, so undo any new Fireroad file
      if (result.result === "update_remote" && result.id !== undefined) {
        await deleteSchedule(token, result.id);
      }
      return;
    }

    switch (result.result) {
      case "no_change":
      case "update_remote": {
        const remoteId =
          result.result === "update_remote" && result.id !== undefined
            ? result.id
            : remote?.id;
        if (remoteId === undefined) return;
        save.remote = {
          id: remoteId,
          user: username,
          downloaded: result.changed,
        };
        this.storeSave();
        break;
      }
      case "update_local":
        this.applyRemote(save, result.contents, result.changed, {
          id: result.id,
          user: username,
          downloaded: result.downloaded,
        });
        break;
      case "conflict":
        if (!remote) return;
        this.dropConflicts(save.id);
        this.syncConflicts.push({
          saveId: save.id,
          saveName: save.name,
          otherAgent: result.other_agent,
          otherDate: result.other_date,
          deleted: result.other_contents === "",
          remoteId: remote.id,
          contents: result.other_contents,
        });
        this.updateState(false);
        break;
    }
  }

  /** Replace a save with its Fireroad copy. */
  private applyRemote(
    save: Save,
    contents: ScheduleContents,
    changed: string,
    remote: NonNullable<Save["remote"]>,
  ): void {
    save.name = contents.hydrant?.name ?? save.name;
    save.changed = changed;
    save.remote = remote;
    this.store.set(save.id, fromScheduleContents(contents, this.classes));
    this.storeSave();
    if (save.id === this.saveId) this.loadSave(save.id);
  }

  /**
   * Resolve the first sync conflict, keeping this copy, Fireroad's copy, or
   * both (with Fireroad's copy as a new save).
   */
  resolveSyncConflict(keep: SyncConflictChoice): void {
    const conflict = this.syncConflicts.shift();
    const save = conflict && this.findSave(conflict.saveId);
    if (!conflict || !save || !this.username) {
      this.updateState(false);
      return;
    }

    if (keep === "both" && conflict.contents !== "") {
      const id = this.addRemoteSave(
        this.uniqueSaveName(conflict.contents.hydrant?.name ?? save.name),
        conflict.contents,
      );
      this.markChanged(id);
    }

    if (keep !== "remote") {
      this.enqueueSync(() => this.syncSave(save.id, true));
      this.storeSave();
    } else if (conflict.contents === "") {
      // deleted on Fireroad, so delete it here too
      save.remote = undefined;
      this.removeSave(save.id);
    } else {
      this.applyRemote(save, conflict.contents, conflict.otherDate, {
        id: conflict.remoteId,
        user: this.username,
        downloaded: conflict.otherDate,
      });
    }
  }
}

/** How long to wait after the last change before syncing a save, in ms. */
const SYNC_DELAY = 2000;
