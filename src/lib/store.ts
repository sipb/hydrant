import type { Preferences, Save } from "./schema";
import type { DeflatedProgramState } from "./state";

export interface TermStore {
  saves: Save[];
  /** Array of class numbers that are starred */
  starredClasses: string[];
  /** Array of PE class numbers that are starred */
  starredPEClasses: string[];
  /** Array of program states that are saved */
  [saveId: string]: Save[] | string[] | DeflatedProgramState;
}

export interface GlobalStore {
  preferences: Preferences;
}

/** Generic storage. */
export class Store {
  /** The current term. */
  readonly term: string;

  constructor(term: string) {
    this.term = term;
  }

  /** Convert a key to a local storage key. */
  toKey(key: string, global: boolean): string {
    return global ? key : `${this.term}-${key}`;
  }

  /** Return the corresponding, term-specific saved value. */
  get<T extends keyof TermStore>(key: T): TermStore[T] | null {
    const result = localStorage.getItem(this.toKey(key.toString(), false));
    return result !== null ? JSON.parse(result) : null;
  }

  /** Return the corresponding global saved value. */
  globalGet<T extends keyof GlobalStore>(key: T): GlobalStore[T] | null {
    const result = localStorage.getItem(this.toKey(key, true));
    return result !== null ? JSON.parse(result) : null;
  }

  /** Set the corresponding term-specific value. */
  set<T extends keyof TermStore>(key: T, value: TermStore[T]): void {
    localStorage.setItem(
      this.toKey(key.toString(), false),
      JSON.stringify(value),
    );
  }

  /** Set the corresponding global saved value. */
  globalSet<T extends keyof GlobalStore>(key: T, value: GlobalStore[T]): void {
    localStorage.setItem(this.toKey(key, true), JSON.stringify(value));
  }
}
