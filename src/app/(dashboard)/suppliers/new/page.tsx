'use client';

import { useState } from 'react';
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
import { indianStates } from '@/lib/utils';

const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contactPerson: z.string().optional(),
  mobile: z.string().min(10, 'Valid mobile required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  gstin: z.string().optional(),
  state: z.string().min(1, 'State is required'),
  stateCode: z.string().optional(),
  openingBalance: z.coerce.number().optional().default(0),
  notes: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export default function NewSupplierPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      openingBalance: 0
    }
  });

  const onSubmit = async (data: SupplierFormValues) => {
    try {
      setLoading(true);
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success('Supplier created successfully');
        router.push('/suppliers');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to create supplier');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/suppliers">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add Supplier</h1>
          <p className="text-muted-foreground">Create a new supplier profile</p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Business Name *</Label>
              <Input {...register('name')} placeholder="e.g. ABC Traders" />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input {...register('contactPerson')} placeholder="e.g. Rahul Kumar" />
            </div>

            <div className="space-y-2">
              <Label>Mobile *</Label>
              <Input {...register('mobile')} placeholder="e.g. 9876543210" />
              {errors.mobile && <p className="text-red-500 text-sm">{errors.mobile.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...register('email')} type="email" placeholder="e.g. abc@example.com" />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>GSTIN</Label>
              <Input {...register('gstin')} placeholder="e.g. 29ABCDE1234F1Z5" />
            </div>

            <div className="space-y-2">
              <Label>State *</Label>
              <Select onValueChange={(val) => {
                setValue('state', val);
                const code = indianStates.find(s => s.name === val)?.code || '';
                setValue('stateCode', code);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  {indianStates?.map((state) => (
                    <SelectItem key={state.code} value={state.name}>
                      {state.name} ({state.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && <p className="text-red-500 text-sm">{errors.state.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Opening Balance</Label>
              <Input type="number" step="0.01" {...register('openingBalance')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea {...register('address')} placeholder="Full address..." />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...register('notes')} placeholder="Any additional details..." />
          </div>

          <div className="flex justify-end gap-4">
            <Link href="/suppliers">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Supplier'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
