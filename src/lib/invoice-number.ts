export function getFinancialYear(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11

  // Financial year starts from April (month 3)
  let startYear = year;
  if (month < 3) {
    startYear = year - 1;
  }
  
  const endYear = startYear + 1;
  return `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`;
}

/**
 * Generate invoice number atomically.
 * Accepts either a PrismaClient (will wrap in $transaction) or a transaction client (tx).
 */
export async function generateInvoiceNumber(prismaOrTx: any, date: Date = new Date()): Promise<string> {
  // If prismaOrTx has $transaction, it's the root client — wrap in transaction
  // If it doesn't, it's already a transaction client — use directly
  const runner = typeof prismaOrTx.$transaction === 'function'
    ? (cb: (tx: any) => Promise<string>) => prismaOrTx.$transaction(cb)
    : (cb: (tx: any) => Promise<string>) => cb(prismaOrTx);

  return await runner(async (tx: any) => {
    const settings = await tx.companySettings.findFirst();
    if (!settings) {
      throw new Error('Company settings not found');
    }

    const prefix = settings.invoicePrefix || 'SVE';
    const fy = getFinancialYear(date);
    const startNo = settings.startingInvoiceNo || 1;
    const currentNo = settings.currentInvoiceNo ? settings.currentInvoiceNo + 1 : startNo;
    
    await tx.companySettings.update({
      where: { id: settings.id },
      data: { currentInvoiceNo: currentNo }
    });

    const paddedNo = currentNo.toString().padStart(4, '0');
    return `${prefix}/${fy}/${paddedNo}`;
  });
}

/**
 * Generate purchase number by scanning existing records.
 */
export async function generatePurchaseNumber(prismaOrTx: any, date: Date = new Date()): Promise<string> {
  const fy = getFinancialYear(date);
  const prefix = 'PUR';
  
  const lastPurchase = await prismaOrTx.purchase.findFirst({
    where: {
      purchaseNumber: {
        startsWith: `${prefix}/${fy}/`
      }
    },
    orderBy: {
      purchaseNumber: 'desc'
    }
  });

  let nextNo = 1;
  if (lastPurchase) {
    const parts = lastPurchase.purchaseNumber.split('/');
    const lastNo = parseInt(parts[parts.length - 1]);
    if (!isNaN(lastNo)) {
      nextNo = lastNo + 1;
    }
  }

  const paddedNo = nextNo.toString().padStart(4, '0');
  return `${prefix}/${fy}/${paddedNo}`;
}

/**
 * Generate sales/purchase return number by scanning existing records.
 */
export async function generateReturnNumber(prismaOrTx: any, date: Date = new Date(), isSales: boolean = true): Promise<string> {
  const fy = getFinancialYear(date);
  const prefix = isSales ? 'SR' : 'PR';

  let lastReturn;
  if (isSales) {
    lastReturn = await prismaOrTx.salesReturn.findFirst({
      where: {
        returnNumber: {
          startsWith: `${prefix}/${fy}/`
        }
      },
      orderBy: {
        returnNumber: 'desc'
      }
    });
  } else {
    lastReturn = await prismaOrTx.purchaseReturn.findFirst({
      where: {
        returnNumber: {
          startsWith: `${prefix}/${fy}/`
        }
      },
      orderBy: {
        returnNumber: 'desc'
      }
    });
  }

  let nextNo = 1;
  if (lastReturn) {
    const parts = lastReturn.returnNumber.split('/');
    const lastNo = parseInt(parts[parts.length - 1]);
    if (!isNaN(lastNo)) {
      nextNo = lastNo + 1;
    }
  }

  const paddedNo = nextNo.toString().padStart(4, '0');
  return `${prefix}/${fy}/${paddedNo}`;
}
