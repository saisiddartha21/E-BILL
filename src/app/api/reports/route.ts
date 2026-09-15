import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');
    const period = searchParams.get('period');

    let fromDate = fromStr ? new Date(fromStr) : startOfMonth(new Date());
    let toDate = toStr ? new Date(toStr) : endOfMonth(new Date());

    if (period) {
      const now = new Date();
      if (period === 'daily') {
        fromDate = startOfDay(now);
        toDate = endOfDay(now);
      } else if (period === 'weekly') {
        fromDate = startOfWeek(now);
        toDate = endOfWeek(now);
      } else if (period === 'monthly') {
        fromDate = startOfMonth(now);
        toDate = endOfMonth(now);
      } else if (period === 'yearly') {
        fromDate = startOfYear(now);
        toDate = endOfYear(now);
      }
    }

    switch (type) {
      case 'sales': {
        const invoices = await prisma.salesInvoice.findMany({
          where: { invoiceDate: { gte: fromDate, lte: toDate } },
          select: { invoiceDate: true, grandTotal: true },
        });

        const grouped = invoices.reduce((acc: any, inv: any) => {
          const date = inv.invoiceDate.toISOString().split('T')[0];
          if (!acc[date]) acc[date] = { date, grandTotal: 0, count: 0 };
          acc[date].grandTotal += inv.grandTotal;
          acc[date].count += 1;
          return acc;
        }, {});

        return NextResponse.json(Object.values(grouped));
      }
      
      case 'sales-product': {
        const items = await prisma.salesInvoiceItem.findMany({
          where: { invoice: { invoiceDate: { gte: fromDate, lte: toDate } } },
          include: { product: true },
        });
        
        const grouped = items.reduce((acc: any, item: any) => {
          const id = item.productId;
          if (!acc[id]) acc[id] = { id, name: item.product.name, quantity: 0, totalAmount: 0 };
          acc[id].quantity += item.quantity;
          acc[id].totalAmount += item.totalAmount;
          return acc;
        }, {});
        return NextResponse.json(Object.values(grouped));
      }

      case 'sales-customer': {
        const invoices = await prisma.salesInvoice.findMany({
          where: { invoiceDate: { gte: fromDate, lte: toDate } },
          include: { customer: true },
        });
        
        const grouped = invoices.reduce((acc: any, inv: any) => {
          const id = inv.customerId;
          if (!acc[id]) acc[id] = { id, name: inv.customer?.name || inv.customerName, grandTotal: 0, count: 0 };
          acc[id].grandTotal += inv.grandTotal;
          acc[id].count += 1;
          return acc;
        }, {});
        return NextResponse.json(Object.values(grouped));
      }

      case 'sales-gst': {
        const items = await prisma.salesInvoiceItem.findMany({
          where: { invoice: { invoiceDate: { gte: fromDate, lte: toDate } } },
        });
        const grouped = items.reduce((acc: any, item: any) => {
          const rate = item.gstRate;
          if (!acc[rate]) acc[rate] = { rate, taxableAmount: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0 };
          acc[rate].taxableAmount += item.taxableAmount;
          acc[rate].cgstAmount += item.cgstAmount || 0;
          acc[rate].sgstAmount += item.sgstAmount || 0;
          acc[rate].igstAmount += item.igstAmount || 0;
          return acc;
        }, {});
        return NextResponse.json(Object.values(grouped));
      }

      case 'stock-current': {
        const products = await prisma.product.findMany({
          where: { currentStock: { gt: 0 } },
          select: { id: true, name: true, sku: true, currentStock: true, purchasePrice: true, category: { select: { name: true } } }
        });
        return NextResponse.json(products);
      }

      case 'stock-low': {
        // Need raw query or simple findMany then filter because comparing column to column isn't directly supported in findMany without raw in older prisma, wait prisma handles it with raw or we can just fetch and filter
        const products = await prisma.product.findMany();
        const lowStockProducts = products.filter((p: any) => p.currentStock <= p.minStockLevel);
        return NextResponse.json(lowStockProducts);
      }
      
      case 'stock-valuation': {
        const products = await prisma.product.findMany();
        const val = products.map((p: any) => ({
          ...p,
          valuation: p.currentStock * p.purchasePrice
        }));
        return NextResponse.json(val);
      }

      case 'profit': {
        // Simple profit calculation
        const items = await prisma.salesInvoiceItem.findMany({
          where: { invoice: { invoiceDate: { gte: fromDate, lte: toDate } } },
          include: { product: true, invoice: true }
        });

        let totalSales = 0;
        let cogs = 0;

        items.forEach((item: any) => {
          totalSales += item.totalAmount;
          cogs += (item.product.purchasePrice * item.quantity);
        });

        return NextResponse.json({ totalSales, cogs, grossProfit: totalSales - cogs });
      }

      // Add other cases similarly...
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Report API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
