import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/ui/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import bgCircuit from "@/assets/background.png";
import { verifyEmail, ApiError } from "@/lib/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") ?? "");
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) setToken(urlToken);
  }, [searchParams]);


  return (
    <div className="relative min-h-screen text-slate-100">
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${bgCircuit})` }}
      />
      <div className="absolute inset-0 bg-slate-950/70" />

      <div className="relative">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-6 shadow">
            <h1 className="text-2xl font-bold tracking-tight">Email Verified!</h1>
            <p className="mt-2 text-slate-300">
              Go back to the login page and sign in with your verified email.
            </p>


           
           
          </div>
        </main>
      </div>
    </div>
  );
}
