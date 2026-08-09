import { useCallback, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router";

import type { CustomValidator, RJSFSchema, UiSchema } from "@rjsf/utils";
import type { JSONSchema7Definition } from "json-schema";

import {
  Container,
  Link,
  Stack,
  Text,
  Image,
  createListCollection,
  Code,
  Select,
  Portal,
  Heading,
  Box,
  SkipNavContent,
  SkipNavLink,
} from "@chakra-ui/react";
import { Theme as ChakraUITheme } from "@rjsf/chakra-ui";
import { withTheme } from "@rjsf/core";
import { customizeValidator } from "@rjsf/validator-ajv8";
import { stringify as tomlStringify, parse as tomlParse } from "smol-toml";

import type { Route } from "./+types/overrides.($prefillId)";

import itemSchema from "../../scrapers/overrides.toml.d/override-schema.json";
import logo from "../assets/logo.svg";

type FormData = Record<string, unknown>[];

const Form = withTheme<FormData>(ChakraUITheme);
const validator = customizeValidator<FormData>();

const schema: RJSFSchema = {
  title: "Overrides",
  type: "array",
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  items: {
    ...itemSchema.additionalProperties,
    required: ["number"],
  } as unknown as JSONSchema7Definition,
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  definitions: itemSchema.definitions as Record<string, JSONSchema7Definition>,
};

type OverridesRecord = Record<
  string,
  { name: string; data: () => Promise<string> }
>;

const overrides: OverridesRecord = Object.assign(
  {} as OverridesRecord,
  ...Object.entries(
    import.meta.glob("../../scrapers/overrides.toml.d/**/*.toml", {
      query: "raw",
      import: "default",
    }),
  ).map(([key, data]) => {
    const split = key.split("/");
    const name = split.slice(-1)[0].split(".")[0].toUpperCase();

    return { [key]: { name, data } };
  }),
);

const overridesCollection = createListCollection({
  items: Object.entries(overrides)
    .map(([key, { name }]) => ({
      label: name,
      value: key,
    }))
    .toSorted((a, b) => a.label.localeCompare(b.label)),
});

const overrideNames = Object.entries(overrides)
  .map(([key, val]) => [val.name.toUpperCase(), key])
  .reduce<Record<string, string>>((accum, [k, v]) => {
    accum[k] = v;
    return accum;
  }, {});

const getDataFromFileAsync = async (fileName: string) => {
  try {
    const textToml = await overrides[fileName].data();
    const mod = tomlParse(textToml);

    const newData = Object.entries(mod).map(([key, value]) => {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      const { number: _num, ...rest } = value as Record<string, unknown>;
      return {
        number: key,
        ...rest,
      };
    });
    return newData;
  } catch (err) {
    console.error("Error loading TOML file:", err);
    return [];
  }
};

/** ensures class numbers are unique, since we change override from object to array */
const validateUniqueNumbers: CustomValidator<FormData> = (formData, errors) => {
  const indicesByNumber = new Map<string, number[]>();
  (formData ?? []).forEach((override, index) => {
    const number = override.number;
    if (typeof number !== "string" || number === "") return;
    const indices = indicesByNumber.get(number) ?? [];
    indices.push(index);
    indicesByNumber.set(number, indices);
  });

  for (const [number, indices] of indicesByNumber) {
    if (indices.length > 1) {
      for (const index of indices) {
        errors[index]?.number?.addError(
          `Class number "${number}" is used more than once; class numbers must be unique.`,
        );
      }
    }
  }

  return errors;
};

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  let prefillData: FormData = [];
  const prefillIdPrelim = params.prefillId?.toUpperCase();
  let prefillId = "";

  if (prefillIdPrelim) {
    if (Object.keys(overrideNames).includes(prefillIdPrelim)) {
      const newData = await getDataFromFileAsync(
        overrideNames[prefillIdPrelim],
      );
      if (newData.length > 0) {
        prefillData = newData;
        prefillId = overrideNames[prefillIdPrelim];
      } else {
        console.error("No data found for prefill ID:", prefillIdPrelim);
      }
    } else {
      console.error("Invalid prefill ID:", prefillIdPrelim);
    }
  }

  return { prefillData, prefillId };
}

