// src/lib/gf2m.test.ts
// This test suite cross-checks gf2m.ts against a naive polynomial implementation
// for all elements in GF(2^m) for m = 2..8 using your IRRED_DEFAULTS.
// If all these tests pass, gfAdd/gfMul/gfInv/gfPow/gfMod are correct for your fields.

import { describe, test, expect } from "vitest"; // For Jest, remove this line and rely on globals.

import { IRRED_DEFAULTS } from "./irreducibles";
import { gfAdd, gfMul, gfPow, gfInv, gfMod, type GFConfig } from "./gf2m";

/* ---------------- Naive GF(2^m) helpers for tests ---------------- */

function polyDegree(p: number): number {
  for (let i = 31; i >= 0; i--) {
    if (p & (1 << i)) return i;
  }
  return -1; // zero polynomial
}

/**
 * Naive polynomial reduction of p(x) modulo modPoly over GF(2).
 * poly bits = coefficients; modPoly uses same encoding as your IRRED_DEFAULTS.
 * Result is reduced to degree < m (i.e., < 2^m).
 */
function naiveReduce(p: number, modPoly: number, m: number): number {
  let r = p >>> 0;
  const degMod = polyDegree(modPoly);
  if (degMod < 0) {
    throw new Error("Invalid modulus polynomial (zero).");
  }

  // While degree(r) >= degree(modPoly), subtract (XOR) shifted modPoly.
  for (let bit = polyDegree(r); bit >= degMod; bit = polyDegree(r)) {
    const shift = bit - degMod;
    r ^= modPoly << shift;
  }

  // Ensure result is strictly within the field (m bits)
  const mask = (1 << m) - 1;
  return r & mask;
}

/**
 * Naive polynomial multiplication over GF(2), reduced mod modPoly.
 */
function naiveMul(a: number, b: number, modPoly: number, m: number): number {
  let res = 0;
  let x = a >>> 0;
  let y = b >>> 0;

  while (y) {
    if (y & 1) res ^= x;
    x <<= 1;
    y >>>= 1;
  }

  return naiveReduce(res, modPoly, m);
}

/**
 * Naive exponentiation using naiveMul.
 * Implements binary exponentiation over GF(2^m).
 */
function naivePow(a: number, n: number, modPoly: number, m: number): number {
  const mask = (1 << m) - 1;
  let base = a & mask;
  let exp = n >>> 0;
  let res = 1; // by convention a^0 = 1 even if a = 0

  while (exp > 0) {
    if (exp & 1) {
      res = naiveMul(res, base, modPoly, m);
    }
    base = naiveMul(base, base, modPoly, m);
    exp >>>= 1;
  }

  return res & mask;
}

/**
 * Naive inverse: brute-force search x such that a * x = 1.
 * Only for nonzero a.
 */
function naiveInv(a: number, modPoly: number, m: number): number {
  if (a === 0) throw new Error("Zero has no inverse.");
  const maxVal = 1 << m;
  for (let x = 1; x < maxVal; x++) {
    if (naiveMul(a, x, modPoly, m) === 1) return x;
  }
  throw new Error(`No inverse found for a=0x${a.toString(16)} in GF(2^${m}).`);
}

/* ---------------- Tests ---------------- */

describe("gfAdd basic correctness", () => {
  test("gfAdd is bitwise XOR on 8-bit range", () => {
    // This covers more than enough to guarantee the XOR behavior in practice.
    for (let a = 0; a < 256; a++) {
      for (let b = 0; b < 256; b++) {
        const expected = (a ^ b) >>> 0;
        const got = gfAdd(a, b);
        expect(got).toBe(expected);

        // Basic field properties as side-checks:
        // a + 0 = a
        expect(gfAdd(a, 0)).toBe(a);
        // a + a = 0 (self-inverse in characteristic 2)
        expect(gfAdd(a, a)).toBe(0);
      }
    }
  });
});

describe("gfMul vs naive polynomial multiplication for all fields in IRRED_DEFAULTS", () => {
  Object.entries(IRRED_DEFAULTS).forEach(([mStr, modPoly]) => {
    const m = Number(mStr);
    const cfg: GFConfig = { m, modPoly };
    const maxVal = 1 << m;

    test(`gfMul matches naiveMul for all a,b in GF(2^${m})`, () => {
      for (let a = 0; a < maxVal; a++) {
        for (let b = 0; b < maxVal; b++) {
          const { value } = gfMul(a, b, cfg);
          const expected = naiveMul(a, b, modPoly, m);
          expect(value).toBe(expected);
        }
      }
    });
  });
});

