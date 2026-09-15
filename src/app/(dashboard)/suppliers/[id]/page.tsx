'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SupplierProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const res = await fetch(`/api/suppliers/${params.id}`);
        const data = await res.json();
        if (res.ok) {
          setSupplier(data);
        } else {
          toast.error(data.error || 'Failed to fetch supplier');
        }
      } catch (error) {
        toast.error('An error occurred');
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchSupplier();
  }, [params.id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!supplier) return <div className="p-6">Supplier not found.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/suppliers">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{supplier.name}</h1>
            <p className="text-muted-foreground">{supplier.mobile} {supplier.gstin ? `| GSTIN: ${supplier.gstin}` : ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/payments/new?supplierId=${supplier.id}`}>
            <Button>Record Payment</Button>
          </Link>
          <Link href={`/suppliers/${supplier.id}/edit`}>
            <Button variant="outline"><Edit className="h-4 w-4 mr-2" /> Edit</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-slate-50">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Current Outstanding</h3>
          <p className={`text-3xl font-bold ${supplier.currentBalance > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {formatCurrency(supplier.currentBalance)}
          </p>
          <p className="text-xs text-slate-500 mt-2">Amount you owe to this supplier</p>
        </Card>
        <Card className="p-6 md:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Contact Person</p>
              <p className="font-medium">{supplier.contactPerson || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">State</p>
              <p className="font-medium">{supplier.state || '-'} {supplier.stateCode ? `(${supplier.stateCode})` : ''}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-slate-500">Address</p>
              <p className="font-medium">{supplier.address || '-'}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="purchases">
        <TabsList>
          <TabsTrigger value="purchases">Purchase History</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>
        <TabsContent value="purchases" className="mt-4">
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Purchase #</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.purchases?.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-4">No purchases yet.</TableCell></TableRow>
                ) : (
                  supplier.purchases?.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDate(p.purchaseDate)}</TableCell>
                      <TableCell>{p.purchaseNumber}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(p.grandTotal)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.payments?.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-4">No payments yet.</TableCell></TableRow>
                ) : (
                  supplier.payments?.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{formatDate(p.paymentDate)}</TableCell>
                      <TableCell>{p.paymentMode}</TableCell>
                      <TableCell>{p.referenceNo || '-'}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(p.amount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
