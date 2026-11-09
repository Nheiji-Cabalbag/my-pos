import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error("Missing Supabase env vars. Check .env.local and restart npm run dev.");
}

// Only the public key is used here. Never put the secret key in frontend code.
export const supabase = createClient(url, key);

export type Product = {
  id: string;
  product_name: string;
  product_price: number;
  stock_quantity: number;
  image_url: string | null;
};
export type SaleItem = { product_name: string; quantity: number; unit_price: number; subtotal: number };
export type Sale = { id: string; total_amount: number; created_at: string; transaction_items: SaleItem[] };

export const LOW_STOCK = 5;
export const PRIMARY = "bg-emerald-600 text-white hover:bg-emerald-700";
export const peso = (n: number) =>
  `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const fmtDate = (s: string) =>
  new Date(s).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });

export type Range = "today" | "7d" | "30d" | "all";
export function sinceDate(r: Range): string | null {
  if (r === "all") return null;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (r === "7d") d.setDate(d.getDate() - 6);
  if (r === "30d") d.setDate(d.getDate() - 29);
  return d.toISOString();
}
export async function fetchSales(r: Range): Promise<Sale[]> {
  let q = supabase.from("transactions").select("*, transaction_items(*)").order("created_at", { ascending: false });
  const s = sinceDate(r);
  if (s) q = q.gte("created_at", s);
  const { data } = await q;
  return (data as Sale[]) ?? [];
}
