export interface Column {
  /** Counted from the right: "d0" is the units digit, "d1" the tens; "s0" is the first static character. */
  key: string;
  kind: 'digit' | 'static';
  char: string;
}

/**
 * The columns of a formatted number for the number roll.
 * Keys count from the right, so the units column keeps its identity when 9 becomes 10.
 * Digits roll; every other character (",", ".", "−", "+", "%", "R", a space) is static.
 */
export function digitColumns(text: string): Column[] {
  const chars = [...text];
  let digits = 0;
  let statics = 0;
  const columns: Column[] = [];
  for (let index = chars.length - 1; index >= 0; index -= 1) {
    const char = chars[index] ?? '';
    if (/[0-9]/.test(char)) {
      columns.push({ key: `d${digits}`, kind: 'digit', char });
      digits += 1;
    } else {
      columns.push({ key: `s${statics}`, kind: 'static', char });
      statics += 1;
    }
  }
  return columns.reverse();
}
