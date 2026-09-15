import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'All';
    const search = searchParams.get('search') || '';

    const invoices = await prisma.salesInvoice.findMany({
      where: search ? {
        OR: [
          { invoiceNumber: { contains: search } },
          { customerName: { contains: search } },
        ]
      } : undefined,
      include: { customer: true },
      orderBy: { invoiceDate: 'desc' },
    });

    const invoiceIds = invoices.map(i => i.id);
    const records = await prisma.eWayBillRecord.findMany({
      where: { invoiceId: { in: invoiceIds } },
      orderBy: { createdAt: 'desc' }
    });

    const latestRecordsMap = new Map();
    for (const record of records) {
      if (!latestRecordsMap.has(record.invoiceId)) {
        latestRecordsMap.set(record.invoiceId, record);
      }
    }

    const formattedInvoices = invoices.map(invoice => {
      const record = latestRecordsMap.get(invoice.id) || null;
      const currentStatus = record ? record.status : 'NOT_GENERATED';
      
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.invoiceDate,
        customerName: invoice.customerName,
        customerGstin: invoice.customerGstin,
        totalAmount: invoice.grandTotal,
        eWayBillStatus: currentStatus,
        ewayBillNo: record?.ewayBillNumber || null,
        recordId: record?.id || null,
      };
    }).filter(inv => status === 'All' || inv.eWayBillStatus === status);

    return NextResponse.json(formattedInvoices);
  } catch (error) {
    console.error('Failed to fetch e-way bills:', error);
    return NextResponse.json({ error: 'Failed to fetch e-way bills' }, { status: 500 });
  }
}
