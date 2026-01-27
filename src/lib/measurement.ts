export interface MeasurementSystem {
  name: string;
  formatLength(metres: number): string;
}

const metric: MeasurementSystem = {
  name: "Metric",
  formatLength: (metres) =>
    metres < 1000
      ? `${metres.toFixed(0)} m`
      : `${(metres / 1000).toFixed(2)} km`,
};

// This conversion factor is exact
const METRES_PER_MILE = 1609.344;

const customary: MeasurementSystem = {
  name: "US customary",
  formatLength: (metres) => `${(metres / METRES_PER_MILE).toFixed(2)} mi`,
};

export const MEASUREMENT_SYSTEM_PRESETS: MeasurementSystem[] = [
  metric,
  customary,
];

export const MEASUREMENT_SYSTEM_METRIC = metric;
export const MEASUREMENT_SYSTEM_CUSTOMARY = customary;

export const getDefaultMeasurementSystem = (): MeasurementSystem => {
  const localeCountry = navigator.language.split("-")[1];

  if (localeCountry === "US") {
    return MEASUREMENT_SYSTEM_CUSTOMARY;
  } else {
    return MEASUREMENT_SYSTEM_METRIC;
  }
};
