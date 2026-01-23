import type { ActivityClass } from "./activity";
import type { RawPEClass } from "./rawPEClass";
import type { Event } from "./activity";

/**
 * PE&W activity placeholder
 */
export class PEandWellness implements ActivityClass {
  id: string;
  backgroundColor: string;
  manualColor = false;
  readonly rawClass: RawPEClass;

  constructor(id: string, backgroundColor: string, rawClass: RawPEClass) {
    this.id = id;
    this.backgroundColor = backgroundColor;
    this.rawClass = rawClass;
  }

  /** Hours per week. */
  readonly hours = 2;

  get buttonName(): string {
    return this.rawClass.name;
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
