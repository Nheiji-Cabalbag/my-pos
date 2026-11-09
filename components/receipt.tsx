"use client";
import { Sale, peso, fmtDate, PRIMARY } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function Receipt({ sale, cash, onClose }: { sale: Sale | null; cash?: number; onClose: () => void }) {
  return (
    <Dialog open={!!sale} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Receipt</DialogTitle></DialogHeader>
        {sale && (
          <div id="receipt" className="bg-white font-mono text-xs text-slate-800">
            <p className="text-center text-sm font-bold">MY STORE</p>
            <p className="text-center">{fmtDate(sale.created_at)}</p>
            <p className="mb-2 text-center">Receipt #{sale.id.slice(0, 8).toUpperCase()}</p>
            <div className="border-y border-dashed py-2">
              {sale.transaction_items.map((i, k) => (
                <div key={k} className="flex justify-between gap-2">
                  <span>{i.quantity} x {i.product_name} @ {peso(i.unit_price)}</span>
                  <span>{peso(i.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-sm font-bold"><span>TOTAL</span><span>{peso(sale.total_amount)}</span></div>
            {cash !== undefined && (<>
              <div className="flex justify-between"><span>Cash</span><span>{peso(cash)}</span></div>
              <div className="flex justify-between"><span>Change</span><span>{peso(cash - sale.total_amount)}</span></div>
            </>)}
            <p className="mt-3 text-center">Thank you!</p>
          </div>
        )}
        <Button className={PRIMARY} onClick={() => window.print()}>Print receipt</Button>
      </DialogContent>
    </Dialog>
  );
}
