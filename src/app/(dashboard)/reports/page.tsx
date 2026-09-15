'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, ShoppingCart, Package, Users, Truck, FileText, IndianRupee } from 'lucide-react';

export default function ReportsHubPage() {
  const reports = [
    { title: 'Sales Reports', description: 'Daily, product-wise, customer-wise sales analysis', icon: TrendingUp, href: '/reports/sales' },
    { title: 'Purchase Reports', description: 'Supplier, product, and date-wise purchases', icon: ShoppingCart, href: '/reports/purchases' },
    { title: 'Stock Reports', description: 'Current stock, valuation, low stock alerts', icon: Package, href: '/reports/stock' },
    { title: 'Customer Reports', description: 'Outstanding balances, customer statements', icon: Users, href: '/reports/customers' },
    { title: 'Supplier Reports', description: 'Supplier outstanding and purchase history', icon: Truck, href: '/reports/suppliers' },
    { title: 'GST Reports', description: 'GSTR-1, HSN summary, and tax analysis', icon: FileText, href: '/reports/gst' },
    { title: 'Profit Report', description: 'Gross profit, margins, COGS analysis', icon: IndianRupee, href: '/reports/profit' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground">View and analyze your business data.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Link key={report.title} href={report.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">{report.title}</CardTitle>
                <report.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>{report.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
