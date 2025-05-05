import type { State } from "./state";

declare global {
  interface Window {
    hydrant?: State;
  }
}
