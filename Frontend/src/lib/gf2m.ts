// src/lib/gf2m.ts
// Generic GF(2^m) arithmetic with step tracing for visualization.

export type GFConfig = {
  m: number;
  modPoly: number; // irreducible polynomial with top bit at x^m
};

export type Step =
  | {
      kind: "mul";
      i: number;
      bBit: number;
      aBefore: number;
      aAfter: number;
      pBefore: number;
      pAfter: number;
    }
  | {
      kind: "reduce";
      carry: number;
      before: number;
      after: number;
    }
  | {
      kind: "mod";
      before: number;
      after: number;
    }
  | {
      kind: "add";
      op: "add" | "sub";
      a: number;
      b: number;
      result: number;
    }
  | {
      kind: "exp";
      bit: number;
      baseBefore: number;
      baseAfter: number;
      accBefore: number;
      accAfter: number;
    }
  | {
      kind: "egcd";
      a: number;
      b: number;
      q: number;
      r: number;
      t0: number;
      t1: number;
    };

// ---------- Basic helpers ----------

export function gfAdd(a: number, b: number): number {
  // Field addition in characteristic 2 = bitwise XOR
  return (a ^ b) >>> 0;
}

function polyDegree(p: number): number {
  for (let i = 31; i >= 0; i--) {
    if (p & (1 << i)) return i;
  }
  return -1; // zero polynomial
}

// ---------- Modular reduction: polynomial mod irreducible ----------

export function gfMod(
  x: number,
  cfg: GFConfig,
  steps?: Step[]
): { value: number } {
  const { m, modPoly } = cfg;
  const mask = (1 << m) - 1;

  let r = x >>> 0;
  const original = r;

  const degMod = polyDegree(modPoly);
  if (degMod < 0) throw new Error("Invalid modPoly (zero).");

  while (true) {
    const degR = polyDegree(r);
    if (degR < degMod) break;

    const shift = degR - degMod;
    const before = r;
    r ^= modPoly << shift;
    const after = r >>> 0;

    if (steps) {
      steps.push({
        kind: "reduce",
        carry: shift,
        before,
        after,
      });
    }
  }

  const value = r & mask;

  if (steps) {
    steps.push({
      kind: "mod",
      before: original,
      after: value,
    });
  }

  return { value };
}

// ---------- Multiplication ----------

export function gfMul(
  a: number,
  b: number,
  cfg: GFConfig,
  steps?: Step[]
): { value: number } {
  const { m } = cfg;
  const mask = (1 << m) - 1;

  const aa = a & mask;
  const bb = b & mask;

  // Naive polynomial multiply, then reduce with gfMod.
  // We also emit "mul" steps for UI visualization.
  let prod = 0;

  for (let i = 0; i < m; i++) {
    const bBit = (bb >> i) & 1;
    const aBefore = aa; // we conceptually use the same 'a' shifted by i
    const pBefore = prod;

    if (bBit) {
      prod ^= aa << i;
    }

    const pAfter = prod;

    if (steps) {
      steps.push({
        kind: "mul",
        i,
        bBit,
        aBefore,
        aAfter: aBefore, // we don't mutate 'a' itself in this model
        pBefore,
        pAfter,
      });
    }
  }

  // Now reduce the raw polynomial
  const { value } = gfMod(prod, cfg, steps);
  return { value };
}

// ---------- Exponentiation ----------

export function gfPow(
  a: number,
  n: number,
  cfg: GFConfig,
  steps?: Step[]
): { value: number } {
  const { m } = cfg;
  const mask = (1 << m) - 1;

  // By convention, a^0 = 1 even if a = 0
  let acc = 1;
  let base = a & mask;
  let exp = n >>> 0;

  let bitIndex = 0;
  while (exp > 0) {
    const bit = exp & 1;

    if (steps) {
      const baseBefore = base;
      const accBefore = acc;

      // We'll compute after-values by actually doing the operations,
      // but we must log them *after* they happen.
      if (bit) {
        acc = gfMul(acc, base, cfg, steps).value;
      }
      base = gfMul(base, base, cfg, steps).value;

      const baseAfter = base;
      const accAfter = acc;

      steps.push({
        kind: "exp",
        bit,
        baseBefore,
        baseAfter,
        accBefore,
        accAfter,
      });
    } else {
      if (bit) {
        acc = gfMul(acc, base, cfg).value;
      }
      base = gfMul(base, base, cfg).value;
    }

    exp >>>= 1;
    bitIndex++;
  }

  return { value: acc & mask };
}

// ---------- Inverse via extended Euclidean algorithm over GF(2)[x] ----------

export function gfInv(
  a: number,
  cfg: GFConfig,
  steps?: Step[]
): { value: number } {
  const { m, modPoly } = cfg;
  const mask = (1 << m) - 1;

  let u = a & mask;
  if (u === 0) {
    throw new Error("Zero has no multiplicative inverse in GF(2^m).");
  }

  let v = modPoly >>> 0;

  // g1, g2 are "cofactor" polynomials; we want g1 such that g1 * a ≡ 1 (mod modPoly).
  let g1 = 1;
  let g2 = 0;

  const degMod = polyDegree(modPoly);
  if (degMod !== m) {
    // For correctness we expect modPoly to be degree m (as in IRRED_DEFAULTS).
    // Not strictly necessary, but it's a good sanity check.
    // You can remove this throw if you ever use non-standard polys.
  }

  while (u !== 1) {
    const degU = polyDegree(u);
    const degV = polyDegree(v);

    if (degU === -1) {
      // gcd(a, modPoly) != 1 → not invertible; but with irreducible modPoly this should never happen
      throw new Error("gcd(a, modPoly) != 1; inverse does not exist.");
    }

    let shift = degU - degV;
    if (shift < 0) {
      // swap u <-> v and g1 <-> g2
      const tmpU = u;
      u = v;
      v = tmpU;

      const tmpG = g1;
      g1 = g2;
      g2 = tmpG;

      shift = -shift;
    }

    const beforeU = u;
    const beforeV = v;
    const beforeG1 = g1;
    const beforeG2 = g2;

    u ^= v << shift;
    g1 ^= g2 << shift;

    if (steps) {
      steps.push({
        kind: "egcd",
        a: beforeU,
        b: beforeV,
        q: 1 << shift, // in F2, quotient is just x^shift
        r: u,
        t0: beforeG1,
        t1: beforeG2,
      });
    }
  }

  // g1 is now (up to a factor) the inverse polynomial; reduce it modulo modPoly
  const { value } = gfMod(g1, cfg, steps);
  return { value };
}
