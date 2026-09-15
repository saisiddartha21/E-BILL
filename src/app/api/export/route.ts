import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

function jsonToCsv(data: any[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] !== undefined && row[header] !== null ? row[header] : '';
      const escaped = ('' + val).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let data: any[] = [];
    let filename = 'export.csv';

    switch (type) {
      case 'customers':
        const customers = await prisma.customer.findMany();
        data = customers.map((c: any) => ({
          Name: c.name,
          Mobile: c.mobile,
          GSTIN: c.gstin,
          Type: c.customerType,
          Balance: c.currentBalance
        }));
        filename = 'customers.csv';
        break;

      case 'products':
        const products = await prisma.product.findMany({ include: { category: true } });
        data = products.map((p: any) => ({
          SKU: p.sku,
          Name: p.name,
          Category: p.category?.name || '',
          HSN: p.hsnCode,
          Unit: p.unit,
          PurchasePrice: p.purchasePrice,
          SellingPrice: p.sellingPrice,
          MRP: p.mrp,
          GST: p.gstRate,
          Stock: p.currentStock
        }));
        filename = 'products.csv';
        break;
        
      case 'invoices':
        const invoices = await prisma.salesInvoice.findMany({ include: { customer: true } });
        data = invoices.map((inv: any) => ({
          Number: inv.invoiceNumber,
          Date: inv.invoiceDate.toISOString().split('T')[0],
          Customer: inv.customer?.name || 'Cash Customer',
          Total: inv.grandTotal,
          Status: inv.status
        }));
        filename = 'invoices.csv';
        break;

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    if (data.length === 0) {
      return new NextResponse('No data found', { status: 404 });
    }

    const csv = jsonToCsv(data);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
