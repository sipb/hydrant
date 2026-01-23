import { type RawSection } from "./rawClass";

export interface RawPEClass {
  /** Class number; e.g., "PE.0612" */
  number: string;
  /** Class name; e.g., "Skate, Beginner" */
  name: string;

  /** Timeslots and locations for each section */
  sections: RawSection[];
  /** Raw (FireRoad format) section locations/times */
  rawSections: string[];
  /** Class size (for each section) */
  classSize: number;

  /** Start date, in ISO 8601 format */
  startDate: string;
  /** End date, in ISO 8601 format */
  endDate: string;

  /** PE points */
  points: number;
  /** Satisfies swim GIR */
  swimGIR: boolean;

  /** Prereqs, no specific format */
  prereqs: string;
  /** Equipment, no specific format */
  equipment: string;
  /** Fee, in dollars */
  fee: string;
  /** Description, no specific format */
  description: string;
  /** Quarter of class */
  quarter: number;
}
