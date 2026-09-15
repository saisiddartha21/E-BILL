'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function GSTReportsPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/api/reports?type=sales-gst')
      .then(r => r.json())
      .then(setData);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">GST Reports</h2>
      <Card>
        <CardHeader><CardTitle>Tax Summary</CardTitle></CardHeader>
        <CardContent>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
