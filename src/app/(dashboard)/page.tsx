'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  IndianRupee, ShoppingCart, TrendingDown, TrendingUp, Package, 
  AlertTriangle, Users, FilePlus, UserPlus, PackagePlus, CreditCard, 
  RefreshCw, ArrowUpRight, ShieldAlert, CheckCircle2 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line } from 'recharts';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) {
          throw new Error('Dashboard request failed');
        }
        setData(await res.json());
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-slate-200" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-28 rounded-xl bg-white border border-slate-200 shadow-2xs" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md border border-slate-200 bg-white text-center text-slate-900 shadow-md">
          <CardContent className="space-y-4 p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Failed to Load Dashboard</h2>
              <p className="mt-1 text-xs text-slate-500">
                Could not connect to the backend server.
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-2xs"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header & New Invoice Action Button */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Executive Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time overview of sales, stock, receivables, and accounting.
          </p>
        </div>

        <Link 
          href="/invoices/new" 
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <FilePlus size={16} />
          Create New Invoice
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Clean White Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Today's Sales */}
        <Card className="bg-white border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Today's Sales
              </span>
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(data.todaySales)}
            </div>
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              {data.todayInvoiceCount} sales invoices generated today
            </p>
          </CardContent>
        </Card>

        {/* Monthly Sales */}
        <Card className="bg-white border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Monthly Sales
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(data.monthlySales)}
            </div>
            <p className="mt-1 text-[11px] text-emerald-600 font-medium">
              Cumulative gross revenue
            </p>
          </CardContent>
        </Card>

        {/* Total Purchases */}
        <Card className="bg-white border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Purchases
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(data.monthlyPurchases)}
            </div>
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              Procurement this billing cycle
            </p>
          </CardContent>
        </Card>

        {/* Outstanding Receivables */}
        <Card className="bg-white border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Receivables
              </span>
              <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(data.totalOutstanding)}
            </div>
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              Outstanding credit balance
            </p>
          </CardContent>
        </Card>

        {/* Supplier Payables */}
        <Card className="bg-white border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Supplier Payables
              </span>
              <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(data.supplierPayables)}
            </div>
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              Accounts payable liabilities
            </p>
          </CardContent>
        </Card>

        {/* Total Products */}
        <Card className="bg-white border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Catalog Items
              </span>
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
              {data.totalProducts}
            </div>
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              Active SKU count in inventory
            </p>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="bg-white border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Stock Alerts
              </span>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${data.lowStockCount > 0 ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                {data.lowStockCount > 0 ? <ShieldAlert className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              </div>
            </div>
            <div className={`mt-2 text-2xl font-bold tracking-tight ${data.lowStockCount > 0 ? "text-rose-600" : "text-slate-900"}`}>
              {data.lowStockCount}
            </div>
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              {data.lowStockCount > 0 ? "Items below reorder threshold" : "All SKUs safely stocked"}
            </p>
          </CardContent>
        </Card>

        {/* Total Customers */}
        <Card className="bg-white border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Customers
              </span>
              <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
              {data.totalCustomers}
            </div>
            <p className="mt-1 text-[11px] text-slate-500 font-medium">
              Registered buyers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: "New Invoice", icon: FilePlus, href: "/invoices/new", color: "text-blue-600 bg-blue-50" },
          { label: "Add Customer", icon: UserPlus, href: "/customers/new", color: "text-teal-600 bg-teal-50" },
          { label: "Add Product", icon: PackagePlus, href: "/products/new", color: "text-emerald-600 bg-emerald-50" },
          { label: "Purchase Stock", icon: ShoppingCart, href: "/purchases/new", color: "text-amber-600 bg-amber-50" },
          { label: "Record Payment", icon: IndianRupee, href: "/payments/new", color: "text-purple-600 bg-purple-50" },
        ].map((act, i) => {
          const Icon = act.icon;
          return (
            <Link
              key={i}
              href={act.href}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs hover:border-slate-300 hover:bg-slate-50/80 transition-colors"
            >
              <div className={`p-2 rounded-lg ${act.color}`}>
                <Icon size={18} />
              </div>
              <span className="text-xs font-semibold text-slate-800">
                {act.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Clean White Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Sales Bar Chart */}
        <Card className="border border-slate-200 bg-white text-slate-900 shadow-2xs rounded-xl">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
              <span>Daily Sales (Last 7 Days)</span>
              <span className="text-[10px] font-mono font-semibold text-blue-600 uppercase">TREND ANALYSIS</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: "#64748b", fontSize: 11 }} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", color: "#0f172a", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                  formatter={(value) => [formatCurrency(value as number), "Sales"]} 
                />
                <Bar dataKey="sales" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Sales Area Chart */}
        <Card className="border border-slate-200 bg-white text-slate-900 shadow-2xs rounded-xl">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
              <span>Monthly Sales Trajectory</span>
              <span className="text-[10px] font-mono font-semibold text-emerald-600 uppercase">6-MONTH CURVE</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlySalesChart}>
                <defs>
                  <linearGradient id="areaGradientLight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: "#64748b", fontSize: 11 }} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", color: "#0f172a" }}
                  formatter={(value) => [formatCurrency(value as number), "Revenue"]} 
                />
                <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} fill="url(#areaGradientLight)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 5 Selling Products */}
        <Card className="border border-slate-200 bg-white text-slate-900 shadow-2xs rounded-xl">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
              <span>Top 5 Selling Products</span>
              <span className="text-[10px] font-mono font-semibold text-amber-600 uppercase">HIGH DEMAND</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={data.topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11, fill: "#64748b" }} stroke="#94a3b8" />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", color: "#0f172a" }}
                />
                <Bar dataKey="quantity" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales vs Purchases Comparison */}
        <Card className="border border-slate-200 bg-white text-slate-900 shadow-2xs rounded-xl">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
              <span>Sales vs Purchases Balance</span>
              <span className="text-[10px] font-mono font-semibold text-blue-600 uppercase">FINANCIAL RATIO</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.salesVsPurchases}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: "#64748b", fontSize: 11 }} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", color: "#0f172a" }}
                  formatter={(value) => formatCurrency(value as number)} 
                />
                <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} dot={{ r: 3, fill: "#2563eb" }} />
                <Line type="monotone" dataKey="purchases" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: "#f59e0b" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Clean White Recent Tables */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Sales Invoices */}
        <Card className="border border-slate-200 bg-white text-slate-900 shadow-2xs rounded-xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
              <span>Recent Sales Invoices</span>
              <Link 
                href="/invoices" 
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
              >
                VIEW ALL →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-100">
                  <TableHead className="text-slate-600 text-xs">Invoice #</TableHead>
                  <TableHead className="text-slate-600 text-xs">Date</TableHead>
                  <TableHead className="text-slate-600 text-xs">Customer</TableHead>
                  <TableHead className="text-slate-600 text-xs">Amount</TableHead>
                  <TableHead className="text-slate-600 text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentInvoices.map((inv: any) => (
                  <TableRow key={inv.id} className="border-slate-100 hover:bg-slate-50 transition-colors">
                    <TableCell>
                      <Link 
                        href={`/invoices/${inv.id}`} 
                        className="text-blue-600 font-mono font-medium hover:underline text-xs"
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs">{formatDate(inv.invoiceDate)}</TableCell>
                    <TableCell className="text-slate-800 font-medium text-xs">{inv.customer?.name}</TableCell>
                    <TableCell className="text-emerald-700 font-bold text-xs">{formatCurrency(inv.grandTotal)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                        {inv.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Purchases */}
        <Card className="border border-slate-200 bg-white text-slate-900 shadow-2xs rounded-xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
              <span>Recent Purchases</span>
              <Link 
                href="/purchases" 
                className="text-xs text-amber-600 hover:text-amber-700 font-semibold"
              >
                VIEW ALL →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-100">
                  <TableHead className="text-slate-600 text-xs">Purchase #</TableHead>
                  <TableHead className="text-slate-600 text-xs">Date</TableHead>
                  <TableHead className="text-slate-600 text-xs">Supplier</TableHead>
                  <TableHead className="text-slate-600 text-xs">Amount</TableHead>
                  <TableHead className="text-slate-600 text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentPurchases.map((pur: any) => (
                  <TableRow key={pur.id} className="border-slate-100 hover:bg-slate-50 transition-colors">
                    <TableCell>
                      <Link 
                        href={`/purchases/${pur.id}`} 
                        className="text-amber-600 font-mono font-medium hover:underline text-xs"
                      >
                        {pur.purchaseNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs">{formatDate(pur.purchaseDate)}</TableCell>
                    <TableCell className="text-slate-800 font-medium text-xs">{pur.supplier?.name}</TableCell>
                    <TableCell className="text-amber-700 font-bold text-xs">{formatCurrency(pur.grandTotal)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                        {pur.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

