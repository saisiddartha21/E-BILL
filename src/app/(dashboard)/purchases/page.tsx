"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchases();
  }, [search]);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/purchases?search=${search}`);
      const data = await res.json();
      setPurchases(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Purchases</h1>
        <Link href="/purchases/new">
          <Button><Plus className="w-4 h-4 mr-2" /> New Purchase</Button>
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search by ID or Supplier..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Purchase#</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Invoice#</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center">Loading...</TableCell></TableRow>
            ) : purchases.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center">No purchases found.</TableCell></TableRow>
            ) : (
              purchases.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.purchaseNumber}</TableCell>
                  <TableCell>{formatDate(p.purchaseDate)}</TableCell>
                  <TableCell>{p.supplier?.name}</TableCell>
                  <TableCell>{p.supplierInvoice}</TableCell>
                  <TableCell>{formatCurrency(p.grandTotal)}</TableCell>
                  <TableCell>
                    <Badge variant={p.paymentStatus === 'PAID' ? 'default' : p.paymentStatus === 'PARTIAL' ? 'secondary' : 'destructive'}>
                      {p.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/purchases/${p.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
