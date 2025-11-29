import React from "react";
import { Copy } from "lucide-react";

export default function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = React.useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setOk(true);
      setTimeout(()=>setOk(false), 1200);
    } catch {}
  }
  return (
    <button
      aria-label="Copy join code"
      onClick={copy}
      className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800/60"
    >
      <Copy className="h-3.5 w-3.5" />
      {ok ? "Copied" : "Copy"}
    </button>
  );
}
