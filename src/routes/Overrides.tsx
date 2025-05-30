import { useCallback, useMemo, useState } from "react";

import Form from "@rjsf/chakra-ui";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import type { JSONSchema7Definition } from "json-schema";

import { Link as RouterLink } from "react-router";
import type { Route } from "./+types/Overrides";

import TOML from "smol-toml";

import logo from "../assets/logo.svg";
import itemSchema from "../../scrapers/overrides.toml.d/override-schema.json";

import {
  Container,
  Link,
  Stack,
  Text,
  Image,
  createListCollection,
  Code,
  type Select as ChakraSelect,
} from "@chakra-ui/react";
import {
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "../components/ui/select";

const schema: RJSFSchema = {
  title: "Overrides",
  type: "array",
  items: {
    ...itemSchema.additionalProperties,
    required: ["number"],
  } as JSONSchema7Definition,
  $defs: itemSchema.$defs as Record<string, JSONSchema7Definition>,
};

// eslint-disable-next-line react-refresh/only-export-components
export async function clientLoader({ params }: Route.ClientLoaderArgs) {
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

  let prefillData: Record<string, unknown>[] = [];
  const prefillId = (
    params as Record<string, string | undefined>
  ).prefillId?.toUpperCase();

  const getDataFromFile = async (fileName: string) => {
    try {
      const textToml = await (overrideNames[fileName]() as Promise<string>);
      const mod = TOML.parse(textToml);

      const newData = Object.entries(mod).map(([key, value_1]) => {
        const { number: num, ...rest } = value_1 as Record<string, unknown>;
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

  if (prefillId) {
    const fileName = prefillId.toUpperCase();

    if (fileName in overrideNames) {
      const newData = await getDataFromFile(fileName);
      if (newData.length > 0) {
        prefillData = newData;
      } else {
        console.error("No data found for prefill ID:", fileName);
      }
    } else {
      console.error("Invalid prefill ID:", fileName);
    }
  }

  return { overrideNames, prefillData, prefillId };
}

/** The main application. */
export default function App({ loaderData }: Route.ComponentProps) {
  const { overrideNames, prefillData, prefillId } = loaderData;

  const [data, setData] = useState<Record<string, unknown>[]>(prefillData);
  const [error, setError] = useState<boolean>(false);
  const [selected, setSelected] = useState<string[]>(
    prefillId && prefillId in overrideNames ? [prefillId] : [""],
  );

  const overridesCollection = createListCollection({
    items: Object.entries(overrideNames).map(([name]) => ({
      label: name,
      value: name,
    })),
  });

  // TODO IN NEXT COMMIT: Make ui schema match what it did before :(
  const uischema = useMemo<UiSchema>(() => {
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
                  templateColumns: "repeat(2, 1fr)",
                  children: [
                    {
                      "ui:columns": ["number", "name"],
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
                  templateColumns: "repeat(5, 1fr)",
                  children: [
                    {
                      "ui:columns": [
                        "level",
                        "lectureUnits",
                        "labUnits",
                        "preparationUnits",
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
                  templateColumns: "repeat(6, 1fr)",
                  children: [
                    {
                      "ui:columns": [
                        "hassH",
                        "hassA",
                        "hassS",
                        "hassE",
                        "cih",
                        "cihw",
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
                    "ui:help": value.description,
                    "ui:description": " ",
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    uiSchema.items.description["ui:widget"] = "textarea";
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    uiSchema.items.level["ui:enumNames"] = ["Undergraduate", "Graduate"];

    return uiSchema;
  }, [data.length, error]);

  const getDataFromFile = useCallback(
    async (fileName: string) => {
      try {
        const textToml = await (overrideNames[fileName]() as Promise<string>);
        const mod = TOML.parse(textToml);

        const newData = Object.entries(mod).map(([key, value_1]) => {
          const { number: num, ...rest } = value_1 as Record<string, unknown>;
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
    },
    [overrideNames],
  );

  const handleChange = (e: ChakraSelect.ValueChangeDetails) => {
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
      <Stack gap={4} paddingY={4}>
        <RouterLink
          to="/"
          style={{
            position: "relative",
            top: 2,
          }}
        >
          <Image src={logo} alt="Hydrant logo" height="40px" />
        </RouterLink>
        <Text textStyle="3xl">Submit Overrides</Text>
        <Text>
          This page is for department academic administrators to submit requests
          for Hydrant to override the details of a class from the official
          subject listing and catalog. For example, this can be used so that a
          special subject shows up under its title for the current semester
          rather than under a generic name.
        </Text>
        <Text>
          You don't need to populate all of the available
          fields&nbsp;&mdash;&nbsp;only the ones that differ from the course
          catalog. Thank you for your time, and feel free to reach out to {}
          <Link colorPalette="blue" asChild>
            <RouterLink to="mailto:sipb-hydrant@mit.edu">
              sipb-hydrant@mit.edu
            </RouterLink>
          </Link>
          {} with any questions or concerns!
        </Text>
        <SelectRoot
          collection={overridesCollection}
          value={selected}
          onValueChange={handleChange}
        >
          <SelectLabel>Pre-fill data</SelectLabel>
          <SelectTrigger clearable>
            <SelectValueText />
          </SelectTrigger>
          <SelectContent>
            {overridesCollection.items.map((override) => (
              <SelectItem item={override} key={override.value}>
                {override.label}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
        <Form
          schema={schema}
          uiSchema={uischema}
          validator={validator}
          formData={data}
          showErrorList={false}
          liveValidate={true}
          experimental_defaultFormStateBehavior={{
            arrayMinItems: { populate: "requiredOnly" },
            emptyObjectFields: "populateRequiredDefaults",
            mergeDefaultsIntoFormData: "useDefaultIfFormDataUndefined",
          }}
          liveOmit={true}
          omitExtraData={true}
          onChange={({ formData, errors }) => {
            setData(formData as Record<string, unknown>[]);
            setError(errors.length > 0 ? true : false);
          }}
          onSubmit={() => {
            const contents = TOML.stringify(
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
          <Link colorPalette="blue" asChild>
            <RouterLink to="mailto:sipb-hydrant@mit.edu">
              sipb-hydrant@mit.edu
            </RouterLink>
          </Link>{" "}
          in order to send your requested subject overrides to the Hydrant team.
        </Text>
      </Stack>
    </Container>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const meta: Route.MetaFunction = () => [
  { title: "Hydrant - Overrides Form" },
  {
    name: "description",
    content:
      "Form for department administrators to overrides to the Hydrant team.",
  },
];
