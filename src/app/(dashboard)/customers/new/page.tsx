'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';
import { customerSchema } from '@/lib/validations';
import * as z from 'zod';

const indianStates = [
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '29', name: 'Karnataka' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '27', name: 'Maharashtra' },
  // Add other states as needed
];

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sameAddress, setSameAddress] = useState(false);

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      mobile: '',
      alternateMobile: '',
      email: '',
      billingAddress: '',
      shippingAddress: '',
      gstin: '',
      state: 'Telangana',
      stateCode: '36',
      pincode: '',
      customerType: 'RETAIL',
      openingBalance: 0,
      creditLimit: 0,
      notes: ''
    }
  });

  const onSubmit = async (data: z.infer<typeof customerSchema>) => {
    if (sameAddress) {
      data.shippingAddress = data.billingAddress;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create customer');
      }

      toast.success('Customer created successfully');
      router.push('/customers');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Add New Customer</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input {...form.register('name')} placeholder="Customer Name" />
                {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Mobile *</Label>
                <Input {...form.register('mobile')} placeholder="10 digit mobile number" />
                {form.formState.errors.mobile && <p className="text-sm text-red-500">{form.formState.errors.mobile.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Customer Type</Label>
                <Select 
                  onValueChange={(val) => form.setValue('customerType', val as any)} 
                  defaultValue={form.getValues('customerType')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RETAIL">Retail</SelectItem>
                    <SelectItem value="BUSINESS">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>GSTIN</Label>
                <Input {...form.register('gstin')} placeholder="15-digit GSTIN" />
                {form.formState.errors.gstin && <p className="text-sm text-red-500">{form.formState.errors.gstin.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Billing Address</Label>
                <Textarea {...form.register('billingAddress')} placeholder="Full billing address" />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <input type="checkbox" id="sameAddr" checked={sameAddress} onChange={(e) => setSameAddress(e.target.checked)} />
                  <label htmlFor="sameAddr" className="text-sm font-medium">Shipping address is same as billing</label>
                </div>
                {!sameAddress && (
                  <Textarea {...form.register('shippingAddress')} placeholder="Full shipping address" />
                )}
              </div>

              <div className="space-y-2">
                <Label>State</Label>
                <Select 
                  onValueChange={(val) => {
                    const state = indianStates.find(s => s.code === val);
                    if (state) {
                      form.setValue('state', state.name);
                      form.setValue('stateCode', state.code);
                    }
                  }} 
                  defaultValue={form.getValues('stateCode')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianStates.map(s => (
                      <SelectItem key={s.code} value={s.code}>{s.name} ({s.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Opening Balance</Label>
                <Input type="number" step="0.01" {...form.register('openingBalance', { valueAsNumber: true })} />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Customer'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
