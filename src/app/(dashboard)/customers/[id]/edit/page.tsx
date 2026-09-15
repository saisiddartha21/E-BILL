'use client';
import { useState, useEffect } from 'react';
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
];

export default function EditCustomerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
  });

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await fetch(`/api/customers/${params.id}`);
        if (!res.ok) throw new Error('Failed to fetch customer');
        const data = await res.json();
        
        form.reset({
          name: data.name || '',
          mobile: data.mobile || '',
          alternateMobile: data.alternateMobile || '',
          email: data.email || '',
          billingAddress: data.billingAddress || '',
          shippingAddress: data.shippingAddress || '',
          gstin: data.gstin || '',
          state: data.state || 'Telangana',
          stateCode: data.stateCode || '36',
          pincode: data.pincode || '',
          customerType: data.customerType || 'RETAIL',
          openingBalance: data.openingBalance || 0,
          creditLimit: data.creditLimit || 0,
          notes: data.notes || '',
        });
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [params.id, form]);

  const onSubmit = async (data: z.infer<typeof customerSchema>) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/customers/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update customer');
      }

      toast.success('Customer updated successfully');
      router.push(`/customers/${params.id}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Edit Customer</h1>
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
                <Input {...form.register('name')} />
              </div>

              <div className="space-y-2">
                <Label>Mobile *</Label>
                <Input {...form.register('mobile')} />
              </div>
              
              <div className="space-y-2">
                <Label>GSTIN</Label>
                <Input {...form.register('gstin')} />
              </div>

              <div className="space-y-2">
                <Label>Customer Type</Label>
                <Select 
                  onValueChange={(val) => form.setValue('customerType', val as any)} 
                  defaultValue={form.getValues('customerType')}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RETAIL">Retail</SelectItem>
                    <SelectItem value="BUSINESS">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Billing Address</Label>
                <Textarea {...form.register('billingAddress')} />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Update Customer'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
