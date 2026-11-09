"use client";
import { useEffect, useState } from "react";
import { Sale, Range, fetchSales, peso, fmtDate } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { RangeTabs } from "@/components/range-tabs";
import { Receipt } from "@/components/receipt";

export default function SalesPage() {
  const [range, setRange] = useState<Range>("today");
  const [sales, setSales] = useState<Sale[]>([]);
  const [view, setView] = useState<Sale | null>(null);

  useEffect(() => { fetchSales(range).then(setSales); }, [range]);
  const total = sales.reduce((s, x) => s + Number(x.total_amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Sales</h1>
        <div className="ml-auto"><RangeTabs value={range} onChange={setRange} /></div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">{sales.length} sale{sales.length === 1 ? "" : "s"}</p>
        <p className="text-2xl font-semibold text-emerald-700">{peso(total)}</p>
      </div>
      {sales.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No sales in this period.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-slate-500">
              <tr><th className="p-3">Date</th><th className="p-3">Items</th><th className="p-3 text-right">Total</th><th className="p-3" /></tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="p-3 whitespace-nowrap">{fmtDate(s.created_at)}</td>
                  <td className="p-3 text-slate-600">{s.transaction_items.map((i) => `${i.quantity}× ${i.product_name}`).join(", ")}</td>
                  <td className="p-3 text-right font-medium">{peso(s.total_amount)}</td>
                  <td className="p-3 text-right"><Button size="sm" variant="outline" onClick={() => setView(s)}>Receipt</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Receipt sale={view} onClose={() => setView(null)} />
    </div>
  );
}
