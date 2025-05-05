import { useState } from "react";

import { JsonForms } from "@jsonforms/react";
import {
  materialCells,
  materialRenderers,
} from "@jsonforms/material-renderers";

import "@fontsource/roboto/index.css";
import {
  Button,
  Typography,
  Container,
  Stack,
  CssBaseline,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Link } from "react-router";

import TOML from "smol-toml";

import logo from "../assets/logo.svg";
import itemSchema from "../../scrapers/overrides.toml.d/override-schema.json";

// @ts-expect-error just ignore it <3
itemSchema.required = ["number"];
const schema = {
  title: "Overrides",
  type: "array",
  items: itemSchema,
  $defs: {
    ...itemSchema.$defs,
  },
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
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md">
        <Stack gap={2} paddingY={4}>
          <Stack>
            <Link to="/">
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
          <JsonForms
            schema={schema}
            uischema={uischema}
            renderers={materialRenderers}
            cells={materialCells}
            data={data}
            onChange={({ data: formData }) => {
              setData(formData as Record<string, unknown>[]);
            }}
          />
          <Button
            variant="contained"
            onClick={() => {
              const contents = TOML.stringify(
                Object.fromEntries(
                  (data.length > 0 ? data : []).map((override) => {
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
            order to send your requested subject overrides to the Hydrant team.
          </Typography>
        </Stack>
      </Container>
    </ThemeProvider>
  );
}
