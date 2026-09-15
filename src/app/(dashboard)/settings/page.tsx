'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { indianStates } from '@/lib/utils';
// Note: assuming basic form elements available or using standard HTML inputs for simplicity if UI lib isn't fully set up

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(true); // would normally derive from auth context
  
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    async function fetchSettings() {
      const res = await fetch('/api/settings');
      if (res.status === 403) {
        setIsAdmin(false);
      } else if (res.ok) {
        const data = await res.json();
        reset(data);
      }
      setLoading(false);
    }
    fetchSettings();
  }, [reset]);

  const onSubmit = async (data: any) => {
    const { id, createdAt, updatedAt, ...payload } = data;
    
    // Ensure numeric fields are parsed correctly
    if (payload.startingInvoiceNo !== undefined) {
      payload.startingInvoiceNo = parseInt(payload.startingInvoiceNo, 10);
    }

    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert('Settings saved successfully!');
    } else {
      alert('Failed to save settings.');
    }
  };

  if (!isAdmin) {
    return <div className="p-8 text-center text-red-500">Access Denied. Admin only.</div>;
  }

  if (loading) {
    return <div className="p-8 text-center">Loading settings...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div><label className="block text-sm">Name</label><input {...register('companyName')} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">GSTIN</label><input {...register('gstin')} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">Email</label><input {...register('email')} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">Mobile</label><input {...register('mobileNumber')} className="w-full border rounded p-2" /></div>
            <div className="md:col-span-2"><label className="block text-sm">Address</label><textarea {...register('shopAddress')} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">City</label><input {...register('city')} className="w-full border rounded p-2" /></div>
            <div>
              <label className="block text-sm">State</label>
              <select {...register('state')} className="w-full border rounded p-2">
                {indianStates?.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="block text-sm">State Code</label><input {...register('stateCode')} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">Pincode</label><input {...register('pincode')} className="w-full border rounded p-2" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div><label className="block text-sm">Bank Name</label><input {...register('bankName')} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">Account Holder</label><input {...register('accountHolderName')} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">Account Number</label><input {...register('accountNumber')} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">IFSC</label><input {...register('ifscCode')} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">Branch</label><input {...register('bankBranch')} className="w-full border rounded p-2" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Settings</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div><label className="block text-sm">Prefix</label><input {...register('invoicePrefix')} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">Starting Number</label><input type="number" {...register('startingInvoiceNo')} className="w-full border rounded p-2" /></div>
            <div><label className="block text-sm">Financial Year Start</label><input type="date" {...register('financialYearStart')} className="w-full border rounded p-2" /></div>
            <div className="flex items-center space-x-2 pt-6">
              <input type="checkbox" {...register('enableNegativeStock')} id="ens" />
              <label htmlFor="ens" className="text-sm">Enable Negative Stock</label>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><label className="block text-sm">Terms</label><textarea {...register('termsAndConditions')} className="w-full border rounded p-2 h-32" /></div>
            <div><label className="block text-sm">Authorized Signatory Name</label><input {...register('authorizedSignatory')} className="w-full border rounded p-2" /></div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">Save Settings</Button>
        </div>
      </form>
    </div>
  );
}
