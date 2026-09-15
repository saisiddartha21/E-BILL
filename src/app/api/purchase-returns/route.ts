import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const returns = await prisma.purchaseReturn.findMany({
      where: {
        OR: [
          { returnNumber: { contains: search } },
          { purchase: { purchaseNumber: { contains: search } } },
          { supplier: { name: { contains: search } } }
        ]
      },
      include: {
        supplier: true,
        purchase: true
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
    const { purchaseId, items, reason, notes } = data;

    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findUnique({ where: { id: purchaseId }, include: { items: true } });
      if (!purchase) throw new Error("Purchase not found");

      // Generate PR Number
      const fy = "26-27";
      const lastReturn = await tx.purchaseReturn.findFirst({ orderBy: { createdAt: 'desc' } });
      let nextNum = 1;
      if (lastReturn) {
        const parts = lastReturn.returnNumber.split('/');
        nextNum = parseInt(parts[parts.length - 1]) + 1;
      }
      const returnNumber = `PR/${fy}/${String(nextNum).padStart(4, '0')}`;

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
          productName: item.productName || "Product",
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

      const purchaseReturn = await tx.purchaseReturn.create({
        data: {
          returnNumber,
          purchaseId,
          supplierId: purchase.supplierId,
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

      // Update Stock & Supplier Balance
      for (const item of returnItemsData) {
        const product = await tx.product.findUnique({ where: { id: item.productId }});
        if (product) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } }
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              transactionType: "PURCHASE_RETURN",
              referenceType: "PURCHASE_RETURN",
              referenceId: purchaseReturn.id,
              referenceNumber: returnNumber,
              quantityIn: 0,
              quantityOut: item.quantity,
              balanceAfter: product.currentStock - item.quantity,
            }
          });
        }
      }

      await tx.supplier.update({
        where: { id: purchase.supplierId },
        data: { currentBalance: { decrement: grandTotal } }
      });

      await tx.auditLog.create({
        data: {
          action: "PURCHASE_RETURN_CREATED",
          entity: "PURCHASE_RETURN",
          entityId: purchaseReturn.id,
          details: JSON.stringify({ returnNumber, grandTotal })
        }
      });

      return purchaseReturn;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
