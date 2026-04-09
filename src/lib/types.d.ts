import type { State as GlobalState } from "./state";
import type { State } from "./hydrant";

declare global {
  interface Window {
    State?: State;
    hydrantState?: GlobalState;
  }
}
