import { State } from "./State";

declare global {
  interface Window {
    hydrant?: State;
  }
}
