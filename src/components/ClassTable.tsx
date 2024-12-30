import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  type IRowNode,
  type ColDef,
} from "ag-grid-community";
import { Box, Group, Flex, Image, Input } from "@chakra-ui/react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { LuPlus, LuMinus, LuSearch } from "react-icons/lu";

import { InputGroup } from "./ui/input-group";
import { Button, LabelledButton } from "./ui/button";
import { useColorMode } from "./ui/color-mode";

import { Class, DARK_IMAGES, Flags, getFlagImg } from "../lib/class";
import { classNumberMatch, classSort, simplifyString } from "../lib/utils";
import { State } from "../lib/state";
import { TSemester } from "../lib/dates";
import "./ClassTable.scss";

const hydrantTheme = themeQuartz.withParams({
  accentColor: "var(--chakra-colors-fg)",
  backgroundColor: "var(--chakra-colors-bg)",
  borderColor: "var(--chakra-colors-border)",
  browserColorScheme: "inherit",
  fontFamily: "inherit",
  foregroundColor: "var(--chakra-colors-fg)",
  headerBackgroundColor: "var(--chakra-colors-bg-subtle)",
  rowHoverColor: "var(--chakra-colors-color-palette-subtle)",
  wrapperBorderRadius: "var(--chakra-radii-l2)",
});

ModuleRegistry.registerModules([AllCommunityModule]);

const getRatingColor = (rating?: string | null) => {
  if (!rating || rating === "N/A") return "muted";
  const ratingNumber = Number(rating);
  if (ratingNumber >= 6) return "success";
  if (ratingNumber >= 5) return "warning";
  return "error";
};

const getHoursColor = (
  hours: string | null | undefined,
  totalUnits: number | undefined,
  term: TSemester,
  half: number | undefined,
) => {
  if (!hours || hours === "N/A") return "-muted";
  if (totalUnits === undefined) return "-muted";
  if (totalUnits === 0) return "";

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

  if (proportion < 0.8) return "-success";
  if (proportion >= 0.8 && proportion <= 1.2) return "-warning";
  return "-error";
};

/** A single row in the class table. */
type ClassTableRow = {
  number: string;
  rating: string;
  hours: string;
  name: string;
  class: Class;
  inCharge: string;
};

type ClassFilter = (cls?: Class) => boolean;
/** Type of filter on class list; null if no filter. */
type SetClassFilter = React.Dispatch<React.SetStateAction<ClassFilter | null>>;

/**
 * Textbox for typing in the name or number of the class to search. Maintains
 * the {@link ClassFilter} that searches for a class name/number.
 */
