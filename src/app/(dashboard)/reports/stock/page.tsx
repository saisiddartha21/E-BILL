'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function StockReportsPage() {
  const [stock, setStock] = useState([]);

  useEffect(() => {
    fetch('/api/reports?type=stock-current')
      .then(r => r.json())
      .then(setData => setStock(setData));
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Stock Reports</h2>
      <Card>
        <CardHeader><CardTitle>Current Stock</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Purchase Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category?.name}</TableCell>
                  <TableCell>{item.currentStock}</TableCell>
                  <TableCell>₹{item.purchasePrice?.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
