import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');
    
    const customer = await prisma.customer.findUnique({ where: { id: params.id } });
    if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const dateFilter: any = {};
    if (fromStr) dateFilter.gte = new Date(fromStr);
    if (toStr) dateFilter.lte = new Date(toStr);

    const [invoices, payments, returns] = await Promise.all([
      prisma.salesInvoice.findMany({
        where: { customerId: params.id, invoiceDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined, status: 'ACTIVE' },
        orderBy: { invoiceDate: 'asc' },
      }),
      prisma.payment.findMany({
        where: { customerId: params.id, paymentDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined },
        orderBy: { paymentDate: 'asc' },
      }),
      prisma.salesReturn.findMany({
        where: { customerId: params.id, returnDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined },
        orderBy: { returnDate: 'asc' },
      })
    ]);

    let statements: any[] = [];
    
    statements.push({
      date: customer.createdAt,
      type: 'OPENING_BALANCE',
      reference: 'Opening Balance',
      debit: customer.openingBalance > 0 ? customer.openingBalance : 0,
      credit: customer.openingBalance < 0 ? Math.abs(customer.openingBalance) : 0,
    });

    invoices.forEach(inv => {
      statements.push({
        date: inv.invoiceDate,
        type: 'INVOICE',
        reference: inv.invoiceNumber,
        debit: inv.grandTotal,
        credit: 0,
      });
    });

    payments.forEach(pay => {
      statements.push({
        date: pay.paymentDate,
        type: 'PAYMENT',
        reference: pay.referenceNo || 'Payment Recd',
        debit: 0,
        credit: pay.amount,
      });
    });

    returns.forEach(ret => {
      statements.push({
        date: ret.returnDate,
        type: 'RETURN',
        reference: ret.returnNumber,
        debit: 0,
        credit: ret.grandTotal,
      });
    });

    statements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningBalance = 0;
    statements = statements.map(item => {
      runningBalance += (item.debit - item.credit);
      return { ...item, balance: runningBalance };
    });

    return NextResponse.json({ statements, currentBalance: runningBalance });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
