// TODO factor out common pieces between ClassTable and PEClassTable
import {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  ClientSideRowModelModule,
  ValidationModule,
  ExternalFilterModule,
  RenderApiModule,
  CellStyleModule,
  RowStyleModule,
  themeQuartz,
  type IRowNode,
  type ColDef,
  type Module,
} from "ag-grid-community";

import {
  Box,
  Flex,
  Input,
  Button,
  ButtonGroup,
  InputGroup,
  CloseButton,
} from "@chakra-ui/react";
import { LuPlus, LuMinus, LuSearch, LuStar } from "react-icons/lu";

import { type PEFlags, type PEClass, getPEFlagEmoji } from "../lib/pe";
import { classNumberMatch, classSort, simplifyString } from "../lib/utils";
import { HydrantContext } from "../lib/hydrant";
import type { State } from "../lib/state";

import tableClasses from "./ClassTable.module.css";
import colorClasses from "../lib/colors.module.css";

const hydrantTheme = themeQuartz.withParams({
  accentColor: "var(--chakra-colors-fg)",
  backgroundColor: "var(--chakra-colors-bg)",
  borderColor: "var(--chakra-colors-border)",
  browserColorScheme: "inherit",
  fontFamily: "inherit",
  foregroundColor: "var(--chakra-colors-fg)",
  headerBackgroundColor: "var(--chakra-colors-bg-subtle)",
  rowHoverColor: "var(--chakra-colors-color-palette-subtle)",
  wrapperBorderRadius: "var(--chakra-radii-md)",
});

const GRID_MODULES: Module[] = [
  ClientSideRowModelModule,
  ExternalFilterModule,
  CellStyleModule,
  RowStyleModule,
  RenderApiModule,
  ...(import.meta.env.DEV ? [ValidationModule] : []),
];

ModuleRegistry.registerModules(GRID_MODULES);

const COLORS = {
  Muted: colorClasses.muted,
  Success: colorClasses.success,
  Warning: colorClasses.warning,
  Error: colorClasses.error,
  Normal: colorClasses.normal,
} as const;

const getFeeColor = (fee: number) => {
  if (isNaN(fee)) return COLORS.Muted;
  if (fee == 0) return COLORS.Success;
  if (fee <= 20) return COLORS.Warning;
  return COLORS.Error;
};

/** A single row in the class table. */
interface ClassTableRow {
  number: string;
  classSize: number;
  fee: number;
  name: string;
  class: PEClass;
}

type ClassFilter = (cls?: PEClass) => boolean;
/** Type of filter on class list; null if no filter. */
type SetClassFilter = Dispatch<SetStateAction<ClassFilter | null>>;

/**
 * Textbox for typing in the name or number of the class to search. Maintains
 * the {@link ClassFilter} that searches for a class name/number.
 */
function ClassInput(props: {
  /** All rows in the class table. */
  rowData: ClassTableRow[];
  /** Callback for updating the class filter. */
  setInputFilter: SetClassFilter;
}) {
  const { rowData, setInputFilter } = props;
  const { state } = useContext(HydrantContext);

  // State for textbox input.
  const [classInput, setClassInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Search results for classes.
  const searchResults = useRef<
    {
      number: string;
      name: string;
      class: PEClass;
    }[]
  >(undefined);

  const processedRows = useMemo(
    () =>
      rowData.map((data) => {
        return {
          number: data.number,
          name: simplifyString(data.name),
          class: data.class,
        };
      }),
    [rowData],
  );

  const onClassInputChange = (input: string) => {
    if (input) {
      const simplifyInput = simplifyString(input);
      searchResults.current = processedRows.filter(
        (row) =>
          classNumberMatch(input, row.number) ||
          row.name.includes(simplifyInput),
      );
      const index = new Set(searchResults.current.map((row) => row.number));
      setInputFilter(
        () => (cls?: PEClass) => index.has(cls?.rawClass.number ?? ""),
      );
    } else {
      setInputFilter(null);
    }
    setClassInput(input);
  };

  const onEnter = () => {
    const { number, class: cls } = searchResults.current?.[0] ?? {};
    if (
      searchResults.current?.length === 1 ||
      (number && classNumberMatch(number, classInput, true))
    ) {
      // first check if the first result matches
      state.toggleActivity(cls);
      onClassInputChange("");
    } else if (state.peClasses.has(classInput)) {
      // else check if this number exists exactly
      const cls = state.peClasses.get(classInput);
      state.toggleActivity(cls);
    }
  };

  const clearButton = classInput ? (
    <CloseButton
      size="xs"
      onClick={() => {
        onClassInputChange("");
        inputRef.current?.focus();
      }}
      me="-2"
    />
  ) : undefined;

  return (
    <Flex justify="center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onEnter();
        }}
        style={{ width: "100%", maxWidth: "30em" }}
      >
        <InputGroup
          startElement={<LuSearch />}
          endElement={clearButton}
          width="fill-available"
        >
          <Input
            type="search"
            aria-label="Search for a class"
            id="class-search"
            placeholder="Class number or name"
            value={classInput}
            ref={inputRef}
            onChange={(e) => {
              onClassInputChange(e.target.value);
            }}
          />
        </InputGroup>
      </form>
    </Flex>
  );
}

