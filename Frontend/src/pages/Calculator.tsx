// src/pages/Calculator.tsx
import React, { useMemo, useState } from "react";
import NavbarUser from "@/components/ui/NavBarUser";
import StudentNavbar from "@/components/ui/StudentNavbar";
import Navbar from "@/components/ui/Navbar";
import { IRRED_DEFAULTS, asPolyString, hex } from "@/lib/irreducibles";
import { gfAdd, gfMul, gfPow, gfInv, gfMod, type GFConfig, type Step } from "@/lib/gf2m";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; // if you have shadcn tabs; otherwise replace
import { Calculator, History, Layers, NotepadText } from "lucide-react";
import bgCircuit from "@/assets/background.png";
import { useAuth } from "@/contexts/AuthContext";

type Op = "add" | "sub" | "mul" | "div" | "inv" | "pow" | "mod";

type HistoryItem = {
  id: string;
  ts: number;
  m: number;
  modPoly: number;
  op: Op;
  a?: number;
  b?: number;
  n?: number;
  result: number;
};

const LS_KEY = "polylab_calc_history_v1";

function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
    } catch {
      return [];
    }
  });
  const save = (list: HistoryItem[]) => {
    setItems(list);
    try { localStorage.setItem(LS_KEY, JSON.stringify(list.slice(-50))); } catch {}
  };
  return {
    items,
    push: (it: HistoryItem) => save([...items, it]),
    clear: () => save([]),
  };
}

