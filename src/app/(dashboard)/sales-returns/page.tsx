"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function SalesReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReturns();
  }, [search]);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales-returns?search=${search}`);
      const data = await res.json();
      setReturns(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Sales Returns</h1>
        <Link href="/sales-returns/new">
          <Button><Plus className="w-4 h-4 mr-2" /> New Sales Return</Button>
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Search by SR# or Invoice..." 
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
              <TableHead>Return#</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Invoice#</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
            ) : returns.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center">No returns found.</TableCell></TableRow>
            ) : (
              returns.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.returnNumber}</TableCell>
                  <TableCell>{formatDate(r.returnDate)}</TableCell>
                  <TableCell>{r.invoice?.invoiceNumber}</TableCell>
                  <TableCell>{r.customer?.name || 'Cash Customer'}</TableCell>
                  <TableCell>{formatCurrency(r.grandTotal)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">View</Button>
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
