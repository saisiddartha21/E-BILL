import { PrismaClient } from '@prisma/client';

export interface AdjustStockParams {
  productId: string;
  quantityIn: number;
  quantityOut: number;
  transactionType: string; // OPENING_STOCK | PURCHASE | SALE | SALES_RETURN | PURCHASE_RETURN | ADJUSTMENT
  referenceType: string;   // PURCHASE | INVOICE | SALES_RETURN | PURCHASE_RETURN | MANUAL
  referenceId?: string;
  referenceNumber?: string;
  userId?: string | null;
  notes?: string;
}

export async function adjustStock(
  prisma: any,
  params: AdjustStockParams
): Promise<number> {
  const { productId, quantityIn, quantityOut, transactionType, referenceType, referenceId, referenceNumber, userId, notes } = params;
  
  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  const settings = await prisma.companySettings.findFirst();
  const enableNegativeStock = settings?.enableNegativeStock ?? false;

  const newBalance = product.currentStock + quantityIn - quantityOut;

  if (newBalance < 0 && !enableNegativeStock) {
    throw new Error(`Insufficient stock for product ${product.name}. Current stock: ${product.currentStock}`);
  }

  await prisma.product.update({
    where: { id: productId },
    data: { currentStock: newBalance }
  });

  await prisma.stockMovement.create({
    data: {
      productId,
      quantityIn,
      quantityOut,
      balanceAfter: newBalance,
      transactionType,
      referenceType,
      referenceNumber: referenceNumber || '',
      referenceId: referenceId || '',
      userId: userId || null,
      notes: notes || ''
    }
  });

  return newBalance;
}
