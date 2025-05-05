import { Flex, Image } from "@chakra-ui/react";
import { useState } from "react";

import { JsonForms } from "@jsonforms/react";
import {
  materialCells,
  materialRenderers,
} from "@jsonforms/material-renderers";

import "@fontsource/roboto";
import { Button, Typography } from "@mui/material";

import TOML from "smol-toml";

import { Provider } from "./ui/provider";

import logo from "../assets/logo.svg";
import itemSchema from "../../scrapers/overrides.toml.d/override-schema.json";

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
        { type: "Control", label: "Prerequisites", scope: "#/properties/prereqs" },
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
        { type: "Control", label: "Instructors", scope: "#/properties/inCharge" },
        { type: "Control", label: "URL", scope: "#/properties/url" },
      ],
    },
  },
};



/** The main application. */
export default function App() {
  const [data, setData] = useState([]);
  return (
    <Provider>
      <Flex direction="column" gap={5} px="20%" py={4}>
        <Flex>
          <Image
            src={logo}
            alt="Hydrant logo"
            h="40px"
            pos="relative"
            top={2}
          />
        </Flex>
        <Typography variant="h4">Submit Overrides</Typography>
        <JsonForms
          schema={schema}
          uischema={uischema}
          renderers={materialRenderers}
          cells={materialCells}
          onChange={({ data, _errors }) => setData(data)}
        />
        <Button
          variant="contained"
          onClick={() => {
            const contents = TOML.stringify(Object.fromEntries((data || []).map(
              override => {
                const { number: num, ...rest } = override;
                return [num, rest];
              }
            )));

            const subject = encodeURIComponent("Hydrant subject overrides");

            const body = encodeURIComponent(`\
(Add an optional description.)

Please do not modify anything below this line.
--------------------------------------------------\n`
              + contents);

            window.location.href =
              `mailto:sipb-hydrant@mit.edu?subject=${subject}&body=${body}`;
          }}
        >
          Submit
        </Button>
        <Typography variant="subtitle2">
          Clicking "Submit" will populate an email in your mail client in order
          to send your requested subject overrides to the Hydrant team.
        </Typography>
      </Flex>
    </Provider>
  );
}
