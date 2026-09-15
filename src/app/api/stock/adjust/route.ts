import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { productId, type, quantity, reason } = data;
    const userId = request.headers.get('x-user-id') || null;

    if (!productId || !type || !quantity || quantity <= 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId }});
      if (!product) throw new Error("Product not found");

      const qtyNum = Number(quantity);
      
      let newStock = product.currentStock;
      if (type === 'ADD') {
        newStock += qtyNum;
      } else if (type === 'REDUCE') {
        // Assume enableNegativeStock check would go here if strict
        newStock -= qtyNum;
      } else {
        throw new Error("Invalid adjustment type");
      }

      await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock }
      });

      const movement = await tx.stockMovement.create({
        data: {
          productId,
          transactionType: "ADJUSTMENT",
          referenceType: "MANUAL",
          referenceId: "",
          referenceNumber: "",
          quantityIn: type === 'ADD' ? qtyNum : 0,
          quantityOut: type === 'REDUCE' ? qtyNum : 0,
          balanceAfter: newStock,
          notes: reason,
          userId
        }
      });

      await tx.auditLog.create({
        data: {
          action: "STOCK_ADJUSTED",
          entity: "STOCK",
          entityId: productId,
          details: JSON.stringify({ type, quantity, reason, newStock })
        }
      });

      return movement;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
