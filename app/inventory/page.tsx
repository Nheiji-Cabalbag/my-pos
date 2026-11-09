"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase, Product, LOW_STOCK, PRIMARY, peso } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductDialog } from "@/components/product-dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [lowOnly, setLowOnly] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("products").select("*").order("product_name");
    setProducts((data as Product[]) ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function remove() {
    if (!toDelete) return;
    const { error } = await supabase.from("products").delete().eq("id", toDelete.id);
    setError(error?.message ?? ""); setToDelete(null); load();
  }

  async function setStock(p: Product, value: number) {
    const v = Math.max(0, Math.floor(value));
    if (!Number.isFinite(v) || v === p.stock_quantity) return;
    const { error } = await supabase.from("products").update({ stock_quantity: v }).eq("id", p.id);
    setError(error?.message ?? ""); load();
  }

  const lowCount = products.filter((p) => p.stock_quantity <= LOW_STOCK).length;
  const shown = products
    .filter((p) => p.product_name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => !lowOnly || p.stock_quantity <= LOW_STOCK);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <Input placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm bg-white" />
        <Button className={`ml-auto ${PRIMARY}`} onClick={() => { setEditing(null); setFormOpen(true); }}>Add product</Button>
      </div>
      {lowCount > 0 && (
        <button onClick={() => setLowOnly(!lowOnly)} className="mb-4 w-full rounded-lg bg-amber-50 p-3 text-left text-sm text-amber-800">
          {lowCount} product{lowCount === 1 ? " is" : "s are"} low on stock. {lowOnly ? "Show all products" : "Show only these"}
        </button>
      )}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {shown.length === 0 ? (
        <p className="rounded-lg border border-dashed p-10 text-center text-slate-500">
          {products.length === 0 ? "Your inventory is empty. Add your first product." : "No products match your search."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-slate-500">
              <tr><th className="p-3">Product</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3" /></tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="flex items-center gap-3 p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.image_url ? <img src={p.image_url} alt="" className="size-10 rounded object-cover" /> : <div className="size-10 rounded bg-slate-100" />}
                    {p.product_name}
                  </td>
                  <td className="p-3">{peso(p.product_price)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => setStock(p, p.stock_quantity - 1)} disabled={p.stock_quantity === 0}>−</Button>
                      <Input key={p.stock_quantity} type="number" min="0" defaultValue={p.stock_quantity} className="h-8 w-16 text-center"
                        onBlur={(e) => setStock(p, Number(e.target.value))}
                        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
                      <Button size="sm" variant="outline" onClick={() => setStock(p, p.stock_quantity + 1)}>+</Button>
                      {p.stock_quantity <= LOW_STOCK && (
                        <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{p.stock_quantity === 0 ? "Out" : "Low"}</span>
                      )}
                    </div>
                  </td>
                  <td className="space-x-2 p-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(p); setFormOpen(true); }}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => setToDelete(p)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ProductDialog open={formOpen} product={editing} onClose={() => setFormOpen(false)} onSaved={load} />
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {toDelete?.product_name}?</AlertDialogTitle>
            <AlertDialogDescription>This removes the product from your inventory. Past sales keep their records.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
