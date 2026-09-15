import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentType = searchParams.get('paymentType');
    const customerId = searchParams.get('customerId');
    const supplierId = searchParams.get('supplierId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const skip = (page - 1) * limit;
    
    const where: any = {};
    if (paymentType) where.paymentType = paymentType;
    if (customerId) where.customerId = customerId;
    if (supplierId) where.supplierId = supplierId;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paymentDate: 'desc' },
        include: {
          customer: { select: { name: true, mobile: true } },
          supplier: { select: { name: true, mobile: true } },
          invoice: { select: { invoiceNumber: true } }
        }
      }),
      prisma.payment.count({ where })
    ]);

    return NextResponse.json({
      data: payments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { amount, paymentMode, paymentType, referenceNo, paymentDate, notes, customerId, supplierId, invoiceId } = data;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }
    if (!paymentMode || !paymentType) {
      return NextResponse.json({ error: 'Payment mode and type are required' }, { status: 400 });
    }
    if (paymentType === 'RECEIVED' && !customerId) {
      return NextResponse.json({ error: 'Customer is required for RECEIVED payment' }, { status: 400 });
    }
    if (paymentType === 'MADE' && !supplierId) {
      return NextResponse.json({ error: 'Supplier is required for MADE payment' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          amount: parseFloat(amount),
          paymentMode,
          paymentType,
          referenceNo,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          notes,
          customerId,
          supplierId,
          invoiceId
        }
      });

      if (paymentType === 'RECEIVED' && customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: { currentBalance: { decrement: parseFloat(amount) } }
        });

        if (invoiceId) {
          const invoice = await tx.salesInvoice.findUnique({ where: { id: invoiceId } });
          if (invoice) {
            const newPaidAmount = invoice.paidAmount + parseFloat(amount);
            const newBalance = invoice.grandTotal - newPaidAmount;
            const newStatus = newBalance <= 0 ? 'PAID' : (newPaidAmount > 0 ? 'PARTIAL' : 'PENDING');

            await tx.salesInvoice.update({
              where: { id: invoiceId },
              data: {
                paidAmount: newPaidAmount,
                balanceAmount: newBalance,
                paymentStatus: newStatus
              }
            });
          }
        }
      } else if (paymentType === 'MADE' && supplierId) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: { currentBalance: { decrement: parseFloat(amount) } }
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'PAYMENT_RECORDED',
          entity: 'PAYMENT',
          entityId: payment.id,
          details: JSON.stringify(payment)
        }
      });

      return payment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Failed to record payment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
