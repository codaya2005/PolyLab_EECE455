// src/App.tsx
import heroImg from "@/assets/polylab-hero.png";
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  Play,
  ShieldCheck,
  BookOpen,
  Lock,
  Layers,
  Settings,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/ui/Navbar"; // <-- use the shared navbar

/* -------------------- GF(2^8) arithmetic helpers -------------------- */
function xtime(a: number): number {
  a &= 0xff;
  const res = a << 1;
  return ((res & 0x100) ? (res ^ 0x11b) : res) & 0xff;
}
function gfMul(a: number, b: number): number {
  a &= 0xff; b &= 0xff;
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if (b & 1) p ^= a;
    a = xtime(a);
    b >>= 1;
  }
  return p & 0xff;
}
function toHex(v: number): string {
  return "0x" + v.toString(16).toUpperCase().padStart(2, "0");
}

/* ------------------------------ App ------------------------------ */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <Hero />
      <FeatureGrid />
      <LiveDemoSection />
      <Footer />
    </div>
  );
}

/* ----------------------------- Hero ----------------------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_600px_at_80%_-20%,rgba(56,189,248,0.22),transparent)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-extrabold tracking-tight"
          >
            Unlock the Power of{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Finite Fields
            </span>
          </motion.h1>

          <p className="mt-4 text-lg text-slate-300 max-w-xl">
            Explore, compute, and visualize arithmetic in GF(2^m) (m = 2--8). Learn core
            operations, study animated steps, and practice cryptography-grade math on the web.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/signup">
              <Button
                size="lg"
                className="gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900"
              >
                <Calculator className="h-5 w-5" />
                Get Started Free
              </Button>
            </Link>

            <a
              href="https://www.youtube.com/watch?v=tLylCZbrl5U"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                size="lg"
                variant="outline"
                className="gap-2 border-slate-700 text-slate-200"
              >
                <Play className="h-5 w-5" />
                Watch Demo
              </Button>
            </a>
          </div>


          <div className="mt-5 inline-flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2">
            <div className="h-7 w-7 rounded-md grid place-items-center bg-slate-800 text-slate-300">
              <Calculator className="h-4 w-4" />
            </div>
            <span className="font-mono text-slate-200">A = 0x57</span>
            <span className="text-slate-500">|</span>
            <span className="font-mono text-slate-200">Result = 0xFE</span>
          </div>

                   
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <div className="absolute -inset-10 rounded-[28px] blur-3xl bg-cyan-500/10 pointer-events-none" />
          <img
            src={heroImg}
            alt="Glowing 3D chip with binary curve"
            className="
              relative z-10 w-[640px] max-w-none -mt-6 -mr-4
              rounded-[24px]
              shadow-[0_25px_80px_rgba(56,189,248,0.22),0_10px_40px_rgba(59,130,246,0.18)]
            "
            style={{
              objectFit: "cover",
              objectPosition: "center",
              filter: "saturate(1.1) brightness(1.06)",
              WebkitMaskImage:
                "radial-gradient(80% 80% at 70% 30%, black 55%, rgba(0,0,0,0.2) 78%, transparent 100%)",
              maskImage:
                "radial-gradient(80% 80% at 70% 30%, black 55%, rgba(0,0,0,0.2) 78%, transparent 100%)",
            }}
          />
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------- Feature Grid -------------------------- */
function FeatureGrid() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <FeatureCard
            title="Computation Engine"
            desc="Perform arithmetic in GF(2^m) with precision and speed."
            icon={<Calculator className="h-8 w-8" />}
          />
          <FeatureCard
            title="Learning Lab"
            desc="Interactive animations that explain cryptography concepts."
            icon={<BookOpen className="h-8 w-8" />}
          />
          <FeatureCard
            title="Secure Platform"
            desc="Argon2id hashing, MFA, and secure encrypted sessions."
            icon={<ShieldCheck className="h-8 w-8" />}
          />
          <FeatureCard
            title="Management Tool"
            desc="Instructor dashboards for assignments, logs, and analytics."
            icon={<Lock className="h-8 w-8" />}
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border border-slate-800 bg-slate-900/65 hover:bg-slate-900/80 transition-colors shadow-[0_10px_30px_rgba(2,6,23,0.35)]">
      <CardContent className="p-7 h-40 flex items-start">
        <div className="flex gap-4">
          <div className="shrink-0 h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 grid place-items-center text-slate-900 shadow-[0_10px_22px_rgba(56,189,248,0.35)]">
            {icon}
          </div>
          <div className="pt-1">
            <h3 className="font-semibold text-lg leading-6">{title}</h3>
            <p className="text-[0.95rem] leading-6 text-slate-300 mt-1 max-w-sm">{desc}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------ Calculator Section ------------------------ */
