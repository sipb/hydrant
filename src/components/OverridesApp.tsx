import { useState } from "react";

import { JsonForms } from "@jsonforms/react";
import type { JsonSchema7 } from "@jsonforms/core";
import {
  materialCells,
  materialRenderers,
} from "@jsonforms/material-renderers";

import "@fontsource/roboto/index.css";
import type { SelectChangeEvent } from "@mui/material";
import {
  Button,
  Link,
  Typography,
  Container,
  Stack,
  CssBaseline,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router";

import TOML from "smol-toml";

import logo from "../assets/logo.svg";
import itemSchema from "../../scrapers/overrides.toml.d/override-schema.json";

const overrides: Record<string, () => Promise<unknown>> = import.meta.glob(
  "../../scrapers/overrides.toml.d/*.toml",
  {
    query: "raw",
    import: "default",
  },
);
const overrideNames = Object.assign(
  {},
  ...Object.keys(overrides).map((key) => {
    const newKey = key.split("/").slice(-1)[0].split(".")[0].toUpperCase();
    return { [newKey]: overrides[key] };
  }),
) as typeof overrides;

const schema = {
  title: "Overrides",
  type: "array",
  items: { ...itemSchema, required: ["number"] } as JsonSchema7,
  $defs: itemSchema.$defs,
};

const uischema = {
  type: "Control",
  scope: "#",
  options: {
    detail: {
      type: "VerticalLayout",
      elements: [
        {
          type: "HorizontalLayout",
          elements: [
            { type: "Control", scope: "#/properties/number" },
            { type: "Control", scope: "#/properties/name" },
          ],
        },
        {
          type: "HorizontalLayout",
          elements: [
            {
              type: "Control",
              label: "Formerly known as",
              scope: "#/properties/oldNumber",
            },
            {
              type: "Control",
              label: "Same as",
              scope: "#/properties/same",
            },
            {
              type: "Control",
              label: "Meets with",
              scope: "#/properties/meets",
            },
          ],
        },
        {
          type: "Control",
          label: "Prerequisites",
          scope: "#/properties/prereqs",
        },
        {
          type: "HorizontalLayout",
          elements: [
            { type: "Control", scope: "#/properties/level" },
            {
              type: "Control",
              scope: "#/properties/lectureUnits",
              rule: {
                effect: "DISABLE",
                condition: {
                  scope: "#/properties/isVariableUnits",
                  schema: { const: true },
                },
              },
            },
            {
              type: "Control",
              scope: "#/properties/labUnits",
              rule: {
                effect: "DISABLE",
                condition: {
                  scope: "#/properties/isVariableUnits",
                  schema: { const: true },
                },
              },
            },
            {
              type: "Control",
              scope: "#/properties/preparationUnits",
              rule: {
                effect: "DISABLE",
                condition: {
                  scope: "#/properties/isVariableUnits",
                  schema: { const: true },
                },
              },
            },
            {
              type: "Control",
              label: "Units arranged",
              scope: "#/properties/isVariableUnits",
            },
          ],
        },
        {
          type: "Control",
          scope: "#/properties/description",
          options: { multi: true },
        },
        {
          type: "HorizontalLayout",
          elements: [
            { type: "Control", label: "HASS-H", scope: "#/properties/hassH" },
            { type: "Control", label: "HASS-A", scope: "#/properties/hassA" },
            { type: "Control", label: "HASS-S", scope: "#/properties/hassS" },
            { type: "Control", label: "HASS-E", scope: "#/properties/hassE" },
            {
              type: "Control",
              label: "CI-H",
              scope: "#/properties/cih",
              rule: {
                effect: "DISABLE",
                condition: {
                  scope: "#/properties/cihw",
                  schema: { const: true },
                },
              },
            },
            {
              type: "Control",
              label: "CI-HW",
              scope: "#/properties/cihw",
              rule: {
                effect: "DISABLE",
                condition: {
                  scope: "#/properties/cih",
                  schema: { const: true },
                },
              },
            },
          ],
        },
        {
          type: "Control",
          label: "Instructors",
          scope: "#/properties/inCharge",
        },
        { type: "Control", label: "URL", scope: "#/properties/url" },
      ],
    },
  },
};

const theme = createTheme({
  colorSchemes: {
    dark: true,
  },
});

/** The main application. */
export default function App() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<boolean>(false);
  const [selected, setSelected] = useState<string>("");

  const handleChange = (file: SelectChangeEvent) => {
    const fileName = file.target.value;

    if (fileName === "") {
      setData([]);
      setSelected("");
      return;
    }

    (overrideNames[fileName]() as Promise<string>)
      .then((textToml) => {
        const mod = TOML.parse(textToml);

        const newData = Object.entries(mod).map(([key, value]) => {
          const { number: num, ...rest } = value as Record<string, unknown>;
          return {
            number: key,
            ...rest,
          };
        });

        setData(newData);
        setSelected(fileName);
      })
      .catch((err: unknown) => {
        console.error("Error loading TOML file:", err);
        setData([]);
        setSelected("");
      });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md">
        <Stack gap={2} paddingY={4}>
          <Stack>
            <Link component={RouterLink} to="/">
              <img
                src={logo}
                alt="Hydrant logo"
                height="40px"
                style={{
                  position: "relative",
                  top: 2,
                }}
              />
            </Link>
          </Stack>
          <Typography variant="h4">Submit Overrides</Typography>
          <Typography>
            This page is for department academic administrators to submit
            requests for Hydrant to override the details of a class from the
            official subject listing and catalog. For example, this can be used
            so that a special subject shows up under its title for the current
            semester rather than under a generic name.
          </Typography>
          <Typography>
            You don't need to populate all of the available
            fields&nbsp;&mdash;&nbsp;only the ones that differ from the course
            catalog. Thank you for your time, and feel free to reach out to {}
            <Link component={RouterLink} to="mailto:sipb-hydrant@mit.edu">
              sipb-hydrant@mit.edu
            </Link>
            {} with any questions or concerns!
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="select-data-label">Pre-fill data</InputLabel>
            <Select
              labelId="select-data-label"
              id="select-data"
              value={selected}
              label="Pre-fill data"
              onChange={handleChange}
            >
              <MenuItem key={0} value={""}>
                Clear
              </MenuItem>
              {Object.entries(overrideNames).map(([name], key) => (
                <MenuItem key={key} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <JsonForms
            schema={schema}
            uischema={uischema}
            renderers={materialRenderers}
            cells={materialCells}
            data={data}
            onChange={({ data: formData, errors }) => {
              setData(formData as Record<string, unknown>[]);
              setError(errors && errors.length > 0 ? true : false);
            }}
          />
          <Button
            variant="contained"
            disabled={data.length === 0 || error}
            onClick={() => {
              const contents = TOML.stringify(
                Object.fromEntries(
                  data.map((override) => {
                    const { number: num, ...rest } = override;
                    return [num, rest];
                  }),
                ),
              );

              const subject = encodeURIComponent("Hydrant subject overrides");

              const body = encodeURIComponent(
                `\
(Add an optional description.)

Please do not modify anything below this line.
--------------------------------------------------\n` + contents,
              );

              window.location.href = `mailto:sipb-hydrant@mit.edu?subject=${subject}&body=${body}`;
            }}
          >
            Submit
          </Button>
          <Typography variant="subtitle2">
            Clicking "Submit" will populate an email in your mail client in
            order to send your requested subject overrides to the Hydrant team,
            where you will have an opportunity to add comments.
          </Typography>
        </Stack>
      </Container>
    </ThemeProvider>
  );
}
