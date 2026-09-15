"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function PurchaseDetailPage() {
  const params = useParams();
  const [purchase, setPurchase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/purchases/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setPurchase(data);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!purchase || purchase.error) return <div className="p-6 text-red-500">Purchase not found</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Purchase #{purchase.purchaseNumber}</h1>
        <Button variant="outline" onClick={() => window.print()}>Print</Button>
      </div>

      <div className="grid grid-cols-2 gap-6 bg-white p-6 rounded-lg border shadow-sm">
        <div>
          <p className="text-sm text-gray-500">Supplier</p>
          <p className="font-semibold text-lg">{purchase.supplier?.name}</p>
          <p>{purchase.supplier?.mobile}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Purchase Details</p>
          <p>Date: {formatDate(purchase.purchaseDate)}</p>
          <p>Invoice: {purchase.supplierInvoice}</p>
          <Badge className="mt-2" variant={purchase.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
            {purchase.paymentStatus}
          </Badge>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Taxable</TableHead>
              <TableHead>GST</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchase.items.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell>{item.product?.name}</TableCell>
                <TableCell>{item.quantity} {item.unit}</TableCell>
                <TableCell>{formatCurrency(item.rate)}</TableCell>
                <TableCell>{formatCurrency(item.taxableAmount)}</TableCell>
                <TableCell>{formatCurrency(item.cgstAmount + item.sgstAmount + item.igstAmount)}</TableCell>
                <TableCell>{formatCurrency(item.totalAmount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg border flex justify-end">
        <div className="w-64 space-y-2 text-right">
          <p className="flex justify-between"><span>Subtotal:</span> <span>{formatCurrency(purchase.subtotal)}</span></p>
          <p className="flex justify-between"><span>Tax Amount:</span> <span>{formatCurrency(purchase.totalTax)}</span></p>
          <p className="flex justify-between font-bold text-xl mt-4 pt-4 border-t"><span>Total:</span> <span>{formatCurrency(purchase.grandTotal)}</span></p>
          <p className="flex justify-between text-green-600"><span>Paid:</span> <span>{formatCurrency(purchase.paidAmount)}</span></p>
          <p className="flex justify-between text-red-600"><span>Pending:</span> <span>{formatCurrency(purchase.pendingAmount)}</span></p>
        </div>
      </div>
    </div>
  );
}