const filtersNonFlags = {
  fits: (state, cls) => state.fitsSchedule(cls),
  starred: (state, cls) => state.isPEClassStarred(cls),
} satisfies Record<string, (state: State, cls: PEClass) => boolean>;

type Filter = keyof PEFlags | keyof typeof filtersNonFlags;
type FilterGroup = [Filter, string, ReactNode?][];

/** List of top filter IDs and their displayed names. */
const CLASS_FLAGS_1: FilterGroup = [
  ["starred", "Starred", <LuStar fill="currentColor" />],
  ["nofee", "No fee"],
  ["nopreq", "No prereq"],
  ["fits", "Fits schedule"],
];

/** List of hidden filter IDs, their displayed names, and image path, if any. */
const CLASS_FLAGS_2: FilterGroup = [
  ["wellness", "🔮 Wellness Wizard"],
  ["pirate", "🏴‍☠️ Pirate Certificate"],
  ["swim", "🌊 Swim GIR"],
];

const CLASS_FLAGS = [...CLASS_FLAGS_1, ...CLASS_FLAGS_2];

/** Div containing all the flags like "HASS". Maintains the flag filter. */
function ClassFlags(props: {
  /** Callback for updating the class filter. */
  setFlagsFilter: SetClassFilter;
  /** Callback for updating the grid filter manually. */
  updateFilter: () => void;
}) {
  const { setFlagsFilter, updateFilter } = props;
  const { state } = useContext(HydrantContext);

  // Map from flag to whether it's on.
  const [flags, setFlags] = useState<Map<Filter, boolean>>(() => {
    const result = new Map();
    for (const flag of CLASS_FLAGS) {
      result.set(flag, false);
    }
    return result;
  });

  // Show hidden flags?
  const [allFlags, setAllFlags] = useState(false);

  // this callback needs to get called when the set of classes change, because
  // the filter has to change as well
  useEffect(() => {
    state.fitsScheduleCallback = () => {
      if (flags.get("fits")) {
        updateFilter();
      }
    };
  }, [state, flags, updateFilter]);

  const onChange = (flag: Filter, value: boolean) => {
    const newFlags = new Map(flags);
    newFlags.set(flag, value);
    setFlags(newFlags);

    // careful! we have to wrap it with a () => because otherwise React will
    // think it's an updater function instead of the actual function.
    setFlagsFilter(() => (cls?: PEClass) => {
      if (!cls) return false;
      let result = true;
      newFlags.forEach((value, flag) => {
        if (
          value &&
          flag in filtersNonFlags &&
          !filtersNonFlags[flag as keyof typeof filtersNonFlags](state, cls)
        ) {
          result = false;
        } else if (
          value &&
          !(flag in filtersNonFlags) &&
          !cls.flags[flag as keyof typeof cls.flags]
        ) {
          result = false;
        }
      });
      return result;
    });
  };

  const renderGroup = (group: FilterGroup) => {
    return (
      <ButtonGroup attached colorPalette="orange" wrap="wrap">
        {group.map(([flag, label, image]) => {
          const checked = flags.get(flag);

          // hide starred button if no classes starred
          if (
            flag === "starred" &&
            state.getStarredPEClasses().length === 0 &&
            !checked
          ) {
            return null;
          }

          return image ? (
            // image is a react element, like an icon
            <Button
              key={flag}
              onClick={() => {
                onChange(flag, !checked);
              }}
              aria-label={label}
              variant={checked ? "solid" : "outline"}
            >
              {image}
            </Button>
          ) : (
            <Button
              key={flag}
              onClick={() => {
                onChange(flag, !checked);
              }}
              variant={checked ? "solid" : "outline"}
            >
              {label}
            </Button>
          );
        })}
      </ButtonGroup>
    );
  };

  return (
    <Flex direction="column" align="center" gap={2}>
      <Flex align="center">
        {renderGroup(CLASS_FLAGS_1)}
        <Button
          onClick={() => {
            setAllFlags(!allFlags);
          }}
          size="sm"
          ml={2}
        >
          {allFlags ? <LuMinus /> : <LuPlus />}
          {allFlags ? "Less filters" : "More filters"}
        </Button>
      </Flex>
      {allFlags && <>{renderGroup(CLASS_FLAGS_2)}</>}
    </Flex>
  );
}

