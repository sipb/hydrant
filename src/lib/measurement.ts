export interface MeasurementSystem {
  name: string;
  formatLength(feet: number): string;
}

const metric: MeasurementSystem = {
  name: "Metric",
  formatLength: (feet) => {
    const metres = feet * FEET_PER_METER;
    return metres < 1000
      ? `${metres.toFixed(0)} m`
      : `${(metres / 1000).toFixed(2)} km`;
  },
};

// This conversion factor is exact (note: technically US survey feet)
const FEET_PER_METER = 1200 / 3937;
// five tomatoes :)
const FEET_PER_MILE = 5280;

const customary: MeasurementSystem = {
  name: "US customary",
  formatLength: (feet) => `${(feet / FEET_PER_MILE).toFixed(2)} mi`,
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
