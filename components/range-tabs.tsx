"use client";
import { Range } from "@/lib/supabase";

const opts: [Range, string][] = [["today", "Today"], ["7d", "7 days"], ["30d", "30 days"], ["all", "All time"]];

export function RangeTabs({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-slate-200/70 p-1 text-sm">
      {opts.map(([k, label]) => (
        <button key={k} onClick={() => onChange(k)}
          className={`rounded-md px-3 py-1.5 ${value === k ? "bg-white font-medium text-emerald-700 shadow-sm" : "text-slate-600"}`}>
          {label}
        </button>
      ))}
    </div>
  );
}
