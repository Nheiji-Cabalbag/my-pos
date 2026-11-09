"use client";
import { useEffect, useState } from "react";
import { supabase, Product } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ProductDialog({ open, product, onClose, onSaved }: {
  open: boolean; product: Product | null; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(product?.product_name ?? ""); setPrice(product ? String(product.product_price) : "");
    setStock(product ? String(product.stock_quantity) : ""); setFile(null); setError("");
  }, [open, product]);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    let image_url = product?.image_url ?? null;
    if (file) {
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const up = await supabase.storage.from("product-images").upload(path, file);
      if (up.error) { setError(up.error.message); setSaving(false); return; }
      image_url = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
    }
    const row = { product_name: name.trim(), product_price: Number(price), stock_quantity: Math.floor(Number(stock)), image_url };
    const res = product ? await supabase.from("products").update(row).eq("id", product.id) : await supabase.from("products").insert(row);
    setSaving(false);
    if (res.error) { setError(res.error.message); return; }
    onSaved(); onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-3">
          <Input placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input type="number" min="0" step="0.01" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} required />
          <Input type="number" min="0" step="1" placeholder="Stock quantity" value={stock} onChange={(e) => setStock(e.target.value)} required />
          <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={saving}>{saving ? "Saving…" : "Save product"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
