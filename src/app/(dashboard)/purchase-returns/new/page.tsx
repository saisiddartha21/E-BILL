"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

export default function NewPurchaseReturnPage() {
  const router = useRouter();
  const [purchaseId, setPurchaseId] = useState("");
  const [purchase, setPurchase] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [reason, setReason] = useState("");

  const fetchPurchase = async () => {
    try {
      const res = await fetch(`/api/purchases/${purchaseId}`);
      if (res.ok) {
        const data = await res.json();
        setPurchase(data);
        setReturnItems(data.items.map((i: any) => ({
          ...i,
          productName: i.product?.name || 'Product',
          returnQty: 0
        })));
      } else {
        toast.error("Purchase not found");
      }
    } catch (e) {
      toast.error("Error fetching purchase");
    }
  };

  const handleQtyChange = (id: string, qty: number) => {
    setReturnItems(items => items.map(i => {
      if (i.id === id) {
        const val = Math.min(Math.max(0, qty), i.quantity); 
        return { ...i, returnQty: val };
      }
      return i;
    }));
  };

  const onSubmit = async () => {
    const itemsToReturn = returnItems.filter(i => i.returnQty > 0).map(i => {
      const taxable = i.returnQty * i.rate;
      // using simple dummy GST calc, replace with precise logic based on gstRate
      const gstAmt = (taxable * (i.gstRate || 18)) / 100;
      return {
        productId: i.productId,
        productName: i.productName,
        quantity: i.returnQty,
        rate: i.rate,
        taxableAmount: taxable,
        gstRate: i.gstRate || 18,
        cgstAmount: gstAmt / 2,
        sgstAmount: gstAmt / 2,
        igstAmount: 0,
        totalAmount: taxable + gstAmt
      };
    });

    if (itemsToReturn.length === 0) {
      toast.error("Select at least one item to return");
      return;
    }

    try {
      const res = await fetch('/api/purchase-returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseId: purchase.id,
          items: itemsToReturn,
          reason
        })
      });

      if (res.ok) {
        toast.success("Purchase Return created");
        router.push('/purchase-returns');
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create return");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">New Purchase Return</h1>

      <div className="flex gap-4">
        <Input 
          placeholder="Enter Purchase ID" 
          value={purchaseId} 
          onChange={e => setPurchaseId(e.target.value)} 
        />
        <Button onClick={fetchPurchase}>Find Purchase</Button>
      </div>

      {purchase && (
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 border rounded">
            <p><strong>Purchase #:</strong> {purchase.purchaseNumber}</p>
            <p><strong>Supplier:</strong> {purchase.supplier?.name}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Items to Return</h3>
            {returnItems.map(item => (
              <div key={item.id} className="flex gap-4 items-center mb-2 p-2 border rounded">
                <span className="flex-1">{item.productName} (Max: {item.quantity})</span>
                <span>Rate: {item.rate}</span>
                <Input 
                  type="number" 
                  className="w-24" 
                  value={item.returnQty} 
                  onChange={e => handleQtyChange(item.id, Number(e.target.value))} 
                  min="0" max={item.quantity} 
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm mb-1">Reason for Return</label>
            <Input value={reason} onChange={e => setReason(e.target.value)} required />
          </div>

          <Button onClick={onSubmit} className="w-full">Submit Return</Button>
        </div>
      )}
    </div>
  );
}