describe("gfInv correctness and inverse property", () => {
  Object.entries(IRRED_DEFAULTS).forEach(([mStr, modPoly]) => {
    const m = Number(mStr);
    const cfg: GFConfig = { m, modPoly };
    const maxVal = 1 << m;

    test(`gfInv matches naiveInv and a * a^-1 = 1 in GF(2^${m})`, () => {
      for (let a = 1; a < maxVal; a++) {
        const expected = naiveInv(a, modPoly, m);
        const { value: inv } = gfInv(a, cfg);

        // 1) Numeric correctness vs naive inverse
        expect(inv).toBe(expected);

        // 2) Algebraic property: a * a^-1 = 1
        const { value: prod } = gfMul(a, inv, cfg);
        expect(prod).toBe(1);
      }
    });
  });
});

describe("gfPow correctness vs naivePow", () => {
  Object.entries(IRRED_DEFAULTS).forEach(([mStr, modPoly]) => {
    const m = Number(mStr);
    const cfg: GFConfig = { m, modPoly };
    const maxVal = 1 << m;

    test(`gfPow matches naivePow on a strong exponent set in GF(2^${m})`, () => {
      // For small fields we can test all exponents; for larger, use a strong subset
      const exps: number[] =
        m <= 4
          ? Array.from({ length: maxVal }, (_, i) => i) // exhaustive
          : [0, 1, 2, 3, 4, 5, 7, (1 << m) - 1]; // key exponents, including group order - 1

      for (let a = 0; a < maxVal; a++) {
        for (const n of exps) {
          const expected = naivePow(a, n, modPoly, m);
          const { value } = gfPow(a, n, cfg);
          expect(value).toBe(expected);
        }
      }
    });

    test(`gfPow respects group order: a^(2^m - 1) = 1 for nonzero a in GF(2^${m})`, () => {
      const order = (1 << m) - 1;
      for (let a = 1; a < maxVal; a++) {
        const { value } = gfPow(a, order, cfg);
        expect(value).toBe(1);
      }
    });
  });
});

describe("gfMod correctness as polynomial reduction", () => {
  Object.entries(IRRED_DEFAULTS).forEach(([mStr, modPoly]) => {
    const m = Number(mStr);
    const cfg: GFConfig = { m, modPoly };
    const maxVal = 1 << m;

    test(`gfMod matches naiveReduce for polynomials up to degree < 2m in GF(2^${m})`, () => {
      // Values up to 2m bits → integers up to (1 << (2m))
      const upper = 1 << (2 * m); // safe since m <= 8 → up to 16 bits

      for (let x = 0; x < upper; x++) {
        const expected = naiveReduce(x, modPoly, m);
        const { value } = gfMod(x, cfg);
        expect(value).toBe(expected);
      }
    });

    test(`gfMod leaves elements already in GF(2^${m}) unchanged`, () => {
      for (let a = 0; a < maxVal; a++) {
        const { value } = gfMod(a, cfg);
        expect(value).toBe(a);
      }
    });
  });
});

describe("AES-style golden vector sanity checks in GF(2^8)", () => {
  const m = 8;
  const modPoly = IRRED_DEFAULTS[m];
  const cfg: GFConfig = { m, modPoly };

  test("Addition 0x57 + 0x13 = 0x44 (XOR)", () => {
    const a = 0x57;
    const b = 0x13;
    expect(gfAdd(a, b)).toBe(0x44);
  });

  test("Multiplication 0x57 * 0x13 = 0xFE", () => {
    const a = 0x57;
    const b = 0x13;
    const { value } = gfMul(a, b, cfg);
    expect(value).toBe(0xfe);
  });

  test("Power 0x57^2 = 0xA5", () => {
    const a = 0x57;
    const { value } = gfPow(a, 2, cfg);
    expect(value).toBe(0xa5);
  });

  test("Inverse of 0x57 is consistent with a * a^-1 = 1", () => {
    const a = 0x57;
    const { value: inv } = gfInv(a, cfg);
    const { value: prod } = gfMul(a, inv, cfg);
    expect(prod).toBe(1);
  });
});

