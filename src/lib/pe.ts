import type { ActivityClass } from "./activity";
import type { RawPEClass } from "./rawPEClass";
import type { Event } from "./activity";
import { fallbackColor, type ColorScheme } from "./colors";

/**
 * PE&W activity placeholder
 */
export class PEClass implements ActivityClass {
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