/** The main application. */
export default function App({ loaderData }: Route.ComponentProps) {
  const { prefillData, prefillId } = loaderData;

  const [data, setData] = useState(prefillData);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState([prefillId]);

  // TODO IN NEXT COMMIT: Make ui schema match what it did before :(
  const uischema = useMemo<UiSchema<FormData>>(() => {
    const uiSchema = {
      "ui:title": "Overrides",
      "ui:submitButtonOptions": {
        props: {
          disabled: data.length === 0 || error,
        },
        submitText: "Download",
      },
      items: {
        "ui:title": "Class Override",
        "ui:field": "LayoutGridField",
        "ui:layoutGrid": {
          "ui:row": {
            gap: 2,
            children: [
              {
                "ui:row": {
                  gap: 2,
                  templateColumns: "repeat(1, 1fr)",
                  children: [
                    {
                      "ui:col": ["title"],
                    },
                  ],
                },
              },
              {
                "ui:row": {
                  gap: 2,
                  templateColumns: "repeat(3, 1fr)",
                  children: [
                    {
                      "ui:columns": ["number", "name", "include"],
                    },
                  ],
                },
              },
              {
                "ui:row": {
                  gap: 2,
                  templateColumns: "repeat(3, 1fr)",
                  children: [
                    {
                      "ui:columns": ["oldNumber", "same", "meets"],
                    },
                  ],
                },
              },
              {
                "ui:row": {
                  gap: 2,
                  templateColumns: "repeat(1, 1fr)",
                  children: [
                    {
                      "ui:columns": ["prereqs"],
                    },
                  ],
                },
              },
              {
                "ui:row": {
                  gap: 2,
                  templateColumns: "repeat(6, 1fr)",
                  children: [
                    {
                      "ui:columns": [
                        "level",
                        "lectureUnits",
                        "labUnits",
                        "preparationUnits",
                        "new",
                        "isVariableUnits",
                      ],
                    },
                  ],
                },
              },
              {
                "ui:row": {
                  gap: 2,
                  templateColumns: "repeat(1, 1fr)",
                  children: [
                    {
                      "ui:columns": ["description"],
                    },
                  ],
                },
              },
              {
                "ui:row": {
                  gap: 2,
                  templateColumns: "repeat(3, 1fr)",
                  children: ["hass", "comms", "gir"],
                },
              },
              {
                "ui:row": {
                  gap: 2,
                  templateColumns: "repeat(1, 1fr)",
                  children: [
                    {
                      "ui:columns": ["inCharge"],
                    },
                  ],
                },
              },
              {
                "ui:row": {
                  gap: 2,
                  templateColumns: "repeat(1, 1fr)",
                  children: [
                    {
                      "ui:columns": ["url"],
                    },
                  ],
                },
              },
            ],
          },
        },
        title: {
          "ui:field": "LayoutHeaderField",
        },
        ...Object.fromEntries(
          Object.entries(itemSchema.additionalProperties.properties).map(
            ([key, value]) => {
              if ("description" in value) {
                return [
                  key,
                  {
                    ...value,
                    "ui:title": value.title,
                    "ui:description": value.description,
                    ...("type" in value && value.type === "boolean"
                      ? { "ui:widget": "checkbox" }
                      : {}),
                  },
                ];
              } else {
                return [key, value];
              }
            },
          ),
        ),
      },
    } satisfies UiSchema;

    uiSchema.items.description["ui:widget"] = "textarea";

    return uiSchema;
  }, [data.length, error]);

  const getDataFromFile = useCallback(getDataFromFileAsync, []);
  const handleChange = (e: Select.ValueChangeDetails) => {
    const fileName = e.value[0];

    if (fileName === "") {
      setData([]);
      setSelected([""]);
      return;
    }

    getDataFromFile(fileName)
      .then((newData) => {
        setData(newData);
        setSelected([fileName]);
      })
      .catch((err: unknown) => {
        console.error("Error loading TOML file:", err);
        setData([]);
        setSelected([""]);
      });
  };

  return (
    <Container maxWidth="4xl" paddingX={4} paddingY={8}>
      <SkipNavLink>Skip to content</SkipNavLink>
      <Box as="header" paddingY={4}>
        <RouterLink
          to="/"
          style={{
            position: "relative",
            top: 2,
          }}
        >
          <Image src={logo} alt="Hydrant logo" height="40px" />
        </RouterLink>
      </Box>
      <SkipNavContent asChild>
        <Stack gap={4} as="main">
          <Heading textStyle="3xl">Submit Overrides</Heading>
          <Text>
            This page is for department academic administrators to submit
            requests for Hydrant to override the details of a class from the
            official subject listing and catalog. For example, this can be used
            so that a special subject shows up under its title for the current
            semester rather than under a generic name.
          </Text>
          <Text>
            You don't need to populate all of the available
            fields&nbsp;&mdash;&nbsp;only the ones that differ from the course
            catalog. Once you send us your overrides, we'll upload them and
            they'll appear under the dropdown below. Thank you for your time,
            and feel free to reach out to{" "}
            <Link asChild>
              <RouterLink to="mailto:sipb-hydrant@mit.edu">
                sipb-hydrant@mit.edu
              </RouterLink>
            </Link>{" "}
            with any questions or concerns!
          </Text>
          <Select.Root
            collection={overridesCollection}
            value={selected}
            onValueChange={handleChange}
          >
            <Select.HiddenSelect />
            <Select.Label>Pre-fill data</Select.Label>
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.ClearTrigger />
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {overridesCollection.items.map((override) => (
                    <Select.Item item={override} key={override.value}>
                      {override.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
          <Form
            schema={schema}
            uiSchema={uischema}
            validator={validator}
            customValidate={validateUniqueNumbers}
            formData={data}
            showErrorList={"top"}
            liveValidate={"onChange"}
            experimental_defaultFormStateBehavior={{
              arrayMinItems: { populate: "never" },
              allOf: "skipDefaults",
              constAsDefaults: "always",
              emptyObjectFields: "populateRequiredDefaults",
              mergeDefaultsIntoFormData: "useFormDataIfPresent",
            }}
            liveOmit={"onChange"}
            omitExtraData={true}
            onChange={({ formData, errors }) => {
              setData(formData ?? []);
              setError(errors.length > 0);
            }}
            onSubmit={() => {
              const contents =
                "#:schema ../override-schema.json\n\n" +
                tomlStringify(
                  Object.fromEntries(
                    data.map((override) => {
                      const { number: num, ...rest } = override;
                      return [num, rest];
                    }),
                  ),
                );

              const element = document.createElement("a");
              element.href = URL.createObjectURL(
                new Blob([contents], { type: "application/octet-stream" }),
              );
              element.download = "overrides.toml";

              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
            }}
          />
          <Text textStyle="sm">
            Clicking "Download" will download a file <Code>overrides.toml</Code>{" "}
            to your computer; please attach this file to an email addressed to{" "}
            <Link asChild>
              <RouterLink to="mailto:sipb-hydrant@mit.edu">
                sipb-hydrant@mit.edu
              </RouterLink>
            </Link>{" "}
            in order to send your requested subject overrides to the Hydrant
            team.
          </Text>
        </Stack>
      </SkipNavContent>
    </Container>
  );
}

export const meta: Route.MetaFunction = () => [
  { title: "Hydrant - Overrides Form" },
  {
    name: "description",
    content:
      "Form for department administrators to overrides to the Hydrant team.",
  },
];
