'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, Plus, ArrowLeft, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const typeQuery = filterType ? `&paymentType=${filterType}` : '';
      const res = await fetch(`/api/payments?page=${page}${typeQuery}`);
      const data = await res.json();
      if (res.ok) {
        setPayments(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error(data.error || 'Failed to fetch payments');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, filterType]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8" /> Payments
          </h1>
          <p className="text-muted-foreground">Manage incoming and outgoing payments</p>
        </div>
        <Link href="/payments/new">
          <Button><Plus className="h-4 w-4 mr-2" /> Record Payment</Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <select 
            className="p-2 border rounded-md"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Types</option>
            <option value="RECEIVED">Received</option>
            <option value="MADE">Made</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Ref / Inv #</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-4">Loading...</TableCell></TableRow>
              ) : payments.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-4">No payments found.</TableCell></TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell>
                      <Badge variant="outline"
                             className={payment.paymentType === 'RECEIVED' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-orange-100 text-orange-800 border-orange-200'}>
                        {payment.paymentType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.paymentType === 'RECEIVED' ? payment.customer?.name : payment.supplier?.name}
                    </TableCell>
                    <TableCell>
                      {payment.invoice?.invoiceNumber || payment.referenceNo || '-'}
                    </TableCell>
                    <TableCell>{payment.paymentMode}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(payment.amount)}
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
