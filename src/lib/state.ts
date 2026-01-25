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
import type { Term } from "./dates";
import type { ColorScheme } from "./colors";
import { chooseColors, fallbackColor, getDefaultColorScheme } from "./colors";
import type { RawClass, RawTimeslot, RawPEClass } from "./raw";
import { Store } from "./store";
import { sum, urldecode, urlencode } from "./utils";
import type { HydrantState, Preferences, Save } from "./schema";
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

  /** React callback to update state. */
  callback: ((state: HydrantState) => void) | undefined;
  /** React callback to update fits schedule filter. */
  fitsScheduleCallback: (() => void) | undefined;

  constructor(
    rawClasses: Map<string, RawClass>,
    rawPEClasses: Record<number, Map<string, RawPEClass>>,
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
    Object.values(rawPEClasses).forEach((map) => {
      map.forEach((cls, number) => {
        this.peClasses.set(number, new PEClass(cls, this.colorScheme));
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
        new Set(
          this.selectedActivities.flatMap((cls) =>
            "warnings" in cls ? cls.warnings.messages : [],
          ),
        ),
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
    this.store.set("starredClasses", Array.from(this.starredClasses));
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
    return Array.from(this.starredPEClasses)
      .map((id) => this.peClasses.get(id))
      .filter((cls): cls is PEClass => cls !== undefined);
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
    this.preferences.showBannerChanged = new Date().valueOf();
    this.updateState();
  }

  //========================================================================
  // Loading and saving

  /** Clear (almost) all program state. This doesn't clear class state. */
  reset(): void {
    this.selectedClasses = [];
    this.selectedCustomActivities = [];
    this.selectedOption = 0;
  }

  /** Deflate program state to something JSONable. */
  deflate() {
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
    const [classes, customActivities, selectedOption, peClasses] = obj as [
      (string | number | string[])[][],
      (string | RawTimeslot[])[][] | null,
      number | undefined,
      (string | number | string[])[][] | undefined, // undefined for backwards compatability
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
    if (customActivities) {
      for (const deflated of customActivities) {
        const customActivity = new CustomActivity(this.colorScheme);
        customActivity.inflate(deflated);
        this.selectedCustomActivities.push(customActivity);
      }
    }
    this.selectedOption = selectedOption ?? 0;
    for (const deflated of peClasses ?? []) {
      const cls =
        typeof deflated === "string"
          ? this.peClasses.get(deflated)
          : this.peClasses.get((deflated as string[])[0]);
      if (!cls) continue;
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
