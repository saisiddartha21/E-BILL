'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  notes: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export default function EditSupplierPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema)
  });

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const res = await fetch(`/api/suppliers/${params.id}`);
        const data = await res.json();
        if (res.ok) {
          reset(data);
          setValue('state', data.state); // Ensure select displays correctly
        } else {
          toast.error('Failed to fetch supplier');
        }
      } catch (error) {
        toast.error('An error occurred');
      } finally {
        setFetching(false);
      }
    };
    if (params.id) fetchSupplier();
  }, [params.id, reset, setValue]);

  const onSubmit = async (data: SupplierFormValues) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/suppliers/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success('Supplier updated successfully');
        router.push(`/suppliers/${params.id}`);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update supplier');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/suppliers/${params.id}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Supplier</h1>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Business Name *</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input {...register('contactPerson')} />
            </div>

            <div className="space-y-2">
              <Label>Mobile *</Label>
              <Input {...register('mobile')} />
              {errors.mobile && <p className="text-red-500 text-sm">{errors.mobile.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...register('email')} type="email" />
            </div>

            <div className="space-y-2">
              <Label>GSTIN</Label>
              <Input {...register('gstin')} />
            </div>

            <div className="space-y-2">
              <Label>State *</Label>
              <Select onValueChange={(val) => {
                setValue('state', val);
                const code = indianStates.find(s => s.name === val)?.code || '';
                setValue('stateCode', code);
              }} defaultValue={watch('state')}>
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
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea {...register('address')} />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...register('notes')} />
          </div>

          <div className="flex justify-end gap-4">
            <Link href={`/suppliers/${params.id}`}>
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Update Supplier'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
