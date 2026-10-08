export type QuantileMethod = "linear";

export interface Quartiles {
  q1: number;
  median: number;
  q3: number;
  iqr: number;
}

export interface OutlierResult {
  value: number;
  index: number;
  distance: number;
  severity: "normal" | "mild" | "extreme";
  lowerFence: number;
  upperFence: number;
}

export interface AnalysisResult extends Quartiles {
  n: number;
  min: number;
  max: number;
  mean: number;
  standardDeviation: number;
  skewness: number | null;
  lowerFence: number;
  upperFence: number;
  outerLowerFence: number;
  outerUpperFence: number;
  outliers: OutlierResult[];
  limitations: string[];
}

function sorted(values: number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

export function quantile(values: number[], p: number): number {
  if (!Number.isFinite(p) || p < 0 || p > 1) throw new RangeError("p debe estar entre 0 y 1.");
  const xs = sorted(values);
  if (!xs.length) throw new RangeError("Se necesita al menos un valor.");
  if (xs.length === 1) return xs[0];
  const position = (xs.length - 1) * p;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return xs[lower];
  return xs[lower] + (xs[upper] - xs[lower]) * (position - lower);
}

export function quartiles(values: number[]): Quartiles {
  if (!values.length) throw new RangeError("No hay datos numéricos.");
  const q1 = quantile(values, 0.25);
  const median = quantile(values, 0.5);
  const q3 = quantile(values, 0.75);
  return { q1, median, q3, iqr: q3 - q1 };
}

function sampleStandardDeviation(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  return Math.sqrt(values.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (values.length - 1));
}

function skewness(values: number[], mean: number, sd: number): number | null {
  if (values.length < 3 || sd === 0) return null;
  return values.reduce((sum, x) => sum + ((x - mean) / sd) ** 3, 0) / values.length;
}

export function analyze(values: number[]): AnalysisResult {
  const clean = values.filter(Number.isFinite);
  if (!clean.length) throw new RangeError("No hay observaciones numéricas válidas.");
  const { q1, median, q3, iqr } = quartiles(clean);
  const mean = clean.reduce((a, b) => a + b, 0) / clean.length;
  const standardDeviation = sampleStandardDeviation(clean, mean);
  const skew = skewness(clean, mean, standardDeviation);
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const outerLowerFence = q1 - 3 * iqr;
  const outerUpperFence = q3 + 3 * iqr;

  const outliers = clean.map((value, index) => {
    const extreme = value < outerLowerFence || value > outerUpperFence;
    const mild = value < lowerFence || value > upperFence;
    return {
      value,
      index,
      distance: value < lowerFence ? lowerFence - value : value > upperFence ? value - upperFence : 0,
      severity: extreme ? "extreme" : mild ? "mild" : "normal",
      lowerFence,
      upperFence
    } satisfies OutlierResult;
  }).filter(x => x.severity !== "normal");

  const limitations: string[] = [];
  if (clean.length < 8) limitations.push("Muestra pequeña: los límites deben interpretarse con cautela.");
  if (skew !== null && Math.abs(skew) > 1) limitations.push("Asimetría elevada: Tukey puede generar señales que requieren contexto.");
  if (iqr === 0) limitations.push("IQR = 0: la regla de cercas pierde capacidad discriminativa.");
  if (clean.every(x => x === clean[0])) limitations.push("Todos los valores son idénticos.");
  if (outliers.length / clean.length > 0.2) limitations.push("Más del 20% de las observaciones son atípicas según Tukey; revisar la definición de la población.");

  return {
    n: clean.length,
    min: Math.min(...clean),
    max: Math.max(...clean),
    mean,
    standardDeviation,
    skewness: skew,
    q1, median, q3, iqr,
    lowerFence, upperFence, outerLowerFence, outerUpperFence,
    outliers,
    limitations
  };
}
