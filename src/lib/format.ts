export const DASH = '–';

const INTEGER = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 });
const ONE_DECIMAL = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const GBP = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 2,
});
const GBP_WHOLE = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});

export function formatInteger(value: number): string {
  return INTEGER.format(value);
}

export function formatDecimal(value: number): string {
  return ONE_DECIMAL.format(value);
}

/** A rate from 0 to 1 as a percentage. Null gives a dash. */
export function formatRate(value: number | null): string {
  if (value === null) {
    return DASH;
  }
  return `${ONE_DECIMAL.format(value * 100)}%`;
}

/** A result in R with a sign. Null gives a dash. */
export function formatR(value: number | null): string {
  if (value === null) {
    return DASH;
  }
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${Math.abs(value).toFixed(2)}R`;
}

export function formatCount(value: number | null): string {
  return value === null ? DASH : INTEGER.format(value);
}

export function formatGbp(value: number, whole = false): string {
  return (whole ? GBP_WHOLE : GBP).format(value);
}

/** Text from a number field as a whole number at or above the minimum. */
export function parseWhole(text: string, minimum = 0): number {
  const value = Math.floor(Number(text));
  if (!Number.isFinite(value)) {
    return minimum;
  }
  return Math.max(minimum, value);
}

/** Text from a number field as a number. Text that is not a number gives null. */
export function parseNumber(text: string): number | null {
  if (text.trim() === '') {
    return null;
  }
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/** The singular word for 1. The plural word for all other counts. */
export function plural(count: number, singular: string, pluralWord: string): string {
  return count === 1 ? singular : pluralWord;
}

const ROMAN: readonly [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

/** A whole number from 1 to 3999 as a Roman numeral. Other values give the number as text. */
export function toRoman(value: number): string {
  if (!Number.isInteger(value) || value < 1 || value > 3999) {
    return String(value);
  }
  let rest = value;
  let text = '';
  for (const [amount, symbol] of ROMAN) {
    while (rest >= amount) {
      text += symbol;
      rest -= amount;
    }
  }
  return text;
}
