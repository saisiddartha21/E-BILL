"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';

export default function NewSalesReturnPage() {
  const router = useRouter();
  const [invoiceId, setInvoiceId] = useState("");
  const [invoice, setInvoice] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [reason, setReason] = useState("");

  const fetchInvoice = async () => {
    try {
      // Dummy fetch implementation, should be an actual search API for invoices
      const res = await fetch(`/api/invoices/${invoiceId}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
        setReturnItems(data.items.map((i: any) => ({
          ...i,
          returnQty: 0
        })));
      } else {
        toast.error("Invoice not found");
      }
    } catch (e) {
      toast.error("Error fetching invoice");
    }
  };

  const handleQtyChange = (id: string, qty: number) => {
    setReturnItems(items => items.map(i => {
      if (i.id === id) {
        const val = Math.min(Math.max(0, qty), i.quantity); // can't return more than sold
        return { ...i, returnQty: val };
      }
      return i;
    }));
  };

  const onSubmit = async () => {
    const itemsToReturn = returnItems.filter(i => i.returnQty > 0).map(i => {
      const taxable = i.returnQty * i.rate;
      const cgstAmount = (taxable * i.cgstRate) / 100;
      const sgstAmount = (taxable * i.sgstRate) / 100;
      const igstAmount = (taxable * i.igstRate) / 100;
      return {
        productId: i.productId,
        productName: i.productName,
        quantity: i.returnQty,
        rate: i.rate,
        taxableAmount: taxable,
        gstRate: i.gstRate,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalAmount: taxable + cgstAmount + sgstAmount + igstAmount
      };
    });

    if (itemsToReturn.length === 0) {
      toast.error("Select at least one item to return");
      return;
    }

    try {
      const res = await fetch('/api/sales-returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          items: itemsToReturn,
          reason
        })
      });

      if (res.ok) {
        toast.success("Sales Return created");
        router.push('/sales-returns');
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
      <h1 className="text-3xl font-bold">New Sales Return</h1>

      <div className="flex gap-4">
        <Input 
          placeholder="Enter Invoice ID" 
          value={invoiceId} 
          onChange={e => setInvoiceId(e.target.value)} 
        />
        <Button onClick={fetchInvoice}>Find Invoice</Button>
      </div>

      {invoice && (
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 border rounded">
            <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
            <p><strong>Customer:</strong> {invoice.customer?.name || invoice.customerName}</p>
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
