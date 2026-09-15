'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CustomerProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [statement, setStatement] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [custRes, stmtRes] = await Promise.all([
        fetch(`/api/customers/${params.id}`),
        fetch(`/api/customers/${params.id}/statement`)
      ]);
      const custData = await custRes.json();
      const stmtData = await stmtRes.json();
      
      setCustomer(custData);
      setStatement(stmtData.statements || []);
    } catch (error) {
      toast.error('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: params.id,
          amount: parseFloat(paymentAmount),
          paymentMode,
          referenceNo: paymentRef,
          paymentType: 'RECEIVED',
        }),
      });

      if (!res.ok) throw new Error('Payment failed');
      
      toast.success('Payment recorded successfully');
      setPaymentDialog(false);
      fetchData(); // Refresh data
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!customer) return <div>Customer not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{customer.name}</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => router.push(`/customers/${customer.id}/edit`)}>Edit</Button>
          <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
            <DialogTrigger asChild>
              <Button>Record Payment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment for {customer.name}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePayment} className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input type="number" step="0.01" required value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={setPaymentMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {['UPI', 'CARD', 'BANK_TRANSFER'].includes(paymentMode) && (
                  <div className="space-y-2">
                    <Label>Reference Number</Label>
                    <Input value={paymentRef} onChange={e => setPaymentRef(e.target.value)} />
                  </div>
                )}
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Saving...' : 'Save Payment'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balance</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${customer.currentBalance > 0 ? 'text-red-500' : 'text-green-600'}`}>
              {formatCurrency(customer.currentBalance)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Invoices</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{customer.invoices?.length || 0}</div></CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2">
          <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Mobile:</span> {customer.mobile}</div>
            <div><span className="text-muted-foreground">GSTIN:</span> {customer.gstin || '-'}</div>
            <div><span className="text-muted-foreground">Type:</span> <Badge>{customer.customerType}</Badge></div>
            <div className="col-span-2"><span className="text-muted-foreground">Address:</span> {customer.billingAddress || '-'}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoice History</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="statement">Statement</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.invoices?.map((inv: any) => (
                  <TableRow key={inv.id}>
                    <TableCell>{formatDate(inv.invoiceDate)}</TableCell>
                    <TableCell>{inv.invoiceNumber}</TableCell>
                    <TableCell>{formatCurrency(inv.grandTotal)}</TableCell>
                    <TableCell><Badge>{inv.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {!customer.invoices?.length && (
                  <TableRow><TableCell colSpan={4} className="text-center">No invoices found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="payments" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.payments?.map((pay: any) => (
                  <TableRow key={pay.id}>
                    <TableCell>{formatDate(pay.paymentDate)}</TableCell>
                    <TableCell>{formatCurrency(pay.amount)}</TableCell>
                    <TableCell>{pay.paymentMode}</TableCell>
                    <TableCell>{pay.referenceNo || '-'}</TableCell>
                  </TableRow>
                ))}
                {!customer.payments?.length && (
                  <TableRow><TableCell colSpan={4} className="text-center">No payments found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="statement" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Particulars</TableHead>
                  <TableHead>Debit (₹)</TableHead>
                  <TableHead>Credit (₹)</TableHead>
                  <TableHead>Balance (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statement.map((s: any, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{formatDate(s.date)}</TableCell>
                    <TableCell>
                      <div>{s.type}</div>
                      <div className="text-xs text-muted-foreground">{s.reference}</div>
                    </TableCell>
                    <TableCell>{s.debit > 0 ? formatCurrency(s.debit) : '-'}</TableCell>
                    <TableCell>{s.credit > 0 ? formatCurrency(s.credit) : '-'}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(s.balance)}</TableCell>
                  </TableRow>
                ))}
                {!statement.length && (
                  <TableRow><TableCell colSpan={5} className="text-center">No transactions found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
