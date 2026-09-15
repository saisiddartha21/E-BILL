"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileUp } from 'lucide-react';
import toast from 'react-hot-toast';

// Basic placeholder implementation to satisfy the prompt structure
// In a full app, this would use react-hook-form and shadcn forms
export default function NewPurchasePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    supplierId: "",
    purchaseDate: new Date().toISOString().split('T')[0],
    supplierInvoice: "",
    paymentMode: "CASH",
    paidAmount: 0,
    items: [] as any[]
  });
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetch('/api/suppliers').then(r => r.json()).then(data => setSuppliers(data.data || data.suppliers || []));
    fetch('/api/products').then(r => r.json()).then(data => setProducts(data.products || data));
  }, []);

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: "", quantity: 1, rate: 0, taxableAmount: 0, cgstAmount: 0, sgstAmount: 0, totalAmount: 0 }]
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
  };

  const toDateInput = (value: string) => {
    const parts = value.split(/[/-]/);
    if (parts.length !== 3) return value;
    const [day, month, year] = parts;
    return `${year.length === 2 ? `20${year}` : year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const importInvoice = async (file: File) => {
    setImporting(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/purchases/import', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not read invoice');

      const importedItems = (data.items || []).map((item: any) => {
        const taxableAmount = item.quantity * item.rate;
        const tax = taxableAmount * (item.gstRate || 0) / 100;
        return { ...item, taxableAmount, cgstAmount: tax / 2, sgstAmount: tax / 2, igstAmount: 0, totalAmount: taxableAmount + tax };
      });
      setFormData(prev => ({
        ...prev,
        supplierInvoice: data.invoiceNumber || prev.supplierInvoice,
        purchaseDate: data.date ? toDateInput(data.date) : prev.purchaseDate,
        items: importedItems.length ? importedItems : prev.items,
      }));
      toast.success(importedItems.length ? `Imported ${importedItems.length} product line(s)` : 'Invoice read; add the items below');
    } catch (error: any) {
      toast.error(error.message || 'Could not import invoice');
    } finally {
      setImporting(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdById: "default" // Placeholder
        })
      });
      
      if (res.ok) {
        toast.success("Purchase created successfully");
        router.push('/purchases');
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create purchase");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">New Purchase</h1>
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-blue-900">Add stock from supplier invoice</h2>
            <p className="text-sm text-blue-700">Upload a text-based PDF. Recognized products will be added below for review.</p>
          </div>
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <FileUp className="h-4 w-4" />
            {importing ? 'Reading invoice...' : 'Upload PDF invoice'}
            <input type="file" accept="application/pdf,.pdf" className="hidden" disabled={importing} onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) importInvoice(file);
              event.currentTarget.value = '';
            }} />
          </label>
        </div>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block mb-2 text-sm">Supplier</label>
            <select 
              className="w-full border rounded p-2"
              value={formData.supplierId}
              onChange={e => setFormData({...formData, supplierId: e.target.value})}
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm">Invoice #</label>
            <Input 
              value={formData.supplierInvoice}
              onChange={e => setFormData({...formData, supplierInvoice: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block mb-2 text-sm">Date</label>
            <Input 
              type="date"
              value={formData.purchaseDate}
              onChange={e => setFormData({...formData, purchaseDate: e.target.value})}
              required
            />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Items</h3>
          <Button type="button" onClick={addItem} variant="outline" className="mb-4">Add Item</Button>
          {formData.items.map((item, idx) => (
            <div key={idx} className="flex gap-2 mb-2 items-center">
              <select
                className="border rounded p-2 flex-1"
                value={item.productId}
                onChange={e => {
                  const newItems = [...formData.items];
                  newItems[idx].productId = e.target.value;
                  setFormData({...formData, items: newItems});
                }}
                required
              >
                <option value="">Select Product</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <Input 
                type="number" placeholder="Qty" className="w-24"
                value={item.quantity}
                onChange={e => {
                  const newItems = [...formData.items];
                  newItems[idx].quantity = Number(e.target.value);
                  newItems[idx].taxableAmount = newItems[idx].quantity * newItems[idx].rate;
                  newItems[idx].totalAmount = newItems[idx].taxableAmount * 1.18; // Simple 18% GST dummy
                  setFormData({...formData, items: newItems});
                }}
              />
              <Input 
                type="number" placeholder="Rate" className="w-24"
                value={item.rate}
                onChange={e => {
                  const newItems = [...formData.items];
                  newItems[idx].rate = Number(e.target.value);
                  newItems[idx].taxableAmount = newItems[idx].quantity * newItems[idx].rate;
                  newItems[idx].totalAmount = newItems[idx].taxableAmount * 1.18; // Simple 18% GST dummy
                  setFormData({...formData, items: newItems});
                }}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 text-sm">Paid Amount</label>
            <Input 
              type="number"
              value={formData.paidAmount}
              onChange={e => setFormData({...formData, paidAmount: Number(e.target.value)})}
            />
          </div>
          <div className="flex flex-col items-end justify-center text-xl font-bold">
            Total: ₹{calculateTotal().toFixed(2)}
          </div>
        </div>

        <Button type="submit" className="w-full">Save Purchase</Button>
      </form>
    </div>
  );
}
