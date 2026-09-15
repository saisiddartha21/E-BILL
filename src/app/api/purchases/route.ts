import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let whereClause: any = {
      OR: [
        { purchaseNumber: { contains: search } },
        { supplier: { name: { contains: search } } }
      ]
    };

    if (startDate && endDate) {
      whereClause.purchaseDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const purchases = await prisma.purchase.findMany({
      where: whereClause,
      include: {
        supplier: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(purchases);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { supplierId, purchaseDate, supplierInvoice, items, paymentMode, paidAmount, notes } = data;
    const createdById = request.headers.get('x-user-id') || '';

    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate purchase number
      const fy = "26-27";
      const lastPurchase = await tx.purchase.findFirst({ orderBy: { createdAt: 'desc' } });
      let nextNum = 1;
      if (lastPurchase) {
        const parts = lastPurchase.purchaseNumber.split('/');
        nextNum = parseInt(parts[parts.length - 1]) + 1;
      }
      const purchaseNumber = `PUR/${fy}/${String(nextNum).padStart(4, '0')}`;

      let subtotal = 0;
      let discountAmount = 0;
      let taxableAmount = 0;
      let cgstTotal = 0;
      let sgstTotal = 0;
      let igstTotal = 0;

      const purchaseItemsData = items.map((item: any) => {
        subtotal += item.quantity * item.rate;
        discountAmount += item.discount || 0;
        taxableAmount += item.taxableAmount;
        cgstTotal += item.cgstAmount || 0;
        sgstTotal += item.sgstAmount || 0;
        igstTotal += item.igstAmount || 0;

        return {
          productId: item.productId,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          discount: item.discount || 0,
          taxableAmount: item.taxableAmount,
          gstRate: item.gstRate,
          cgstAmount: item.cgstAmount || 0,
          sgstAmount: item.sgstAmount || 0,
          igstAmount: item.igstAmount || 0,
          totalAmount: item.totalAmount
        };
      });

      const totalTax = cgstTotal + sgstTotal + igstTotal;
      const exactGrandTotal = taxableAmount + totalTax;
      const roundOff = Math.round(exactGrandTotal) - exactGrandTotal;
      const grandTotal = Math.round(exactGrandTotal);

      let paymentStatus = "PENDING";
      const pendingAmount = grandTotal - (paidAmount || 0);
      if (pendingAmount <= 0) {
        paymentStatus = "PAID";
      } else if (paidAmount > 0) {
        paymentStatus = "PARTIAL";
      }

      // 2. Create Purchase
      const purchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplierId,
          purchaseDate: new Date(purchaseDate),
          supplierInvoice: supplierInvoice || "",
          subtotal,
          discountAmount,
          taxableAmount,
          cgstTotal,
          sgstTotal,
          igstTotal,
          totalTax,
          roundOff,
          grandTotal,
          paymentStatus,
          paidAmount: paidAmount || 0,
          pendingAmount,
          paymentMode,
          notes: notes || "",
          createdById, // User must be passed from session in real app
          items: {
            create: purchaseItemsData
          }
        },
        include: {
          items: true
        }
      });

      // 3 & 4. Stock Movement and Update
      for (const item of purchaseItemsData) {
        const product = await tx.product.findUnique({ where: { id: item.productId }});
        if (product) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: {
                increment: item.quantity
              }
            }
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              transactionType: "PURCHASE",
              referenceType: "PURCHASE",
              referenceId: purchase.id,
              referenceNumber: purchaseNumber,
              quantityIn: item.quantity,
              quantityOut: 0,
              balanceAfter: product.currentStock + item.quantity,
            }
          });
        }
      }

      // 5. Update Supplier Balance
      if (pendingAmount > 0) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: {
            currentBalance: {
              increment: pendingAmount
            }
          }
        });
      }

      // 6. Audit Log
      await tx.auditLog.create({
        data: {
          action: "PURCHASE_CREATED",
          entity: "PURCHASE",
          entityId: purchase.id,
          details: JSON.stringify({ purchaseNumber, grandTotal })
        }
      });

      return purchase;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
