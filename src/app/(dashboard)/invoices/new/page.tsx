'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Search, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import toast from 'react-hot-toast';

export default function NewInvoicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Header Details
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [placeOfSupply, setPlaceOfSupply] = useState('36-Telangana');

  // Customer / Billed To Details
  const [customerType, setCustomerType] = useState('CASH');
  const [customer, setCustomer] = useState({
    id: null as string | null,
    name: 'Cash Customer',
    mobile: 'N/A',
    address: '',
    gstin: 'URD',
    state: 'Telangana',
    stateCode: '36'
  });
  
  // Items
  const [items, setItems] = useState<any[]>([
    {
      productId: null,
      productName: 'SWR Pipe 4" x 3m',
      hsnCode: '3917',
      unit: 'NOS',
      quantity: 30,
      rate: 480.00,
      gstRate: 18,
      discountPercent: 0
    }
  ]);

  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [paidAmount, setPaidAmount] = useState(0);

  // Auto-generate invoice number on mount
  useEffect(() => {
    async function fetchNextNumber() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const settings = await res.json();
          const now = new Date();
          const currentMonth = now.getMonth() + 1;
          const currentYear = now.getFullYear();
          const fy = currentMonth >= 4
            ? `${currentYear.toString().slice(-2)}-${(currentYear + 1).toString().slice(-2)}`
            : `${(currentYear - 1).toString().slice(-2)}-${currentYear.toString().slice(-2)}`;
          const padded = ((settings.currentInvoiceNo || 0) + 1).toString().padStart(4, '0');
          setInvoiceNumber(`${settings.invoicePrefix || 'SVE'}/${fy}/${padded}`);
        }
      } catch (e) {
        setInvoiceNumber('SVE/26-27/0001');
      }
    }
    fetchNextNumber();
  }, []);

  // Totals Calculation
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalTaxable = 0;
    let totalTax = 0;

    const calcItems = items.map(item => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const gstRate = Number(item.gstRate) || 0;
      const disc = Number(item.discountPercent) || 0;

      const lineTotal = qty * rate;
      const lineDisc = (lineTotal * disc) / 100;
      const taxable = lineTotal - lineDisc;
      const tax = (taxable * gstRate) / 100;
      const totalAmount = taxable + tax;

      subtotal += lineTotal;
      totalTaxable += taxable;
      totalTax += tax;

      return { ...item, taxable, tax, totalAmount };
    });

    const preRoundTotal = totalTaxable + totalTax;
    const grandTotal = Math.round(preRoundTotal);
    const roundOff = grandTotal - preRoundTotal;

    return { subtotal, totalTaxable, totalTax, roundOff, grandTotal, calcItems };
  }, [items]);

  useEffect(() => {
    if (paymentMode !== 'CREDIT') {
      setPaidAmount(totals.grandTotal);
    } else {
      setPaidAmount(0);
    }
  }, [totals.grandTotal, paymentMode]);

  const handleProductSearch = async (query: string) => {
    setProductSearch(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.products || []);
      }
    } catch (e) {}
  };

  const addItemFromCatalog = (product: any) => {
    setItems([...items, {
      productId: product.id,
      productName: product.name,
      hsnCode: product.hsnCode || '3917',
      unit: product.unit || 'NOS',
      quantity: 1,
      rate: product.sellingPrice,
      gstRate: product.gstRate || 18,
      discountPercent: 0
    }]);
    setProductSearch('');
    setSearchResults([]);
  };

  const addBlankItem = () => {
    setItems([...items, {
      productId: null,
      productName: 'New Item Description',
      hsnCode: '3917',
      unit: 'NOS',
      quantity: 1,
      rate: 100,
      gstRate: 18,
      discountPercent: 0
    }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (items.length === 0) return toast.error('Please add at least one item');
    setLoading(true);
    
    const payload = {
      invoiceNumber,
      invoiceDate,
      placeOfSupply,
      customerId: customer.id,
      customerName: customer.name,
      customerMobile: customer.mobile,
      customerAddress: customer.address,
      customerGstin: customer.gstin,
      customerStateCode: customer.stateCode,
      items: totals.calcItems.map(i => ({
        productId: i.productId,
        productName: i.productName,
        hsnCode: i.hsnCode,
        quantity: Number(i.quantity),
        rate: Number(i.rate),
        unit: i.unit,
        gstRate: Number(i.gstRate),
        discountPercent: Number(i.discountPercent),
        discountAmount: (Number(i.quantity) * Number(i.rate) * Number(i.discountPercent)) / 100,
      })),
      paymentMode,
      paidAmount: Number(paidAmount)
    };

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save invoice');
      }
      
      const savedInvoice = await res.json();
      toast.success('Invoice created successfully!');
      router.push(`/invoices/${savedInvoice.id}`);
    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-4 rounded-2xl border border-white/10 backdrop-blur-xl text-white shadow-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Tax Invoice</h1>
          <p className="text-xs text-slate-400">Complete control over every header, customer, and itemized field</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading || items.length === 0} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold shadow-glow-gold">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save & Generate Invoice'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Entry Area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Controls (Invoice No, Date, Place of Supply) */}
          <Card className="bg-slate-900/70 border-white/10 text-white backdrop-blur-xl">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-base font-bold text-amber-400 flex items-center gap-2">
                <Sparkles size={16} /> 1. Invoice Header Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300 font-semibold">Invoice Number</Label>
                <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="SVE/26-27/0002" className="bg-slate-800/80 border-slate-700 text-white font-mono font-bold" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300 font-semibold">Invoice Date</Label>
                <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="bg-slate-800/80 border-slate-700 text-white font-medium" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300 font-semibold">Place of Supply</Label>
                <Input value={placeOfSupply} onChange={e => setPlaceOfSupply(e.target.value)} placeholder="36-Telangana" className="bg-slate-800/80 border-slate-700 text-white font-medium" />
              </div>
            </CardContent>
          </Card>

          {/* Billed To Customer Details */}
          <Card className="bg-slate-900/70 border-white/10 text-white backdrop-blur-xl">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-base font-bold text-cyan-400">
                2. Billed To Customer Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex gap-4 items-center">
                <Select value={customerType} onValueChange={(val) => { setCustomerType(val); if(val==='CASH') setCustomer({...customer, name: 'Cash Customer', gstin: 'URD', mobile: 'N/A'}); }}>
                  <SelectTrigger className="w-[180px] bg-slate-800/80 border-slate-700 text-white"><SelectValue placeholder="Customer Type" /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    <SelectItem value="CASH">Walk-in / Cash Customer</SelectItem>
                    <SelectItem value="CUSTOM">Custom Billed To</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300 font-semibold">Customer Name</Label>
                  <Input value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} placeholder="Cash Customer" className="bg-slate-800/80 border-slate-700 text-white font-medium" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300 font-semibold">GSTIN</Label>
                  <Input value={customer.gstin} onChange={e => setCustomer({...customer, gstin: e.target.value})} placeholder="URD or 36AAAAA0000A1Z5" className="bg-slate-800/80 border-slate-700 text-white font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300 font-semibold">Phone</Label>
                  <Input value={customer.mobile} onChange={e => setCustomer({...customer, mobile: e.target.value})} placeholder="N/A or 9876543210" className="bg-slate-800/80 border-slate-700 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Search & Custom Item Adder */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="Search catalog products..." 
                className="pl-10 bg-slate-900/80 border-slate-700 text-white placeholder:text-slate-500 rounded-xl"
                value={productSearch}
                onChange={(e) => handleProductSearch(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div className="absolute top-12 left-0 w-full bg-slate-900 border border-slate-700 shadow-2xl z-30 max-h-[250px] overflow-y-auto rounded-xl">
                  {searchResults.map((p) => (
                    <div key={p.id} className="p-3 border-b border-slate-800 hover:bg-slate-800/80 cursor-pointer flex justify-between items-center text-white" onClick={() => addItemFromCatalog(p)}>
                      <div>
                        <div className="font-semibold text-sm">{p.name}</div>
                        <div className="text-xs text-slate-400">HSN: {p.hsnCode}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-amber-400">₹{p.sellingPrice}</div>
                        <div className="text-xs text-emerald-400">GST: {p.gstRate}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={addBlankItem} variant="outline" className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/50 rounded-xl">
              <Plus className="mr-2 h-4 w-4" /> Add Blank Row
            </Button>
          </div>

          {/* Itemized Table */}
          <Card className="bg-slate-900/70 border-white/10 text-white backdrop-blur-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-base font-bold text-emerald-400">
                3. Itemized Tax Invoice Table
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5 text-slate-400">
                    <TableHead className="w-12 text-slate-300">#</TableHead>
                    <TableHead className="min-w-[220px] text-slate-300">Description of Goods</TableHead>
                    <TableHead className="w-[110px] text-slate-300">HSN/SAC</TableHead>
                    <TableHead className="w-[90px] text-center text-slate-300">Qty</TableHead>
                    <TableHead className="w-[110px] text-right text-slate-300">Rate</TableHead>
                    <TableHead className="w-[90px] text-center text-slate-300">GST %</TableHead>
                    <TableHead className="w-[120px] text-right text-slate-300 font-bold">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {totals.calcItems.map((item, idx) => (
                    <TableRow key={idx} className="border-white/5">
                      <TableCell className="font-mono text-slate-400">{idx + 1}</TableCell>
                      <TableCell>
                        <Input 
                          value={item.productName} 
                          onChange={(e) => updateItem(idx, 'productName', e.target.value)} 
                          className="h-9 bg-slate-800/80 border-slate-700 text-white font-medium" 
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          value={item.hsnCode} 
                          onChange={(e) => updateItem(idx, 'hsnCode', e.target.value)} 
                          className="h-9 bg-slate-800/80 border-slate-700 text-white font-mono" 
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          min="1" 
                          value={item.quantity} 
                          onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} 
                          className="h-9 bg-slate-800/80 border-slate-700 text-white text-center font-bold" 
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          step="0.01"
                          value={item.rate} 
                          onChange={(e) => updateItem(idx, 'rate', Number(e.target.value))} 
                          className="h-9 bg-slate-800/80 border-slate-700 text-white text-right font-mono" 
                        />
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={String(item.gstRate)} 
                          onValueChange={(val) => updateItem(idx, 'gstRate', Number(val))}
                        >
                          <SelectTrigger className="h-9 bg-slate-800/80 border-slate-700 text-white font-mono"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700 text-white">
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="5">5%</SelectItem>
                            <SelectItem value="12">12%</SelectItem>
                            <SelectItem value="18">18%</SelectItem>
                            <SelectItem value="28">28%</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right font-bold text-amber-400 font-mono text-base">
                        {item.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} className="text-rose-400 hover:bg-rose-500/10 h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-slate-900/80 border-white/10 text-white backdrop-blur-2xl shadow-2xl">
            <CardHeader className="border-b border-white/5 pb-3">
              <CardTitle className="text-base font-bold text-amber-400">
                Invoice Total Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between text-sm text-slate-300">
                <span>Subtotal</span>
                <span className="font-mono">₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-300">
                <span>Total Tax (GST)</span>
                <span className="font-mono">₹{totals.totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Round Off</span>
                <span className="font-mono">{totals.roundOff > 0 ? '+' : ''}{totals.roundOff.toFixed(2)}</span>
              </div>

              <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                <span className="text-lg font-bold text-white">Grand Total</span>
                <span className="text-3xl font-black text-amber-400 font-mono">
                  ₹{totals.grandTotal.toFixed(2)}
                </span>
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-xs space-y-1">
                <span className="text-slate-400 font-semibold block uppercase tracking-wider">Amount in Words</span>
                <span className="text-amber-300 font-medium italic block">
                  Rupees {totals.grandTotal} Only
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Status */}
          <Card className="bg-slate-900/80 border-white/10 text-white backdrop-blur-2xl">
            <CardHeader className="border-b border-white/5 pb-3">
              <CardTitle className="text-base font-bold text-slate-200">
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {['CASH', 'UPI', 'CARD', 'CREDIT'].map(mode => (
                  <Button 
                    key={mode} 
                    type="button"
                    variant={paymentMode === mode ? 'default' : 'outline'}
                    className={paymentMode === mode ? 'bg-amber-500 hover:bg-amber-600 text-white font-bold' : 'border-slate-700 text-slate-300'}
                    onClick={() => setPaymentMode(mode)}
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button 
            size="lg" 
            className="w-full h-14 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-white font-bold text-lg rounded-2xl shadow-glow-gold transition-all duration-300" 
            onClick={handleSave} 
            disabled={loading || items.length === 0}
          >
            {loading ? <Loader2 className="animate-spin" /> : 'SAVE & PRINT INVOICE'}
          </Button>
        </div>
      </div>
    </div>
  );
}
