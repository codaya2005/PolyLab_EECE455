// src/lib/irreducibles.ts

export type IrredMap = Record<number, number>;

/** Common small-field irreducibles (hex). Feel free to adjust. */
export const IRRED_DEFAULTS: IrredMap = {
  2: 0x7,    // x^2 + x + 1
  3: 0xB,    // x^3 + x + 1
  4: 0x13,   // x^4 + x + 1
  5: 0x25,   // x^5 + x^2 + 1
  6: 0x43,   // x^6 + x + 1
  7: 0x89,   // x^7 + x^3 + 1
  8: 0x11B,  // AES: x^8 + x^4 + x^3 + x + 1
};

export function hex(v: number, pad = 2) {
  return "0x" + (v >>> 0).toString(16).toUpperCase().padStart(pad, "0");
}

export function asPolyString(poly: number): string {
  if (!poly) return "0";
  const terms: string[] = [];
  for (let i = 31; i >= 0; i--) {
    if (poly & (1 << i)) {
      if (i === 0) terms.push("1");
      else if (i === 1) terms.push("x");
      else terms.push(`x^${i}`);
    }
  }
  return terms.join(" + ");
}
