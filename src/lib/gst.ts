export interface GstCalculationResult {
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  totalWithTax: number;
}

export interface InvoiceGstCalculationResult {
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  grandTotal: number;
}

export function calculateItemGST(
  taxableAmount: number,
  gstRate: number,
  isInterState: boolean
): GstCalculationResult {
  const tax = Number(((taxableAmount * gstRate) / 100).toFixed(2));
  
  if (isInterState) {
    return {
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: gstRate,
      igstAmount: tax,
      totalTax: tax,
      totalWithTax: Number((taxableAmount + tax).toFixed(2))
    };
  } else {
    const halfRate = gstRate / 2;
    const halfTax = Number((tax / 2).toFixed(2));
    // To ensure cgst + sgst exact match total tax, recalculate sgst
    const sgstAmount = Number((tax - halfTax).toFixed(2));
    
    return {
      cgstRate: halfRate,
      cgstAmount: halfTax,
      sgstRate: halfRate,
      sgstAmount: sgstAmount,
      igstRate: 0,
      igstAmount: 0,
      totalTax: tax,
      totalWithTax: Number((taxableAmount + tax).toFixed(2))
    };
  }
}

export function calculateInvoiceGST(
  items: Array<{ taxableAmount: number; gstRate: number; isInterState: boolean }>
): InvoiceGstCalculationResult {
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  for (const item of items) {
    const result = calculateItemGST(item.taxableAmount, item.gstRate, item.isInterState);
    totalTaxable += item.taxableAmount;
    totalCgst += result.cgstAmount;
    totalSgst += result.sgstAmount;
    totalIgst += result.igstAmount;
  }

  const totalTax = Number((totalCgst + totalSgst + totalIgst).toFixed(2));
  const grandTotal = Number((totalTaxable + totalTax).toFixed(2));

  return {
    totalTaxable: Number(totalTaxable.toFixed(2)),
    totalCgst: Number(totalCgst.toFixed(2)),
    totalSgst: Number(totalSgst.toFixed(2)),
    totalIgst: Number(totalIgst.toFixed(2)),
    totalTax,
    grandTotal
  };
}

export function roundOff(amount: number): { rounded: number; roundOffAmount: number } {
  const rounded = Math.round(amount);
  const roundOffAmount = Number((rounded - amount).toFixed(2));
  return { rounded, roundOffAmount };
}
