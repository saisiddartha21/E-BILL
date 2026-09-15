import prisma from '@/lib/db';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, subMonths, format } from 'date-fns';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const today = new Date();
    const sToday = startOfDay(today);
    const eToday = endOfDay(today);
    const sMonth = startOfMonth(today);
    const eMonth = endOfMonth(today);

    // Run independent database queries in parallel with Promise.all
    const [
      todaySalesData,
      monthlySalesData,
      monthlyPurchasesData,
      customerOutstanding,
      supplierPayables,
      totalProducts,
      products,
      totalCustomers,
      dailyInvoices,
      monthlyInvoices,
      monthlyPurchasesList,
      recentInvoices,
      recentPurchases,
      topSalesItems,
    ] = await Promise.all([
      prisma.salesInvoice.aggregate({
        where: { invoiceDate: { gte: sToday, lte: eToday }, status: 'ACTIVE' },
        _sum: { grandTotal: true },
        _count: { id: true },
      }),
      prisma.salesInvoice.aggregate({
        where: { invoiceDate: { gte: sMonth, lte: eMonth }, status: 'ACTIVE' },
        _sum: { grandTotal: true },
      }),
      prisma.purchase.aggregate({
        where: { purchaseDate: { gte: sMonth, lte: eMonth } },
        _sum: { grandTotal: true },
      }),
      prisma.customer.aggregate({
        where: { currentBalance: { gt: 0 } },
        _sum: { currentBalance: true },
      }),
      prisma.supplier.aggregate({
        where: { currentBalance: { gt: 0 } },
        _sum: { currentBalance: true },
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { currentStock: true, minStockLevel: true },
      }),
      prisma.customer.count(),
      prisma.salesInvoice.findMany({
        where: { invoiceDate: { gte: startOfDay(subDays(today, 6)), lte: eToday }, status: 'ACTIVE' },
        select: { invoiceDate: true, grandTotal: true },
      }),
      prisma.salesInvoice.findMany({
        where: { invoiceDate: { gte: startOfMonth(subMonths(today, 5)), lte: eMonth }, status: 'ACTIVE' },
        select: { invoiceDate: true, grandTotal: true },
      }),
      prisma.purchase.findMany({
        where: { purchaseDate: { gte: startOfMonth(subMonths(today, 5)), lte: eMonth } },
        select: { purchaseDate: true, grandTotal: true },
      }),
      prisma.salesInvoice.findMany({
        take: 10,
        orderBy: { invoiceDate: 'desc' },
        include: { customer: { select: { name: true } } },
      }),
      prisma.purchase.findMany({
        take: 5,
        orderBy: { purchaseDate: 'desc' },
        include: { supplier: { select: { name: true } } },
      }),
      prisma.salesInvoiceItem.groupBy({
        by: ['productName'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    const lowStockCount = products.filter(p => p.currentStock <= p.minStockLevel).length;

    // Build Daily Sales map for last 7 days
    const dailySalesMap = new Map();
    for (let i = 6; i >= 0; i--) {
      dailySalesMap.set(format(subDays(today, i), 'MMM dd'), 0);
    }
    for (const inv of dailyInvoices) {
      const dStr = format(inv.invoiceDate, 'MMM dd');
      if (dailySalesMap.has(dStr)) {
        dailySalesMap.set(dStr, dailySalesMap.get(dStr) + inv.grandTotal);
      }
    }
    const dailySales = Array.from(dailySalesMap.entries()).map(([date, sales]) => ({ date, sales }));

    // Build Monthly Sales & Purchases map for last 6 months
    const monthsMap = new Map();
    for (let i = 5; i >= 0; i--) {
      const mStr = format(subMonths(today, i), 'MMM yyyy');
      monthsMap.set(mStr, { sales: 0, purchases: 0 });
    }
    for (const inv of monthlyInvoices) {
      const mStr = format(inv.invoiceDate, 'MMM yyyy');
      if (monthsMap.has(mStr)) {
        monthsMap.get(mStr).sales += inv.grandTotal;
      }
    }
    for (const pur of monthlyPurchasesList) {
      const mStr = format(pur.purchaseDate, 'MMM yyyy');
      if (monthsMap.has(mStr)) {
        monthsMap.get(mStr).purchases += pur.grandTotal;
      }
    }

    const monthlySalesChart: any[] = [];
    const salesVsPurchases: any[] = [];
    monthsMap.forEach((data, month) => {
      monthlySalesChart.push({ month, sales: data.sales });
      salesVsPurchases.push({ month, sales: data.sales, purchases: data.purchases });
    });

    const topProducts = topSalesItems.map(item => ({
      name: item.productName,
      quantity: item._sum.quantity || 0
    }));

    return NextResponse.json({
      todaySales: todaySalesData._sum.grandTotal || 0,
      todayInvoiceCount: todaySalesData._count.id || 0,
      monthlySales: monthlySalesData._sum.grandTotal || 0,
      monthlyPurchases: monthlyPurchasesData._sum.grandTotal || 0,
      totalOutstanding: customerOutstanding._sum.currentBalance || 0,
      supplierPayables: supplierPayables._sum.currentBalance || 0,
      totalProducts,
      lowStockCount,
      totalCustomers,
      dailySales,
      monthlySalesChart,
      topProducts,
      salesVsPurchases,
      recentInvoices,
      recentPurchases
    });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
