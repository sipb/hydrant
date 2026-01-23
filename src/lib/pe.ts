import type { Activity } from "./activity";
import type { RawPEClass } from "./rawPEClass";
import type { Event } from "./activity";
import { fallbackColor, type ColorScheme } from "./colors";
import { TermCode } from "./rawClass";

export const QUARTERS: Record<number, TermCode> = {
  1: TermCode.FA,
  2: TermCode.FA,
  3: TermCode.SP,
  4: TermCode.SP,
  5: TermCode.JA,
};

/**
 * PE&W activity placeholder
 */
export class PEClass implements Activity {
  backgroundColor: string;
  manualColor = false;
  readonly rawClass: RawPEClass;

  constructor(rawClass: RawPEClass, colorScheme: ColorScheme) {
    this.rawClass = rawClass;
    this.backgroundColor = fallbackColor(colorScheme);
  }

  get id(): string {
    return this.rawClass.number;
  }

  /** Hours per week. */
  readonly hours = 2;

  get buttonName(): string {
    return this.rawClass.number;
  }

  get events(): Event[] {
    return [];
  }

  get start(): [number, number] {
    const startDate = new Date(this.rawClass.startDate);
    return [startDate.getMonth() + 1, startDate.getDate()];
  }

  get end(): [number, number] {
    const endDate = new Date(this.rawClass.endDate);
    return [endDate.getMonth() + 1, endDate.getDate()];
  }
}
