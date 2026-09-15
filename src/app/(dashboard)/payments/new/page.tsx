'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import { paymentModes } from '@/lib/utils';

const paymentSchema = z.object({
  paymentType: z.enum(['RECEIVED', 'MADE']),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  paymentMode: z.string().min(1, 'Payment mode is required'),
  referenceNo: z.string().optional(),
  paymentDate: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

export default function NewPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [parties, setParties] = useState<any[]>([]);
  const [loadingParties, setLoadingParties] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentType: 'RECEIVED',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'CASH'
    }
  });

  const paymentType = watch('paymentType');
  const partyId = watch(paymentType === 'RECEIVED' ? 'customerId' : 'supplierId');

  useEffect(() => {
    const fetchParties = async () => {
      setLoadingParties(true);
      try {
        const endpoint = paymentType === 'RECEIVED' ? '/api/customers?limit=100' : '/api/suppliers?limit=100';
        const res = await fetch(endpoint);
        const data = await res.json();
        setParties(paymentType === 'RECEIVED' ? (data.customers || data.data || []) : (data.suppliers || data.data || []));
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingParties(false);
      }
    };
    fetchParties();
    setValue('customerId', undefined);
    setValue('supplierId', undefined);
  }, [paymentType, setValue]);

  const selectedParty = parties.find(p => p.id === partyId);

  const onSubmit = async (data: PaymentFormValues) => {
    if (paymentType === 'RECEIVED' && !data.customerId) return toast.error('Select a customer');
    if (paymentType === 'MADE' && !data.supplierId) return toast.error('Select a supplier');

    try {
      setLoading(true);
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success('Payment recorded successfully');
        router.push('/payments');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to record payment');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/payments">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Record Payment</h1>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label>Payment Type</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="RECEIVED" {...register('paymentType')} />
                Received (From Customer)
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="MADE" {...register('paymentType')} />
                Made (To Supplier)
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{paymentType === 'RECEIVED' ? 'Customer' : 'Supplier'} *</Label>
            <Select onValueChange={(val) => setValue(paymentType === 'RECEIVED' ? 'customerId' : 'supplierId', val)}>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${paymentType === 'RECEIVED' ? 'Customer' : 'Supplier'}`} />
              </SelectTrigger>
              <SelectContent>
                {parties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.mobile ? `(${p.mobile})` : ''} - Bal: ₹{p.currentBalance}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!partyId && <p className="text-red-500 text-sm">Please select a party</p>}
          </div>

          {selectedParty && (
            <div className="p-3 bg-slate-50 rounded-md border text-sm">
              Current Balance: <span className="font-bold">₹{selectedParty.currentBalance}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input type="number" step="0.01" {...register('amount')} placeholder="0.00" />
              {errors.amount && <p className="text-red-500 text-sm">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Payment Date *</Label>
              <Input type="date" {...register('paymentDate')} />
              {errors.paymentDate && <p className="text-red-500 text-sm">{errors.paymentDate.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Payment Mode *</Label>
              <Select onValueChange={(val) => setValue('paymentMode', val)} defaultValue="CASH">
                <SelectTrigger>
                  <SelectValue placeholder="Select Mode" />
                </SelectTrigger>
                <SelectContent>
                  {paymentModes?.map((mode) => (
                    <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                  )) || (
                    <>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reference No (Optional)</Label>
              <Input {...register('referenceNo')} placeholder="Transaction ID, Cheque No..." />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...register('notes')} placeholder="Payment remarks..." />
          </div>

          <div className="flex justify-end gap-4">
            <Link href="/payments">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading || !partyId}>
              {loading ? 'Saving...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
