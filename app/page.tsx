"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase, Product, Sale, peso, PRIMARY } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Receipt } from "@/components/receipt";

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [payOpen, setPayOpen] = useState(false);
  const [cash, setCash] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ sale: Sale; cash: number } | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("products").select("*").order("product_name");
    setProducts((data as Product[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const byId = Object.fromEntries(products.map((p) => [p.id, p]));
  const lines = Object.entries(cart).filter(([id]) => byId[id]).map(([id, qty]) => ({ p: byId[id], qty }));
  const total = lines.reduce((s, l) => s + l.p.product_price * l.qty, 0);
  const cashNum = Number(cash);
  const shown = products.filter((p) => p.product_name.toLowerCase().includes(search.toLowerCase()));

  function change(p: Product, delta: number) {
    setCart((c) => {
      const next = Math.min(p.stock_quantity, Math.max(0, (c[p.id] ?? 0) + delta));
      const copy = { ...c };
      if (next === 0) delete copy[p.id]; else copy[p.id] = next;
      return copy;
    });
  }

  async function checkout() {
    setBusy(true); setError("");
    const items = lines.map((l) => ({ product_id: l.p.id, quantity: l.qty }));
    const { data, error } = await supabase.rpc("checkout", { items });
    setBusy(false);
    if (error) { setError(error.message); load(); return; }
    const sale: Sale = {
      id: data as string, total_amount: total, created_at: new Date().toISOString(),
      transaction_items: lines.map((l) => ({ product_name: l.p.product_name, quantity: l.qty, unit_price: l.p.product_price, subtotal: l.p.product_price * l.qty })),
    };
    setDone({ sale, cash: cashNum }); setPayOpen(false); setCart({}); setCash(""); load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section>
        <Input placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 max-w-sm bg-white" />
        {shown.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            {products.length === 0 ? "No products yet. Add some in Inventory." : "No products match your search."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {shown.map((p) => (
              <button key={p.id} disabled={p.stock_quantity === 0} onClick={() => change(p, 1)}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:border-emerald-400 disabled:opacity-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.image_url ? <img src={p.image_url} alt={p.product_name} className="aspect-square w-full object-cover" />
                  : <div className="flex aspect-square items-center justify-center bg-emerald-50 text-xs text-emerald-400">No image</div>}
                <div className="p-3">
                  <p className="truncate text-sm font-medium">{p.product_name}</p>
                  <p className="font-semibold text-emerald-700">{peso(p.product_price)}</p>
                  <p className={`text-xs ${p.stock_quantity <= 5 ? "text-amber-600" : "text-slate-500"}`}>
                    {p.stock_quantity === 0 ? "Out of stock" : `${p.stock_quantity} left`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <aside className="h-fit rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-6">
        <h2 className="mb-3 font-semibold">Current order</h2>
        {lines.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">Tap a product to add it.</p> : (
          <ul className="space-y-3">
            {lines.map(({ p, qty }) => (
              <li key={p.id} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate">{p.product_name}</span>
                <Button size="sm" variant="outline" onClick={() => change(p, -1)}>−</Button>
                <span className="w-6 text-center">{qty}</span>
                <Button size="sm" variant="outline" onClick={() => change(p, 1)} disabled={qty >= p.stock_quantity}>+</Button>
                <span className="w-20 text-right">{peso(p.product_price * qty)}</span>
                <Button size="sm" variant="ghost" aria-label="Remove" onClick={() => change(p, -qty)}>✕</Button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex justify-between border-t pt-3 text-sm text-slate-600"><span>Subtotal</span><span>{peso(total)}</span></div>
        <div className="flex justify-between text-lg font-semibold"><span>Total</span><span>{peso(total)}</span></div>
        <Button className={`mt-4 w-full ${PRIMARY}`} disabled={lines.length === 0} onClick={() => { setError(""); setCash(""); setPayOpen(true); }}>Checkout</Button>
      </aside>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Complete sale</DialogTitle></DialogHeader>
          <p className="text-2xl font-semibold">{peso(total)}</p>
          <Input type="number" min="0" placeholder="Cash received" value={cash} onChange={(e) => setCash(e.target.value)} autoFocus />
          <Button variant="outline" onClick={() => setCash(String(total))}>Exact amount</Button>
          <p className="text-sm text-slate-600">Change: <b>{cash && cashNum >= total ? peso(cashNum - total) : "—"}</b></p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className={PRIMARY} disabled={busy || !cash || cashNum < total} onClick={checkout}>
            {busy ? "Saving…" : "Complete sale"}
          </Button>
        </DialogContent>
      </Dialog>
      <Receipt sale={done?.sale ?? null} cash={done?.cash} onClose={() => setDone(null)} />
    </div>
  );
}
