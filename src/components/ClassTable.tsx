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
  themeQuartz,
  type IRowNode,
  type ColDef,
  type Module,
} from "ag-grid-community";

import {
  Box,
  Flex,
  Image,
  Input,
  Button,
  ButtonGroup,
  InputGroup,
} from "@chakra-ui/react";
import { LuPlus, LuMinus, LuSearch, LuStar } from "react-icons/lu";
import { LabelledButton } from "./ui/button";
import { useColorModeValue } from "./ui/color-mode";

import type { Class, Flags } from "../lib/class";
import { DARK_IMAGES, getFlagImg } from "../lib/class";
import { classNumberMatch, classSort, simplifyString } from "../lib/utils";
import type { TSemester } from "../lib/dates";
import "./ClassTable.scss";
import { HydrantContext } from "../lib/hydrant";
import type { State } from "../lib/state";

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
  RenderApiModule,
  ...(import.meta.env.DEV ? [ValidationModule] : []),
];

ModuleRegistry.registerModules(GRID_MODULES);

enum ColorEnum {
  Muted = "ag-cell-muted-text",
  Success = "ag-cell-success-text",
  Warning = "ag-cell-warning-text",
  Error = "ag-cell-error-text",
  Normal = "ag-cell-normal-text",
}

const getRatingColor = (rating?: string | null) => {
  if (!rating || rating === "N/A") return ColorEnum.Muted;
  const ratingNumber = Number(rating);
  if (ratingNumber >= 6) return ColorEnum.Success;
  if (ratingNumber >= 5) return ColorEnum.Warning;
  return ColorEnum.Error;
};

const getHoursColor = (
  hours: string | null | undefined,
  totalUnits: number | undefined,
  term: TSemester,
  half: number | undefined,
) => {
  if (!hours || hours === "N/A") return ColorEnum.Muted;
  if (totalUnits === undefined) return ColorEnum.Muted;
  if (totalUnits === 0) return ColorEnum.Normal;

  const hoursNumber = Number(hours);
  let weeksInTerm = 0;

  switch (term) {
    case "s":
      weeksInTerm = 14;
      break;
    case "f":
      weeksInTerm = 14;
      break;
    case "m":
      weeksInTerm = 10;
      break;
    case "i":
      weeksInTerm = 4;
      break;
  }

  // https://registrar.mit.edu/registration-academics/academic-requirements/subject-levels-credit
  const expectedHours = totalUnits * (weeksInTerm / 14) * (half ? 2 : 1);
  const proportion = hoursNumber / expectedHours;

  if (proportion < 0.8) return ColorEnum.Success;
  if (proportion >= 0.8 && proportion <= 1.2) return ColorEnum.Warning;
  return ColorEnum.Error;
};

/** A single row in the class table. */
interface ClassTableRow {
  number: string;
  rating: string;
  hours: string;
  name: string;
  class: Class;
  inCharge: string;
}

type ClassFilter = (cls?: Class) => boolean;
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

  // Search results for classes.
  const searchResults = useRef<
    {
      numbers: string[];
      name: string;
      class: Class;
    }[]
  >(undefined);

  const processedRows = useMemo(
    () =>
      rowData.map((data) => {
        const numbers = [data.number];
        const [, otherNumber, realName] =
          /^\[(.*)\] (.*)$/.exec(data.name) ?? [];
        if (otherNumber) numbers.push(otherNumber);
        return {
          numbers,
          name: simplifyString(realName || data.name),
          class: data.class,
          inCharge: simplifyString(data.inCharge),
        };
      }),
    [rowData],
  );

  const onClassInputChange = (input: string) => {
    if (input) {
      const simplifyInput = simplifyString(input);
      searchResults.current = processedRows.filter(
        (row) =>
          row.numbers.some((number) => classNumberMatch(input, number)) ||
          row.name.includes(simplifyInput) ||
          row.inCharge.includes(simplifyInput),
      );
      const index = new Set(searchResults.current.map((cls) => cls.numbers[0]));
      setInputFilter(() => (cls?: Class) => index.has(cls?.number ?? ""));
    } else {
      setInputFilter(null);
    }
    setClassInput(input);
  };

  const onEnter = () => {
    const { numbers, class: cls } = searchResults.current?.[0] ?? {};
    if (
      searchResults.current?.length === 1 ||
      numbers?.some((number) => classNumberMatch(number, classInput, true))
    ) {
      // first check if the first result matches
      state.toggleActivity(cls);
      onClassInputChange("");
    } else if (state.classes.has(classInput)) {
      // else check if this number exists exactly
      const cls = state.classes.get(classInput);
      state.toggleActivity(cls);
    }
  };

  return (
    <Flex justify="center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onEnter();
        }}
        style={{ width: "100%", maxWidth: "30em" }}
      >
        <InputGroup startElement={<LuSearch />} width="fill-available">
          <Input
            type="search"
            aria-label="Search for a class"
            id="class-search"
            placeholder="Class number, name, or instructor"
            value={classInput}
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
  starred: (state, cls) => state.isClassStarred(cls),
  new: (_, cls) => cls.new,
} satisfies Record<string, (state: State, cls: Class) => boolean>;

type Filter = keyof Flags | keyof typeof filtersNonFlags;
type FilterGroup = [Filter, string, ReactNode?][];

