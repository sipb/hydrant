import { nanoid } from "nanoid";

import type { Timeslot, Activity } from "./activity";
import { NonClass } from "./activity";
import { scheduleSlots } from "./calendarSlots";
import type { Section, SectionLockOption, Sections } from "./class";
import { Class } from "./class";
import type { Term } from "./dates";
import type { ColorScheme } from "./colors";
import { chooseColors, COLOR_SCHEME_DARK, COLOR_SCHEME_LIGHT, fallbackColor } from "./colors";
import type { RawClass, RawTimeslot } from "./rawClass";
import { Store } from "./store";
import { sum, urldecode, urlencode } from "./utils";
import type { HydrantState, Preferences, Save } from "./schema";
import { DEFAULT_PREFERENCES } from "./schema";

/**
 * Global State object. Maintains global program state (selected classes,
 * schedule options selected, activities, etc.).
 */
export class State {
  /** Map from class number to Class object. */
  classes: Map<string, Class>;
  /** Possible section choices. */
  options: Section[][] = [[]];
  /** Current number of schedule conflicts. */
  conflicts = 0;
  /** Browser-specific saved state. */
  store: Store;

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
  /** Selected non-class activities. */
  private selectedNonClasses: NonClass[] = [];
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

  /** React callback to update state. */
  callback: ((state: HydrantState) => void) | undefined;
  /** React callback to update fits schedule filter. */
  fitsScheduleCallback: (() => void) | undefined;

  constructor(
    rawClasses: Map<string, RawClass>,
    /** The current term object. */
    public readonly term: Term,
    /** String representing last update time. */
    public readonly lastUpdated: string,
    /** The latest term's urlName. */
    public readonly latestUrlName: string,
  ) {
    this.classes = new Map();
    this.store = new Store(term.toString());
    rawClasses.forEach((cls, number) => {
      this.classes.set(number, new Class(cls, this.colorScheme));
    });
    this.initState();
  }

  /** All activities. */
  get selectedActivities(): Activity[] {
    return [...this.selectedClasses, ...this.selectedNonClasses];
  }

