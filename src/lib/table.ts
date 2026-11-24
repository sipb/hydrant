import {
  ModuleRegistry,
  ClientSideRowModelModule,
  ValidationModule,
  ExternalFilterModule,
  RenderApiModule,
  CellStyleModule,
  RowStyleModule,
  themeQuartz,
  type Module,
  type CellKeyDownEvent,
  type FullWidthCellKeyDownEvent,
} from "ag-grid-community";

export const HYDRANT_THEME = themeQuartz.withParams({
  accentColor: "var(--chakra-colors-hydrant-solid)",
  backgroundColor: "var(--chakra-colors-bg-panel)",
  borderColor: "var(--chakra-colors-border)",
  browserColorScheme: "inherit",
  fontFamily: "inherit",
  foregroundColor: "var(--chakra-colors-fg)",
  headerBackgroundColor: "var(--chakra-colors-bg-subtle)",
  headerTextColor: "var(--chakra-colors-fg-muted)",
  rowHoverColor: "var(--chakra-colors-color-palette-subtle)",
  wrapperBorderRadius: "var(--chakra-radii-l2)",
});

const GRID_MODULES: Module[] = [
  ClientSideRowModelModule,
  ExternalFilterModule,
  CellStyleModule,
  RenderApiModule,
  RowStyleModule,
  ...(import.meta.env.DEV ? [ValidationModule] : []),
];

ModuleRegistry.registerModules(GRID_MODULES);

export const INITIAL_SORT = "asc" as const;
const SORTING_ORDER: ("asc" | "desc")[] = ["asc", "desc"];

export const sortProps = {
  sortable: true,
  unSortIcon: true,
  sortingOrder: SORTING_ORDER,
};

/**
 * enter to look at the class (single click), shift+enter to
 * toggle the class (double click)
 */
export function onRowKeyDown<T extends { class: unknown }>(
  e: CellKeyDownEvent<T> | FullWidthCellKeyDownEvent<T>,
  view: (cls: T["class"]) => void,
  toggle: (cls: T["class"]) => void,
) {
  const { event } = e;

  if (!(event instanceof KeyboardEvent) || event.key !== "Enter" || !e.data) {
    return;
  }
  if (event.target instanceof Element && event.target.closest("button")) {
    return;
  }

  event.preventDefault();
  if (event.shiftKey) {
    toggle(e.data.class);
  } else {
    view(e.data.class);
  }
}