/** List of top filter IDs and their displayed names. */
const CLASS_FLAGS_1: FilterGroup = [
  ["starred", "Starred", <LuStar fill="currentColor" />],
  ["hass", "HASS"],
  ["cih", "CI-H"],
  ["cim", "CI-M"],
  ["fits", "Fits schedule"],
  ["new", "✨ New!"],
];

/** List of hidden filter IDs, their displayed names, and image path, if any. */
const CLASS_FLAGS_2: FilterGroup = [
  ["nofinal", "No final"],
  ["nopreq", "No prereq"],
  ["under", "Undergrad", getFlagImg("under")],
  ["grad", "Graduate", getFlagImg("grad")],
];

/** Second row of hidden filter IDs. */
const CLASS_FLAGS_3: FilterGroup = [
  ["le9units", "≤ 9 units"],
  ["half", "Half-term"],
  ["limited", "Limited enrollment"],
];

/** Third row of hidden filter IDs. */
const CLASS_FLAGS_4: FilterGroup = [
  ["rest", "REST", getFlagImg("rest")],
  ["lab", "Institute Lab", getFlagImg("lab")],
  ["hassA", "HASS-A", getFlagImg("hassA")],
  ["hassH", "HASS-H", getFlagImg("hassH")],
  ["hassS", "HASS-S", getFlagImg("hassS")],
  ["cihw", "CI-HW"],
  ["notcih", "Not CI-H"],
];

const CLASS_FLAGS = [
  ...CLASS_FLAGS_1,
  ...CLASS_FLAGS_2,
  ...CLASS_FLAGS_3,
  ...CLASS_FLAGS_4,
];

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
    setFlagsFilter(() => (cls?: Class) => {
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

  const filter = useColorModeValue(
    (_flags: keyof Flags) => "",
    (flag: keyof Flags) => (DARK_IMAGES.includes(flag) ? "invert()" : ""),
  );

  const renderGroup = (group: FilterGroup) => {
    return (
      <ButtonGroup attached colorPalette="orange" wrap="wrap">
        {group.map(([flag, label, image]) => {
          const checked = flags.get(flag);

          // hide starred button if no classes starred
          if (
            flag === "starred" &&
            state.getStarredClasses().length === 0 &&
            !checked
          ) {
            return null;
          }

          return image ? (
            typeof image === "string" ? (
              // if image is a string, it's a path to an image
              <LabelledButton
                key={flag}
                onClick={() => {
                  onChange(flag, !checked);
                }}
                title={label}
                variant={checked ? "solid" : "outline"}
              >
                <Image
                  src={image}
                  alt={label}
                  filter={filter(flag as keyof Flags)}
                />
              </LabelledButton>
            ) : (
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
            )
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
      {allFlags && (
        <>
          {renderGroup(CLASS_FLAGS_2)}
          {renderGroup(CLASS_FLAGS_3)}
          {renderGroup(CLASS_FLAGS_4)}
        </>
      )}
    </Flex>
  );
}

const StarButton = ({
  cls,
  onStarToggle,
}: {
  cls: Class;
  onStarToggle?: () => void;
}) => {
  const { state } = useContext(HydrantContext);
  const isStarred = state.isClassStarred(cls);

  return (
    <Button
      onClick={(e) => {
        e.stopPropagation();
        state.toggleStarClass(cls);
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
export function ClassTable() {
  const { state } = useContext(HydrantContext);
  const { classes } = state;

  const gridRef = useRef<AgGridReact<ClassTableRow>>(null);

  // Setup table columns
  const columnDefs: ColDef<ClassTableRow, string>[] = useMemo(() => {
    const initialSort = "asc" as const;
    const sortingOrder: ("asc" | "desc")[] = ["asc", "desc"];
    const sortProps = { sortable: true, unSortIcon: true, sortingOrder };
    const numberSortProps = {
      // sort by number, N/A is infinity, tiebreak with class number
      comparator: (
        valueA: string | undefined | null,
        valueB: string | undefined | null,
        nodeA: IRowNode<ClassTableRow>,
        nodeB: IRowNode<ClassTableRow>,
      ) => {
        if (!nodeA.data || !nodeB.data) return 0;
        const numberA = valueA === "N/A" || !valueA ? Infinity : Number(valueA);
        const numberB = valueB === "N/A" || !valueB ? Infinity : Number(valueB);
        return numberA !== numberB
          ? numberA - numberB
          : classSort(nodeA.data.number, nodeB.data.number);
      },
      ...sortProps,
    };
    return [
      {
        headerName: "",
        field: "number",
        maxWidth: 49,
        cellRenderer: (params: { value: string; data: ClassTableRow }) => (
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
        ...sortProps,
      },
      {
        field: "rating",
        maxWidth: 99,
        cellClass: (params) => getRatingColor(params.value),
        ...numberSortProps,
      },
      {
        field: "hours",
        maxWidth: 97,
        cellClass: (params) =>
          getHoursColor(
            params.value,
            params.data?.class.totalUnits,
            state.term.semester,
            params.data?.class.half,
          ),
        ...numberSortProps,
      },
      {
        field: "name",
        sortable: false,
        flex: 1,
        valueFormatter: (params) =>
          `${params.data?.class.new ? "✨ " : ""}${params.value ?? ""}`,
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
      Array.from(classes.values(), (cls) => ({
        number: cls.number,
        rating: cls.evals.rating.slice(0, 3), // remove the "/7.0" if exists
        hours: cls.evals.hours,
        name: cls.name,
        class: cls,
        inCharge: cls.description.inCharge,
      })),
    [classes],
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