  /** The color scheme. */
  get colorScheme(): ColorScheme {

    if (this.preferences.colorScheme) {
      return this.preferences.colorScheme;
    }

    // If no color scheme is set, use the default one
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return COLOR_SCHEME_DARK;
    } else {
      return COLOR_SCHEME_LIGHT;
    }
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
   * @param activity - Activity to be added. If null, creates a new NonClass
   *   and adds it.
   */
  addActivity(activity?: Activity): void {
    const toAdd = activity ?? new NonClass(this.colorScheme);
    this.setViewedActivity(toAdd);
    if (this.isSelectedActivity(toAdd)) return;
    if (toAdd instanceof Class) {
      this.selectedClasses.push(toAdd);
    } else {
      this.selectedNonClasses.push(toAdd);
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
    } else {
      this.selectedNonClasses = this.selectedNonClasses.filter(
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
  // NonClass handlers

  /** Rename a given non-activity. */
  renameNonClass(nonClass: NonClass, name: string): void {
    const nonClass_ = this.selectedNonClasses.find(
      (nonClass_) => nonClass_.id === nonClass.id,
    );

    if (!nonClass_) return;

    nonClass_.name = name;
    this.updateState();
  }

  /** Changes the room for a given non-class. */
  relocateNonClass(nonClass: NonClass, room: string | undefined): void {
    const nonClass_ = this.selectedNonClasses.find(
      (nonClass_) => nonClass_.id === nonClass.id,
    );

    if (!nonClass_) return;

    nonClass_.room = room;
    this.updateState();
  }

  /** Add the timeslot to currently viewed activity. */
  addTimeslot(nonClass: NonClass, slot: Timeslot): void {
    nonClass.addTimeslot(slot);
    this.updateActivities();
  }

  /** Remove all equal timeslots from currently viewed activity. */
  removeTimeslot(nonClass: NonClass, slot: Timeslot): void {
    nonClass.removeTimeslot(slot);
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
        new Set(this.selectedClasses.flatMap((cls) => cls.warnings.messages)),
      ),
      saveId: this.saveId,
      saves: this.saves,
      preferences: this.preferences,
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
   * every update of this.selectedClasses or this.selectedActivities.
   */
  updateActivities(save = true): void {
    chooseColors(this.selectedActivities, this.colorScheme);
    const result = scheduleSlots(this.selectedClasses, this.selectedNonClasses);
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
  fitsSchedule(cls: Class): boolean {
    return (
      !this.isSelectedActivity(cls) &&
      (cls.sections.length === 0 ||
        (this.selectedClasses.length === 0 &&
          this.selectedNonClasses.length === 0) ||
        scheduleSlots(
          this.selectedClasses.concat([cls]),
          this.selectedNonClasses,
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
    if (this.starredClasses.has(cls.number)) {
      this.starredClasses.delete(cls.number);
    } else {
      this.starredClasses.add(cls.number);
    }
    this.store.set("starredClasses", Array.from(this.starredClasses));
    this.updateState();
  }

  /** Check if a class is starred */
  isClassStarred(cls: Class): boolean {
    return this.starredClasses.has(cls.number);
  }

  /** Get all starred classes */
  getStarredClasses(): Class[] {
    return Array.from(this.starredClasses)
      .map((number) => this.classes.get(number))
      .filter((cls): cls is Class => cls !== undefined);
  }

  get showFeedback(): boolean {
    return this.preferences.showFeedback;
  }

  set showFeedback(show: boolean) {
    this.preferences.showFeedback = show;
    this.updateState();
  }

  //========================================================================
  // Loading and saving

  /** Clear (almost) all program state. This doesn't clear class state. */
  reset(): void {
    this.selectedClasses = [];
    this.selectedNonClasses = [];
    this.selectedOption = 0;
  }

  /** Deflate program state to something JSONable. */
  deflate() {
    return [
      this.selectedClasses.map((cls) => cls.deflate()),
      this.selectedNonClasses.length > 0
        ? this.selectedNonClasses.map((nonClass) => nonClass.deflate())
        : null,
      this.selectedOption,
    ];
  }

  /** Parse all program state. */
  inflate(
    obj:
      | (
        | number
        | (string | number | string[])[][]
        | (string | RawTimeslot[])[][]
        | null
      )[]
      | null,
  ): void {
    if (!obj) return;
    this.reset();
    const [classes, nonClasses, selectedOption] = obj as [
      (string | number | string[])[][],
      (string | RawTimeslot[])[][] | null,
      number | undefined,
    ];
    for (const deflated of classes) {
      const cls =
        typeof deflated === "string"
          ? this.classes.get(deflated)
          : this.classes.get((deflated as string[])[0]);
      if (!cls) continue;
      cls.inflate(deflated);
      this.selectedClasses.push(cls);
    }
    if (nonClasses) {
      for (const deflated of nonClasses) {
        const nonClass = new NonClass(this.colorScheme);
        nonClass.inflate(deflated);
        this.selectedNonClasses.push(nonClass);
      }
    }
    this.selectedOption = selectedOption ?? 0;
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
    const storage = this.store.get(id);
    if (!storage) return;
    this.inflate(storage as Parameters<State["inflate"]>[0]);
    this.saveId = id;
    this.updateState(false);
  }

  /** Store state as a save in localStorage, and store save metadata. */
  storeSave(id?: string, update = true): void {
    if (id) {
      this.store.set(id, this.deflate());
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
    const save = this.saves.find((save) => save.id === id);
    if (!save || !name) return;
    save.name = name;
    this.storeSave();
  }

  /** Remove the given slot.  */
  removeSave(id: string): void {
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
      this.inflate(urldecode(save) as Parameters<State["inflate"]>[0]);
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
    const storedStarred = this.store.get("starredClasses");
    if (storedStarred) {
      this.starredClasses = new Set(storedStarred);
    }
  }
}