const StarButton = ({
  cls,
  onStarToggle,
}: {
  cls: PEClass;
  onStarToggle?: () => void;
}) => {
  const { state } = useContext(HydrantContext);
  const isStarred = state.isPEClassStarred(cls);

  return (
    <Button
      onClick={(e) => {
        e.stopPropagation();
        state.toggleStarPEClass(cls);
        onStarToggle?.();
      }}
      variant="plain"
      size="sm"
      aria-label={isStarred ? "Unstar class" : "Star class"}
    >
      <LuStar fill={isStarred ? "currentColor" : "none"} />
    </Button>
  );
};

/** The table of all classes, along with searching and filtering with flags. */
export function PEClassTable() {
  const { state } = useContext(HydrantContext);
  const { peClasses } = state;

  const gridRef = useRef<AgGridReact<ClassTableRow>>(null);

  // Setup table columns
  const columnDefs: ColDef<ClassTableRow, string | number>[] = useMemo(() => {
    const initialSort = "asc" as const;
    const sortingOrder: ("asc" | "desc")[] = ["asc", "desc"];
    const sortProps = { sortable: true, unSortIcon: true, sortingOrder };
    return [
      {
        headerName: "",
        field: "number",
        maxWidth: 49,
        cellRenderer: (params: { data: ClassTableRow }) => (
          <StarButton
            cls={params.data.class}
            onStarToggle={() => {
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              gridRef.current?.api?.refreshCells({
                force: true,
                columns: ["number"],
              });
            }}
          />
        ),
        sortable: false,
        cellStyle: { padding: 0 },
      },
      {
        field: "number",
        headerName: "Class",
        comparator: classSort,
        initialSort,
        maxWidth: 93,
        cellClass: tableClasses["underline-on-hover"],
        ...sortProps,
      },
      {
        field: "classSize",
        headerName: "Size",
        maxWidth: 85,
        ...sortProps,
      },
      {
        field: "fee",
        maxWidth: 87,
        cellClass: (params) => getFeeColor(params.value as number),
        valueFormatter: (params) => "$" + (params.value as number).toFixed(2),
        ...sortProps,
      },
      {
        field: "name",
        sortable: false,
        flex: 1,
        valueFormatter: (params) =>
          Object.entries(params.data?.class.flags ?? ({} as PEFlags))
            .filter(([_, val]) => val)
            .map(([flag]) => getPEFlagEmoji(flag as keyof PEFlags))
            .concat([params.value?.toString() ?? ""])
            .join(" "),
      },
    ];
  }, [state]);

  const defaultColDef: ColDef<ClassTableRow, string> = useMemo(() => {
    return {
      resizable: false,
    };
  }, []);

  // Setup rows
  const rowData: ClassTableRow[] = useMemo(
    () =>
      Array.from(peClasses.values(), (cls) => ({
        number: cls.rawClass.number,
        classSize: cls.rawClass.classSize,
        fee: cls.fee,
        name: cls.rawClass.name,
        class: cls,
        // TODO figure out if we get PE instructor names
      })),
    [peClasses],
  );

  const [inputFilter, setInputFilter] = useState<ClassFilter | null>(null);
  const [flagsFilter, setFlagsFilter] = useState<ClassFilter | null>(null);

  const doesExternalFilterPass = useMemo(() => {
    return (node: IRowNode<ClassTableRow>) => {
      if (inputFilter && !inputFilter(node.data?.class)) return false;
      if (flagsFilter && !flagsFilter(node.data?.class)) return false;
      return true;
    };
  }, [inputFilter, flagsFilter]);

  // Need to notify grid every time we update the filter
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    gridRef.current?.api?.onFilterChanged();
  }, [doesExternalFilterPass]);

  return (
    <Flex direction="column" gap={4}>
      <ClassInput rowData={rowData} setInputFilter={setInputFilter} />
      <ClassFlags
        setFlagsFilter={setFlagsFilter}
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        updateFilter={() => gridRef.current?.api?.onFilterChanged()}
      />
      <Box style={{ height: "320px", width: "100%", overflow: "auto" }}>
        <AgGridReact<ClassTableRow>
          theme={hydrantTheme}
          ref={gridRef}
          rowClass={tableClasses.row}
          defaultColDef={defaultColDef}
          columnDefs={columnDefs}
          rowData={rowData}
          suppressMovableColumns={true}
          enableCellTextSelection={true}
          isExternalFilterPresent={() => true}
          doesExternalFilterPass={doesExternalFilterPass}
          onRowClicked={(e) => {
            state.setViewedActivity(e.data?.class);
          }}
          onRowDoubleClicked={(e) => {
            state.toggleActivity(e.data?.class);
          }}
          // these have to be set here, not in css:
          headerHeight={40}
          rowHeight={40}
        />
      </Box>
    </Flex>
  );
}