export default function CalculatorPage() {
  const { user } = useAuth();
  const [m, setM] = useState<number>(8);
  const [modPoly, setModPoly] = useState<number>(IRRED_DEFAULTS[8]);
  const [op, setOp] = useState<Op>("mul");
  const [aHex, setAHex] = useState("57");
  const [bHex, setBHex] = useState("13");
  const [expN, setExpN] = useState("2");

  const cfg: GFConfig = useMemo(() => ({ m, modPoly }), [m, modPoly]);
  const hexWidth = Math.max(2, Math.ceil(m / 4));

  // parse hex freely, then reduce into GF(2^m)
  const parseHex = (s: string) => parseInt(s || "0", 16) >>> 0;

  const rawA = parseHex(aHex);
  const rawB = parseHex(bHex);
  const nVal = Math.max(0, parseInt(expN || "0", 10) || 0);

  // canonical field elements: reduce once mod the irreducible polynomial
  const aField = gfMod(rawA, cfg).value;
  const bField = gfMod(rawB, cfg).value;

  const steps: Step[] = [];
  let result = 0;

  switch (op) {
    case "add":
    case "sub": {
      // addition/subtraction = XOR in GF(2^m) on reduced elements
      result = gfAdd(aField, bField);
      steps.push({
        kind: "add",
        op,
        a: aField,
        b: bField,
        result,
      });
      break;
    }
    case "mul": {
      result = gfMul(aField, bField, cfg, steps).value;
      break;
    }
    case "div": {
      const invRes = gfInv(bField, cfg, steps);
      const mulRes = gfMul(aField, invRes.value, cfg, steps);
      result = mulRes.value;
      break;
    }
    case "inv": {
      result = gfInv(aField, cfg, steps).value;
      break;
    }
    case "pow": {
      result = gfPow(aField, nVal, cfg, steps).value;
      break;
    }
    case "mod": {
      // reduce the raw polynomial to show non-trivial reduction steps
      result = gfMod(rawA, cfg, steps).value;
      break;
    }
  }

  const { items, push, clear } = useHistory();

  function handleCalculate() {
    push({
      id: crypto.randomUUID(),
      ts: Date.now(),
      m,
      modPoly,
      op,
      a: ["add", "sub", "mul", "div", "pow", "mod"].includes(op) ? aField : undefined,
      b: ["add", "sub", "mul", "div"].includes(op) ? bField : undefined,
      n: op === "pow" ? nVal : undefined,
      result,
    });
  }

  function rerun(it: HistoryItem) {
    setM(it.m);
    setModPoly(it.modPoly);
    setOp(it.op);
    if (it.a !== undefined) setAHex(it.a.toString(16).toUpperCase());
    if (it.b !== undefined) setBHex(it.b.toString(16).toUpperCase());
    if (it.n !== undefined) setExpN(String(it.n));
  }

  // reset default poly if m changes
  function onChangeM(next: number) {
    setM(next);
    setModPoly(IRRED_DEFAULTS[next] ?? modPoly);
  }

  const navbar = user
    ? user.role === "student"
      ? <StudentNavbar />
      : <NavbarUser email={user.email} role={user.role} />
    : <Navbar />;

  return (
        <div className="relative min-h-screen text-slate-100">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${bgCircuit})` }}
      />

      {/* Dark overlay so content is readable (optional) */}
      <div className="absolute inset-0 bg-slate-950/65" />
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {navbar}

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* LEFT: Controls */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-cyan-400" /> Controls & Inputs
            </h2>

            {/* Field selector */}
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-1">Select Field Size (m)</label>
              <select
                value={m}
                onChange={(e) => onChangeM(parseInt(e.target.value))}
                className="w-full h-11 rounded-lg bg-slate-900/70 border border-slate-700/70 px-3"
              >
                {Array.from({ length: 7 }, (_, i) => 2 + i).map((mm) => (
                  <option key={mm} value={mm}>
                    m = {mm}
                  </option>
                ))}
              </select>
            </div>

            {/* Irreducible poly */}
            <div className="mb-5">
              <label className="block text-sm text-slate-300 mb-1">Irreducible Polynomial (hex)</label>
              <Input
                value={hex(modPoly).slice(2)}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^0-9a-fA-F]/g, "");
                  const parsed = parseInt(clean || "0", 16) >>> 0;
                  setModPoly(parsed);
                }}
                className="h-11 bg-slate-900/70 border-slate-700/70"
              />
              <div className="mt-1 text-xs text-slate-400">
                Polynomial: <span className="font-mono">{asPolyString(modPoly)}</span> ? Default AES for m=8 is 0x11B
              </div>
            </div>

            {/* Operation picker */}
            <div className="mb-5">
              <label className="block text-sm text-slate-300 mb-2">Operation Picker</label>
              <div className="flex flex-wrap gap-2">
                {(["add", "sub", "mul", "div", "inv", "pow", "mod"] as Op[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => setOp(k)}
                    className={`px-3 py-2 rounded-md text-sm border ${
                      op === k ? "border-cyan-500/60 bg-cyan-500/10" : "border-slate-700 hover:bg-slate-800/60"
                    }`}
                  >
                    {({
                      add: "Add (XOR)",
                      sub: "Subtract (XOR)",
                      mul: "Multiply",
                      div: "Divide",
                      inv: "Inverse",
                      pow: "Power",
                      mod: "Modular Reduction",
                    } as Record<Op, string>)[k]}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* A */}
              <div>
                <label className="block text-sm text-slate-300 mb-1">Input A (Hex)</label>
                <Input
                  value={aHex}
                  onChange={(e) =>
                    setAHex(
                      e.target.value
                        .replace(/[^0-9a-fA-F]/g, "")
                        .slice(0, 8)
                    )
                  }
                  className="h-11 bg-slate-900/70 border-slate-700/70 font-mono"
                />
                <div className="mt-1 text-xs text-slate-400">Binary: 0b{aField.toString(2).padStart(m, "0")}</div>
              </div>

              {/* B */}
              {["add", "sub", "mul", "div"].includes(op) && (
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Input B (Hex)</label>
                  <Input
                    value={bHex}
                    onChange={(e) =>
                      setBHex(
                        e.target.value
                          .replace(/[^0-9a-fA-F]/g, "")
                          .slice(0, 8)
                      )
                    }
                    className="h-11 bg-slate-900/70 border-slate-700/70 font-mono"
                  />
                  <div className="mt-1 text-xs text-slate-400">Binary: 0b{bField.toString(2).padStart(m, "0")}</div>
                </div>
              )}

              {/* N */}
              {op === "pow" && (
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Exponent (N)</label>
                  <Input
                    value={expN}
                    onChange={(e) => setExpN(e.target.value.replace(/\D/g, "").slice(0, 9))}
                    className="h-11 bg-slate-900/70 border-slate-700/70"
                    placeholder="e.g. 13"
                  />
                </div>
              )}
            </div>

            <Button onClick={handleCalculate} className="mt-6 h-11 gap-2 bg-cyan-500 text-slate-900 hover:bg-cyan-400">
              <Calculator className="h-5 w-5" />
              Calculate
            </Button>
          </section>

          {/* RIGHT: Results, Steps, History */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-cyan-400" /> Results, Steps & History
            </h2>

            <Tabs defaultValue="value" className="w-full">
              <TabsList className="bg-slate-800/60">
                <TabsTrigger value="value">Value</TabsTrigger>
                <TabsTrigger value="steps">Steps</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="value" className="mt-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                  <div className="text-5xl font-extrabold tracking-wider text-cyan-300 font-mono">
                    {hex(result, hexWidth)}
                  </div>
                  <div className="mt-3 space-y-1 text-slate-300">
                    <div>Binary: <span className="font-mono">0b{result.toString(2).padStart(m, "0")}</span></div>
                    <div>Decimal: <span className="font-mono">{result}</span></div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="steps" className="mt-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2 text-sm">
                  {steps.length === 0 && <div className="text-slate-400">No step trace for this operation.</div>}
                  {steps.map((s, i) => (
                    <div key={i} className="font-mono text-slate-300">
                      {s.kind === "mul" && (
                        <>[i={s.i}] bBit={s.bBit} ? A:{hex(s.aBefore)}?{hex(s.aAfter)} ? P:{hex(s.pBefore)}?{hex(s.pAfter)}</>
                      )}
                      {s.kind === "reduce" && <>[reduce] carry={s.carry} ? {hex(s.before)}?{hex(s.after)}</>}
                      {s.kind === "mod" && <>[mod] {hex(s.before)}?{hex(s.after)}</>}
                      {s.kind === "add" && (
                        <>[add] {s.op.toUpperCase()} {hex(s.a)} + {hex(s.b)} = {hex(s.result)}</>
                      )}
                      {s.kind === "exp" && (
                        <>[exp] bit={s.bit} ? base:{hex(s.baseBefore)}?{hex(s.baseAfter)} ? acc:{hex(s.accBefore)}?{hex(s.accAfter)}</>
                      )}
                      {s.kind === "egcd" && (
                        <>[egcd] u={hex(s.a)} v={hex(s.b)} q={hex(s.q)} r={hex(s.r)} t0={hex(s.t0)} t1={hex(s.t1)}</>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex items-center gap-2 text-slate-200 mb-2">
                    <NotepadText className="h-5 w-5 text-cyan-400" /> Mathematical Explanation
                  </div>
                  <p className="text-slate-300 leading-7">
                    In GF(2^m), addition and subtraction are bitwise XOR. Multiplication uses shift-and-add with
                    reduction by the chosen irreducible polynomial (e.g., AES 0x11B for m=8). Inverse is computed via
                    the Extended Euclidean Algorithm over GF(2)[x]; power uses binary exponentiation.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* History */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-300">Calculation History</h3>
                <Button variant="outline" onClick={clear} className="h-8 px-3 border-slate-700 text-slate-200">
                  Clear History
                </Button>
              </div>
              <div className="space-y-2">
                {items.length === 0 && <div className="text-sm text-slate-400">No history yet.</div>}
                {items
                  .slice()
                  .reverse()
                  .map((it) => (
                    <div
                      key={it.id}
                      className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 flex items-center justify-between text-sm"
                    >
                      <div className="text-slate-300">
                        <div className="font-mono">
                          Op: {it.op.toUpperCase()}, Field: GF(2^{it.m}), A: {it.a !== undefined ? hex(it.a) : "?"}
                          {["add", "sub", "mul", "div"].includes(it.op) && <> , B: {it.b !== undefined ? hex(it.b!) : "?"}</>}
                          {it.op === "pow" && <> , N: {it.n}</>}
                          , Result: {hex(it.result, hexWidth)}
                        </div>
                        <div className="text-slate-500">{new Date(it.ts).toLocaleString()}</div>
                      </div>
                      <Button variant="outline" className="h-8 px-3 border-slate-700 text-slate-200" onClick={() => rerun(it)}>
                        Re-run
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
    </div>
  );
}


