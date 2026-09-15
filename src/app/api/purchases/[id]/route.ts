import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
        },
        createdBy: true
      }
    });

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    return NextResponse.json(purchase);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { paidAmount } = await request.json();
    
    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findUnique({ where: { id: params.id }});
      if (!purchase) throw new Error("Purchase not found");

      const newPaidAmount = purchase.paidAmount + paidAmount;
      const newPendingAmount = purchase.grandTotal - newPaidAmount;
      
      let paymentStatus = "PENDING";
      if (newPendingAmount <= 0) paymentStatus = "PAID";
      else if (newPaidAmount > 0) paymentStatus = "PARTIAL";

      const updated = await tx.purchase.update({
        where: { id: params.id },
        data: {
          paidAmount: newPaidAmount,
          pendingAmount: newPendingAmount,
          paymentStatus
        }
      });

      await tx.supplier.update({
        where: { id: purchase.supplierId },
        data: {
          currentBalance: {
            decrement: paidAmount
          }
        }
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.findUnique({ 
        where: { id: params.id },
        include: { items: true }
      });
      if (!purchase) throw new Error("Purchase not found");

      // Reverse stock
      for (const item of purchase.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId }});
        if (product) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } }
          });
        }
      }

      // Reverse supplier balance
      if (purchase.pendingAmount > 0) {
        await tx.supplier.update({
          where: { id: purchase.supplierId },
          data: { currentBalance: { decrement: purchase.pendingAmount } }
        });
      }

      await tx.purchase.delete({ where: { id: params.id } });

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
