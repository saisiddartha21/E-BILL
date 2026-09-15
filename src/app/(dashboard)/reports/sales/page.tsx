'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function SalesReportsPage() {
  const [data, setData] = useState([]);
  const [tab, setTab] = useState('daily');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchReport = async () => {
    let type = 'sales';
    if (tab === 'product-wise') type = 'sales-product';
    if (tab === 'customer-wise') type = 'sales-customer';
    
    const params = new URLSearchParams({ type });
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const res = await fetch(`/api/reports?${params.toString()}`);
    if (res.ok) {
      setData(await res.json());
    }
  };

  useEffect(() => {
    fetchReport();
  }, [tab, from, to]);

  const handleExport = () => {
    // Simple CSV export
    const csvContent = "data:text/csv;charset=utf-8," + 
      data.map((row: any) => Object.values(row).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${tab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Sales Reports</h2>
        <Button onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export</Button>
      </div>

      <div className="flex gap-4">
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily/Monthly</TabsTrigger>
          <TabsTrigger value="product-wise">Product-wise</TabsTrigger>
          <TabsTrigger value="customer-wise">Customer-wise</TabsTrigger>
        </TabsList>
        
        <TabsContent value={tab} className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={tab === 'daily' ? 'date' : 'name'} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey={tab === 'product-wise' ? 'totalAmount' : 'grandTotal'} fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
