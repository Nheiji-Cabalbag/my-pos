"use client";
import { useEffect, useState } from "react";
import { supabase, Product, Sale, Range, fetchSales, peso, LOW_STOCK } from "@/lib/supabase";
import { RangeTabs } from "@/components/range-tabs";

export default function ReportsPage() {
  const [range, setRange] = useState<Range>("7d");
  const [sales, setSales] = useState<Sale[]>([]);
  const [low, setLow] = useState<Product[]>([]);

  useEffect(() => { fetchSales(range).then(setSales); }, [range]);
  useEffect(() => {
    supabase.from("products").select("*").lte("stock_quantity", LOW_STOCK).order("stock_quantity")
      .then(({ data }) => setLow((data as Product[]) ?? []));
  }, []);

  const revenue = sales.reduce((s, x) => s + Number(x.total_amount), 0);
  const tally: Record<string, { qty: number; amount: number }> = {};
  sales.forEach((s) => s.transaction_items.forEach((i) => {
    const t = (tally[i.product_name] ??= { qty: 0, amount: 0 });
    t.qty += i.quantity; t.amount += Number(i.subtotal);
  }));
  const top = Object.entries(tally).sort((a, b) => b[1].qty - a[1].qty).slice(0, 10);
  const units = top.reduce((s, [, t]) => s + t.qty, 0);
  const stats: [string, string][] = [
    ["Revenue", peso(revenue)], ["Sales", String(sales.length)],
    ["Average sale", peso(sales.length ? revenue / sales.length : 0)],
    ["Units sold", String(Object.values(tally).reduce((s, t) => s + t.qty, 0))],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">Reports</h1>
        <div className="ml-auto"><RangeTabs value={range} onChange={setRange} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-xl font-semibold text-emerald-700">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Best sellers</h2>
          {top.length === 0 ? <p className="text-sm text-slate-500">No sales in this period.</p> : (
            <ul className="space-y-2 text-sm">
              {top.map(([name, t]) => (
                <li key={name}>
                  <div className="flex justify-between"><span>{name}</span><span>{t.qty} sold · {peso(t.amount)}</span></div>
                  <div className="mt-1 h-1.5 rounded bg-slate-100"><div className="h-1.5 rounded bg-emerald-500" style={{ width: `${(t.qty / (top[0][1].qty || 1)) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-semibold">Low on stock</h2>
          {low.length === 0 ? <p className="text-sm text-slate-500">Everything is well stocked.</p> : (
            <ul className="divide-y text-sm">
              {low.map((p) => (
                <li key={p.id} className="flex justify-between py-2">
                  <span>{p.product_name}</span>
                  <span className={p.stock_quantity === 0 ? "font-medium text-red-600" : "font-medium text-amber-600"}>
                    {p.stock_quantity === 0 ? "Out of stock" : `${p.stock_quantity} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
