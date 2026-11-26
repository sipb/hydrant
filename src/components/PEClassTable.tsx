import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import type { IRowNode, ColDef } from "ag-grid-community";

import {
  Box,
  Flex,
  Button,
  ButtonGroup,
  useBreakpointValue,
} from "@chakra-ui/react";
import { type CustomCellRendererProps } from "ag-grid-react";
import { AgGridReact } from "ag-grid-react";
import { LuStar } from "react-icons/lu";

import type { State } from "../lib/state";

import { ColorStyles } from "../lib/colors";
import { useHydrantContext } from "../lib/hydrant";
import { type PEFlags, type PEClass, getPEFlagIcon } from "../lib/pe";
import {
  HYDRANT_THEME,
  INITIAL_SORT,
  onRowKeyDown,
  sortProps,
} from "../lib/table";
import { classNumberMatch, classSort, simplifyString } from "../lib/utils";
import { ClassSearchInput } from "./ClassTable";
import { LabelledButton } from "./ui/button";

import styles from "./ClassTable.module.css";

const getFeeColor = (fee?: string | number | null) => {
  if (fee === null || fee === undefined) return ColorStyles.Muted;

  if (typeof fee === "string") {
    const num = Number(fee);
    if (isNaN(num)) return ColorStyles.Muted;
    fee = num;
  }

  if (isNaN(fee)) return ColorStyles.Muted;
  if (fee == 0) return ColorStyles.Success;
  if (fee <= 20) return ColorStyles.Warning;
  return ColorStyles.Error;
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
  const { state } = useHydrantContext();

  const [classInput, setClassInput] = useState("");

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
      state.toggleActivity(cls);
      onClassInputChange("");
    } else if (state.peClasses.has(classInput)) {
      const clsCheck = state.peClasses.get(classInput);
      state.toggleActivity(clsCheck);
    }
  };

  return (
    <ClassSearchInput
      value={classInput}
      onChange={onClassInputChange}
      onSubmit={onEnter}
      placeholder="Class number or name"
    />
  );
}

const StarCellRenderer = (props: CustomCellRendererProps<ClassTableRow>) => {
  const { data, api } = props;
  if (!data) return null;

  return (
    <StarButton
      cls={data.class}
      onStarToggle={() => {
        api.refreshCells({
          force: true,
          columns: ["number"],
        });
      }}
    />
  );
};

const filtersNonFlags = {
  fits: (state, cls) => state.fitsSchedule(cls),
  starred: (state, cls) => state.isPEClassStarred(cls),
  latest: (state, cls) => cls.rawClass.quarter === state.latestQuarter,
} satisfies Record<string, (state: State, cls: PEClass) => boolean>;

type Filter = keyof PEFlags | keyof typeof filtersNonFlags;
type FilterGroup = [Filter, string, ReactNode?][];

/**
 * List of all class flags.
 */
const CLASS_FLAGS: FilterGroup = [
  ["starred", "Starred", <LuStar fill="currentColor" key="starred" />],
  ["latest", "Latest quarter"],
  ["nofee", "No fee"],
  ["nopreq", "No prereq"],
  ["fits", "Fits schedule"],
  ["wellness", "Wellness Wizard", getPEFlagIcon("wellness")],
  ["pirate", "Pirate Certificate", getPEFlagIcon("pirate")],
  ["swim", "Swim GIR", getPEFlagIcon("swim")],
  ["remote", "Remote", getPEFlagIcon("remote")],
];

function isFilterNonFlagKey(key: string): key is keyof typeof filtersNonFlags {
  return key in filtersNonFlags;
}

