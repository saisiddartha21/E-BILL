import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const returns = await prisma.salesReturn.findMany({
      where: {
        OR: [
          { returnNumber: { contains: search } },
          { invoice: { invoiceNumber: { contains: search } } },
          { customer: { name: { contains: search } } }
        ]
      },
      include: {
        customer: true,
        invoice: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(returns);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { invoiceId, items, reason, notes } = data;

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.salesInvoice.findUnique({ where: { id: invoiceId }, include: { items: true } });
      if (!invoice) throw new Error("Invoice not found");
      if (invoice.status !== "ACTIVE") throw new Error("Cannot return items for a cancelled invoice");

      // Generate SR Number
      const fy = "26-27";
      const lastReturn = await tx.salesReturn.findFirst({ orderBy: { createdAt: 'desc' } });
      let nextNum = 1;
      if (lastReturn) {
        const parts = lastReturn.returnNumber.split('/');
        nextNum = parseInt(parts[parts.length - 1]) + 1;
      }
      const returnNumber = `SR/${fy}/${String(nextNum).padStart(4, '0')}`;

      let subtotal = 0;
      let taxableAmount = 0;
      let cgstTotal = 0;
      let sgstTotal = 0;
      let igstTotal = 0;

      const returnItemsData = items.map((item: any) => {
        subtotal += item.quantity * item.rate;
        taxableAmount += item.taxableAmount;
        cgstTotal += item.cgstAmount || 0;
        sgstTotal += item.sgstAmount || 0;
        igstTotal += item.igstAmount || 0;

        return {
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          rate: item.rate,
          taxableAmount: item.taxableAmount,
          gstRate: item.gstRate,
          cgstAmount: item.cgstAmount || 0,
          sgstAmount: item.sgstAmount || 0,
          igstAmount: item.igstAmount || 0,
          totalAmount: item.totalAmount
        };
      });

      const totalTax = cgstTotal + sgstTotal + igstTotal;
      const grandTotal = Math.round(taxableAmount + totalTax);

      const salesReturn = await tx.salesReturn.create({
        data: {
          returnNumber,
          invoiceId,
          customerId: invoice.customerId,
          subtotal,
          taxableAmount,
          cgstTotal,
          sgstTotal,
          igstTotal,
          totalTax,
          grandTotal,
          reason,
          notes: notes || "",
          items: {
            create: returnItemsData
          }
        },
        include: { items: true }
      });

      // Update Stock & Customer Balance
      for (const item of returnItemsData) {
        const product = await tx.product.findUnique({ where: { id: item.productId }});
        if (product) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } }
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              transactionType: "SALES_RETURN",
              referenceType: "SALES_RETURN",
              referenceId: salesReturn.id,
              referenceNumber: returnNumber,
              quantityIn: item.quantity,
              quantityOut: 0,
              balanceAfter: product.currentStock + item.quantity,
            }
          });
        }
      }

      if (invoice.customerId) {
        await tx.customer.update({
          where: { id: invoice.customerId },
          data: { currentBalance: { decrement: grandTotal } }
        });
      }

      await tx.auditLog.create({
        data: {
          action: "SALES_RETURN_CREATED",
          entity: "SALES_RETURN",
          entityId: salesReturn.id,
          details: JSON.stringify({ returnNumber, grandTotal })
        }
      });

      return salesReturn;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
