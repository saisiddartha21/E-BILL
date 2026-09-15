'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Truck, Plus, Search, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/suppliers?page=${page}&search=${search}`);
      const data = await res.json();
      if (res.ok) {
        setSuppliers(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error(data.error || 'Failed to fetch suppliers');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSuppliers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, page]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Truck className="h-8 w-8" /> Suppliers
          </h1>
          <p className="text-muted-foreground">Manage your suppliers and vendors</p>
        </div>
        <Link href="/suppliers/new">
          <Button><Plus className="h-4 w-4 mr-2" /> Add Supplier</Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search by name, mobile, or GSTIN..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-4">Loading...</TableCell></TableRow>
              ) : suppliers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-4">No suppliers found.</TableCell></TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.contactPerson || '-'}</TableCell>
                    <TableCell>{supplier.mobile}</TableCell>
                    <TableCell>{supplier.gstin || '-'}</TableCell>
                    <TableCell className={`text-right font-medium ${supplier.currentBalance > 0 ? 'text-red-500' : ''}`}>
                      {formatCurrency(supplier.currentBalance)}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Link href={`/suppliers/${supplier.id}`}>
                          <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        <Link href={`/suppliers/${supplier.id}/edit`}>
                          <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="text-sm">Page {page} of {totalPages}</span>
            <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
