import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const invoice = await prisma.salesInvoice.findUnique({
      where: { id: params.id },
      include: {
        items: { include: { product: true } },
        customer: true,
        payments: true
      }
    });

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    const company = await prisma.companySettings.findFirst();
    return NextResponse.json({ ...invoice, company });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const invoice = await prisma.salesInvoice.update({
      where: { id: params.id },
      data: {
        notes: body.notes,
        paymentMode: body.paymentMode
      }
    });
    return NextResponse.json(invoice);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const invoiceId = params.id;

    let user = await prisma.user.findFirst();
    
    await prisma.$transaction(async (tx) => {
      const invoice = await tx.salesInvoice.findUnique({
        where: { id: invoiceId },
        include: { items: true }
      });

      if (!invoice) throw new Error("Invoice not found");
      if (invoice.status === 'CANCELLED') throw new Error("Invoice is already cancelled");

      // Revert Stock
      for (const item of invoice.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (product) {
          await tx.product.update({
            where: { id: product.id },
            data: { currentStock: product.currentStock + item.quantity }
          });

          await tx.stockMovement.create({
            data: {
              productId: product.id,
              transactionType: 'ADJUSTMENT',
              referenceType: 'MANUAL', // Or INVOICE_CANCELLED if schema allows
              referenceNumber: invoice.invoiceNumber,
              quantityIn: item.quantity,
              balanceAfter: product.currentStock + item.quantity,
              userId: user?.id,
              notes: 'Invoice Cancelled'
            }
          });
        }
      }

      // Revert Customer Balance
      if (invoice.customerId && invoice.balanceAmount > 0) {
        await tx.customer.update({
          where: { id: invoice.customerId },
          data: { currentBalance: { decrement: invoice.balanceAmount } }
        });
      }

      // Update Invoice Status
      await tx.salesInvoice.update({
        where: { id: invoiceId },
        data: { status: 'CANCELLED', cancelReason: 'Cancelled by Admin' }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: user?.id,
          action: 'INVOICE_CANCELLED',
          entity: 'INVOICE',
          entityId: invoiceId,
          details: JSON.stringify({ invoiceNumber: invoice.invoiceNumber })
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Cancel Invoice Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