/** Div containing all the flags like "HASS". Maintains the flag filter. */
function ClassFlags(props: {
  /** Callback for updating the class filter. */
  setFlagsFilter: SetClassFilter;
  /** Callback for updating the grid filter manually. */
  updateFilter: () => void;
}) {
  const { setFlagsFilter, updateFilter } = props;
  const { state } = useHydrantContext();

  const [flags, setFlags] = useState(() => {
    const result = new Map<Filter, boolean>();
    for (const flag of CLASS_FLAGS) {
      result.set(flag[0], false);
    }

    // default to latest quarter
    result.set("latest", true);

    return result;
  });

  useEffect(() => {
    // careful! we have to wrap it with a () => because otherwise React will
    // think it's an updater function instead of the actual function.
    setFlagsFilter(() => (cls?: PEClass) => {
      if (!cls) return false;
      for (const [flag, value] of flags) {
        if (!value) continue;
        const passes = isFilterNonFlagKey(flag)
          ? filtersNonFlags[flag](state, cls)
          : cls.flags[flag];
        if (!passes) return false;
      }
      return true;
    });
  }, [state, flags, setFlagsFilter]);

  // this callback needs to get called when the set of classes change, because
  // the filter has to change as well
  useEffect(() => {
    state.setFitsScheduleCallback(() => {
      if (flags.get("fits")) {
        updateFilter();
      }
    });
  }, [state, flags, updateFilter]);

  const onChange = (flag: Filter, value: boolean) => {
    const newFlags = new Map(flags);
    newFlags.set(flag, value);
    setFlags(newFlags);
  };

  const renderGroup = (group: FilterGroup) => {
    return (
      <ButtonGroup attached wrap="wrap">
        {group.map(([flag, label, image]) => {
          const checked = flags.get(flag);

          if (
            flag === "starred" &&
            state.getStarredPEClasses().length === 0 &&
            !checked
          ) {
            return null;
          }

          return image ? (
            <LabelledButton
              key={flag}
              onClick={() => {
                onChange(flag, !checked);
              }}
              title={label}
              variant={checked ? "solid" : "outline"}
            >
              {image}
            </LabelledButton>
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
      <Flex align="center">{renderGroup(CLASS_FLAGS)}</Flex>
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
  const { state } = useHydrantContext();
  const isStarred = state.isPEClassStarred(cls);

  return (
    <Button
      onClick={(e) => {
        e.stopPropagation();
        state.toggleStarPEClass(cls);
        onStarToggle?.();
      }}
      variant="ghost"
      size="sm"
      aria-label={isStarred ? "Unstar class" : "Star class"}
    >
      <LuStar fill={isStarred ? "currentColor" : "none"} />
    </Button>
  );
};

/** The table of all classes, along with searching and filtering with flags. */
export function PEClassTable() {
  const { state } = useHydrantContext();
  const { peClasses } = state;

  const gridRef = useRef<AgGridReact<ClassTableRow>>(null);
  // hide size and quarter suffix on small screens (eg phone)
  const narrow =
    useBreakpointValue({ base: true, sm: false }, { ssr: false }) ?? false;

  const columnDefs: ColDef<ClassTableRow, string | number>[] = useMemo(() => {
    return [
      {
        headerName: "",
        field: "number",
        width: 49,
        maxWidth: 49,
        cellRenderer: StarCellRenderer,
        sortable: false,
        cellStyle: { padding: 0 },
      },
      {
        field: "number",
        headerName: "Class",
        comparator: classSort,
        initialSort: INITIAL_SORT,
        width: narrow ? 105 : 150,
        maxWidth: narrow ? 105 : 150,
        cellClass: [styles["underline-on-hover"], styles.data],
        valueFormatter: (params) =>
          narrow
            ? (params.value?.toString() ?? "")
            : `${params.value?.toString() ?? ""} (Q${params.data?.class.rawClass.quarter.toString() ?? ""})`,
        ...sortProps,
      },
      {
        field: "classSize",
        headerName: "Size",
        cellDataType: "number",
        width: 85,
        maxWidth: 85,
        hide: narrow,
        cellClass: styles.data,
        ...sortProps,
      },
      {
        field: "fee",
        width: 90,
        maxWidth: 90,
        cellDataType: "number",
        cellClass: (params) => getFeeColor(params.value),
        valueFormatter: (params) => "$" + Number(params.value).toFixed(2),
        ...sortProps,
      },
      {
        field: "name",
        sortable: false,
        flex: 1,
      },
    ];
  }, [narrow]);

  const defaultColDef: ColDef<ClassTableRow, string> = useMemo(() => {
    return {
      resizable: false,
    };
  }, []);

  const rowData: ClassTableRow[] = useMemo(
    () =>
      Array.from(peClasses.values(), (cls) => ({
        number: cls.rawClass.number,
        classSize: cls.rawClass.classSize,
        fee: cls.fee,
        name: cls.rawClass.name,
        class: cls,
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

  useEffect(() => {
    gridRef.current?.api?.onFilterChanged();
    // oxlint-disable-next-line react/exhaustive-effect-dependencies
  }, [doesExternalFilterPass]);

  return (
    <Flex direction="column" gap={4}>
      <ClassInput rowData={rowData} setInputFilter={setInputFilter} />
      <ClassFlags
        setFlagsFilter={setFlagsFilter}
        updateFilter={() => gridRef.current?.api?.onFilterChanged()}
      />
      <Box h="clamp(320px, 50dvh, 640px)" w="full" overflow="auto">
        <AgGridReact<ClassTableRow>
          theme={HYDRANT_THEME}
          ref={gridRef}
          rowClass={styles.row}
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
          onCellKeyDown={(e) => {
            onRowKeyDown(
              e,
              (cls) => {
                state.setViewedActivity(cls);
              },
              (cls) => {
                state.toggleActivity(cls);
              },
            );
          }}
          suppressOverlays={["noRows"]}
          // these have to be set here, not in css:
          headerHeight={40}
          rowHeight={40}
        />
      </Box>
    </Flex>
  );
}