function LiveDemoSection() {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card className="rounded-2xl border-slate-800 bg-slate-900/70 backdrop-blur shadow-xl">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-white flex items-center gap-2 rounded-t-2xl">
            <Calculator className="h-5 w-5" />
            <span className="font-medium">
              GF(2^8) Calculator (trial only basic features): AES poly x^8 + x^4 + x^3 + x + 1 (0x11B)
            </span>
          </div>
          <CardContent className="p-6">
            <MiniGF256Demo />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function MiniGF256Demo() {
  const [aHex, setAH] = useState<string>("57");
  const [bHex, setBH] = useState<string>("13");
  const a = useMemo(() => parseInt(aHex || "0", 16) & 0xff, [aHex]);
  const b = useMemo(() => parseInt(bHex || "0", 16) & 0xff, [bHex]);
  const result = useMemo(() => gfMul(a, b), [a, b]);

  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-400">Input A (hex)</label>
          <Input
            value={aHex}
            onChange={(e) => setAH(e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 2))}
            className="mt-1 bg-slate-900/60 border-slate-700 text-slate-100 font-mono"
            placeholder="57"
          />
        </div>
        <div>
          <label className="text-sm text-slate-400">Input B (hex)</label>
          <Input
            value={bHex}
            onChange={(e) => setBH(e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 2))}
            className="mt-1 bg-slate-900/60 border-slate-700 text-slate-100 font-mono"
            placeholder="13"
          />
        </div>
      </div>

      <div className="mt-4 p-4 rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="text-xs uppercase tracking-wide text-slate-400">Result</div>
        <div className="mt-1 flex items-center gap-4">
          <span className="font-mono text-xl">{toHex(result)}</span>
          <Badge variant="outline" className="border-cyan-500/50 text-cyan-300">
            {result.toString(2).padStart(8, "0")} (bin)
          </Badge>
        </div>
        <div className="mt-3 text-sm text-slate-400">
          Using Russian-peasant multiply with reduction by 0x11B.
        </div>
      </div>

      <div className="mt-4 grid sm:grid-cols-3 gap-3">
        <InfoPill icon={<Layers className="h-4 w-4" />} label="Add/Sub = XOR" />
        <InfoPill icon={<Settings className="h-4 w-4" />} label="AES irreducible poly 0x11B" />
        <InfoPill icon={<Sparkles className="h-4 w-4" />} label="Live hex & binary output" />
      </div>
    </div>
  );
}

function InfoPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-slate-300 text-sm">
      {icon}
      <span>{label}</span>
    </div>
  );
}

/* ----------------------------- Footer ----------------------------- */
function Footer() {
  return (
    <footer className="border-t border-slate-800 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-sm text-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 grid place-items-center text-slate-900">
            P
          </div>
          <span className="font-semibold text-slate-200">PolyLab</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <a href="/docs" className="hover:text-slate-200">Docs</a>
          <a href="/security" className="hover:text-slate-200">Security</a>
          <a href="mailto:polylab2026@outlook.com" className="hover:text-slate-200">Contact</a>
        </div>
      </div>
    </footer>
  );
}
