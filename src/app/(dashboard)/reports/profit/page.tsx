'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfitReportPage() {
  const [profit, setProfit] = useState<any>(null);

  useEffect(() => {
    fetch('/api/reports?type=profit')
      .then(r => r.json())
      .then(setProfit);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Profit Report</h2>
      
      {profit && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Total Sales</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">₹{profit.totalSales?.toFixed(2)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>COGS</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">₹{profit.cogs?.toFixed(2)}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Gross Profit</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">₹{profit.grossProfit?.toFixed(2)}</p></CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