function ClassInput(props: {
  /** All rows in the class table. */
  rowData: Array<ClassTableRow>;
  /** Callback for updating the class filter. */
  setInputFilter: SetClassFilter;
  state: State;
}) {
  const { rowData, setInputFilter, state } = props;

  // State for textbox input.
  const [classInput, setClassInput] = useState("");

  // Search results for classes.
  const searchResults = useRef<
    Array<{
      numbers: Array<string>;
      name: string;
      class: Class;
    }>
  >();

  const processedRows = useMemo(
    () =>
      rowData.map((data) => {
        const numbers = [data.number];
        const [, otherNumber, realName] =
          data.name.match(/^\[(.*)\] (.*)$/) ?? [];
        if (otherNumber) numbers.push(otherNumber);
        return {
          numbers,
          name: simplifyString(realName ?? data.name),
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
            type="text"
            aria-label="Search for a class"
            id="class-search"
            placeholder="Class number, name, or instructor"
            value={classInput}
            onChange={(e) => onClassInputChange(e.target.value)}
          />
        </InputGroup>
      </form>
    </Flex>
  );
}

type FilterGroup = Array<[keyof Flags | "fits", string, string?]>;

/** List of top filter IDs and their displayed names. */
const CLASS_FLAGS_1: FilterGroup = [
  ["hass", "HASS"],
  ["cih", "CI-H"],
  ["fits", "Fits schedule"],
  ["nofinal", "No final"],
  ["nopreq", "No prereq"],
];

/** List of hidden filter IDs, their displayed names, and image path, if any. */
const CLASS_FLAGS_2: FilterGroup = [
  ["under", "Undergrad", getFlagImg("under")],
  ["grad", "Graduate", getFlagImg("grad")],
  ["le9units", "≤ 9 units"],
  ["half", "Half-term"],
  ["limited", "Limited enrollment"],
];

/** Second row of hidden filter IDs. */
const CLASS_FLAGS_3: FilterGroup = [
  ["rest", "REST", getFlagImg("rest")],
  ["Lab", "Institute Lab", getFlagImg("Lab")],
  ["hassA", "HASS-A", getFlagImg("hassA")],
  ["hassH", "HASS-H", getFlagImg("hassH")],
  ["hassS", "HASS-S", getFlagImg("hassS")],
  ["cihw", "CI-HW"],
  ["notcih", "Not CI-H"],
];

const CLASS_FLAGS = CLASS_FLAGS_1.concat(CLASS_FLAGS_2).concat(CLASS_FLAGS_3);

/** Div containing all the flags like "HASS". Maintains the flag filter. */
function ClassFlags(props: {
  /** Callback for updating the class filter. */
  setFlagsFilter: SetClassFilter;
  state: State;
  /** Callback for updating the grid filter manually. */
  updateFilter: () => void;
}) {
  const { setFlagsFilter, state, updateFilter } = props;

  // Map from flag to whether it's on.
  const [flags, setFlags] = useState<Map<keyof Flags | "fits", boolean>>(() => {
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
    state.fitsScheduleCallback = () => flags.get("fits") && updateFilter();
  }, [state, flags, updateFilter]);

  const onChange = (flag: keyof Flags | "fits", value: boolean) => {
    const newFlags = new Map(flags);
    newFlags.set(flag, value);
    setFlags(newFlags);

    // careful! we have to wrap it with a () => because otherwise React will
    // think it's an updater function instead of the actual function.
    setFlagsFilter(() => (cls?: Class) => {
      if (!cls) return false;
      let result = true;
      newFlags.forEach((value, flag) => {
        if (value && flag === "fits" && !state.fitsSchedule(cls)) {
          result = false;
        } else if (value && flag !== "fits" && !cls.flags[flag]) {
          result = false;
        }
      });
      return result;
    });
  };

  const { colorMode } = useColorMode();

  const renderGroup = (group: FilterGroup) => {
    return (
      <Group attached colorPalette="orange" wrap="wrap">
        {group.map(([flag, label, image]) => {
          const checked = flags.get(flag);
          return image ? (
            <LabelledButton
              key={flag}
              onClick={() => onChange(flag, !checked)}
              title={label}
              variant={checked ? "solid" : "outline"}
              portalled
            >
              <Image
                src={image}
                alt={label}
                filter={
                  colorMode === "dark" && DARK_IMAGES.includes(flag ?? "")
                    ? "invert()"
                    : ""
                }
              />
            </LabelledButton>
          ) : (
            <Button
              key={flag}
              onClick={() => onChange(flag, !checked)}
              variant={checked ? "solid" : "outline"}
            >
              {label}
            </Button>
          );
        })}
      </Group>
    );
  };

  return (
    <Flex direction="column" align="center" gap={2}>
      <Flex align="center">
        {renderGroup(CLASS_FLAGS_1)}
        <Button onClick={() => setAllFlags(!allFlags)} size="sm" ml={2}>
          {" "}
          {allFlags ? <LuMinus /> : <LuPlus />}
          {allFlags ? "Less filters" : "More filters"}
        </Button>
      </Flex>
      {allFlags && (
        <>
          {renderGroup(CLASS_FLAGS_2)}
          {renderGroup(CLASS_FLAGS_3)}
        </>
      )}
    </Flex>
  );
}

/** The table of all classes, along with searching and filtering with flags. */
export function ClassTable(props: {
  classes: Map<string, Class>;
  state: State;
}) {
  const { classes, state } = props;
  const gridRef = useRef<AgGridReact>(null);

  // Setup table columns
  const columnDefs: ColDef<ClassTableRow, string>[] = useMemo(() => {
    const initialSort = "asc" as const;
    const sortingOrder: Array<"asc" | "desc"> = ["asc", "desc"];
    const sortProps = { sortable: true, unSortIcon: true, sortingOrder };
    const numberSortProps = {
      maxWidth: 100,
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
        field: "number",
        resizable: false,
        headerName: "Class",
        comparator: classSort,
        initialSort,
        maxWidth: 100,
        ...sortProps,
      },
      {
        field: "rating",
        resizable: false,
        cellStyle: (params) => {
          const ratingColor = getRatingColor(params.value);
          return {
            color: `var(--chakra-colors-fg-${ratingColor})`,
          };
        },
        ...numberSortProps,
      },
      {
        field: "hours",
        resizable: false,
        cellStyle: (params) => {
          const hoursColor = getHoursColor(
            params.value,
            params.data?.class.totalUnits,
            state.term.semester,
            params.data?.class.half,
          );
          return {
            color: `var(--chakra-colors-fg${hoursColor})`,
          };
        },
        ...numberSortProps,
      },
      { field: "name", resizable: false, sortable: false, flex: 1 },
    ];
  }, [state.term.semester]);

  // Setup rows
  const rowData = useMemo(() => {
    const rows: Array<ClassTableRow> = [];
    classes.forEach((cls) => {
      const { number, evals, name, description } = cls;
      rows.push({
        number: number,
        rating: evals.rating.slice(0, 3), // remove the "/7.0" if exists
        hours: evals.hours,
        name: name,
        class: cls,
        inCharge: description.inCharge,
      });
    });
    return rows;
  }, [classes]);

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
    gridRef.current?.api?.onFilterChanged();
  }, [doesExternalFilterPass]);

  return (
    <Flex direction="column" gap={4}>
      <ClassInput
        rowData={rowData}
        setInputFilter={setInputFilter}
        state={state}
      />
      <ClassFlags
        setFlagsFilter={setFlagsFilter}
        state={state}
        updateFilter={() => gridRef.current?.api?.onFilterChanged()}
      />
      <Box style={{ height: "320px", width: "100%" }}>
        <AgGridReact<ClassTableRow>
          theme={hydrantTheme}
          ref={gridRef}
          columnDefs={columnDefs}
          rowData={rowData}
          suppressMovableColumns={true}
          enableCellTextSelection={true}
          isExternalFilterPresent={() => true}
          doesExternalFilterPass={doesExternalFilterPass}
          onRowClicked={(e) => state.setViewedActivity(e.data?.class)}
          onRowDoubleClicked={(e) => state.toggleActivity(e.data?.class)}
          onGridReady={() => gridRef.current?.api?.autoSizeAllColumns()}
          // these have to be set here, not in css:
          headerHeight={40}
          rowHeight={40}
        />
      </Box>
    </Flex>
  );
}
