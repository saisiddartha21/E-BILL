'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Search, Plus, Eye, Printer, Download, Trash2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import toast from 'react-hot-toast';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices?page=${page}&search=${search}&status=${status}&paymentStatus=${paymentStatus}`);
      const data = await res.json();
      setInvoices(data.invoices || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load invoices');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, [page, search, status, paymentStatus]);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this invoice? This will revert stock and customer balances.')) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Invoice cancelled successfully');
        fetchInvoices();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to cancel invoice');
      }
    } catch (err) {
      toast.error('Failed to cancel invoice');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
        <Link href="/invoices/new">
          <Button className="bg-primary text-white">
            <Plus className="mr-2 h-4 w-4" /> New Invoice
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice number, customer name..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Payments</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-10">Loading...</TableCell></TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-10">No invoices found</TableCell></TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell>{format(new Date(inv.invoiceDate), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <div>{inv.customerName}</div>
                        <div className="text-xs text-muted-foreground">{inv.customerMobile}</div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(inv.grandTotal)}</TableCell>
                      <TableCell className="text-right text-red-500">{inv.balanceAmount > 0 ? formatCurrency(inv.balanceAmount) : '-'}</TableCell>
                      <TableCell>
                        <Badge variant={inv.paymentStatus === 'PAID' ? 'default' : inv.paymentStatus === 'PARTIAL' ? 'secondary' : 'destructive'} className={inv.paymentStatus === 'PAID' ? 'bg-green-500 hover:bg-green-600' : inv.paymentStatus === 'PARTIAL' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}>
                          {inv.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={inv.status === 'ACTIVE' ? 'outline' : 'destructive'}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <Search className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/invoices/${inv.id}`}><Eye className="mr-2 h-4 w-4"/> View</Link>
                            </DropdownMenuItem>
                            {inv.status === 'ACTIVE' && (
                              <DropdownMenuItem className="text-red-600" onClick={() => handleCancel(inv.id)}>
                                <XCircle className="mr-2 h-4 w-4"/> Cancel Invoice
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
            <span className="text-sm">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
