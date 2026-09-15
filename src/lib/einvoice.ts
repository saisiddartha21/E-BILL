import prisma from '@/lib/db';

export function prepareEInvoicePayload(invoice: any, companySettings: any) {
  const items = invoice.items.map((item: any, index: number) => {
    const qty = Number(item.quantity);
    const rate = Number(item.rate);
    const totAmt = qty * rate;
    const cgstAmt = (totAmt * Number(item.cgstRate || 0)) / 100;
    const sgstAmt = (totAmt * Number(item.sgstRate || 0)) / 100;
    const igstAmt = (totAmt * Number(item.igstRate || 0)) / 100;

    return {
      SlNo: (index + 1).toString(),
      PrdDesc: item.product.name,
      IsServc: 'N',
      HsnCd: item.product.hsnCode,
      Qty: qty,
      Unit: item.product.unit || 'NOS',
      UnitPrice: rate,
      TotAmt: totAmt,
      Discount: 0,
      AssAmt: totAmt,
      GstRt: Number(item.cgstRate || 0) + Number(item.sgstRate || 0) + Number(item.igstRate || 0),
      CgstAmt: cgstAmt,
      SgstAmt: sgstAmt,
      IgstAmt: igstAmt,
      TotItemVal: totAmt + cgstAmt + sgstAmt + igstAmt
    };
  });

  const totalAssVal = items.reduce((sum: number, item: any) => sum + item.AssAmt, 0);
  const totalCgstVal = items.reduce((sum: number, item: any) => sum + item.CgstAmt, 0);
  const totalSgstVal = items.reduce((sum: number, item: any) => sum + item.SgstAmt, 0);
  const totalIgstVal = items.reduce((sum: number, item: any) => sum + item.IgstAmt, 0);
  const totalInvVal = totalAssVal + totalCgstVal + totalSgstVal + totalIgstVal;

  return {
    Version: "1.1",
    TranDtls: {
      TaxSch: "GST",
      SupTyp: "B2B",
      RegRev: "N",
      IgstOnIntra: "N"
    },
    DocDtls: {
      Typ: "INV",
      No: invoice.invoiceNumber,
      Dt: new Date(invoice.invoiceDate).toLocaleDateString('en-GB')
    },
    SellerDtls: {
      Gstin: companySettings.gstin || "",
      LglNm: companySettings.companyName || "",
      Addr1: companySettings.shopAddress || "",
      Loc: companySettings.city || "",
      Pin: Number(companySettings.pincode) || 0,
      Stcd: companySettings.stateCode || "36",
      Ph: companySettings.mobileNumber || "",
      Em: companySettings.email || ""
    },
    BuyerDtls: {
      Gstin: invoice.customer?.gstin || "",
      LglNm: invoice.customer?.name || "",
      Pos: invoice.customer?.stateCode || "36",
      Addr1: invoice.customer?.billingAddress || "",
      Loc: invoice.customer?.city || "",
      Pin: Number(invoice.customer?.pincode) || 0,
      Stcd: invoice.customer?.stateCode || "36",
      Ph: invoice.customer?.mobile || "",
      Em: invoice.customer?.email || ""
    },
    ItemList: items,
    ValDtls: {
      AssVal: totalAssVal,
      CgstVal: totalCgstVal,
      SgstVal: totalSgstVal,
      IgstVal: totalIgstVal,
      RndOffAmt: 0,
      TotInvVal: totalInvVal
    }
  };
}

export function validateEInvoicePayload(payload: any) {
  const errors: string[] = [];

  if (!payload.SellerDtls?.Gstin || payload.SellerDtls.Gstin.length !== 15) {
    errors.push("Valid Seller GSTIN (15 characters) is required");
  }

  if (payload.TranDtls?.SupTyp === 'B2B' && (!payload.BuyerDtls?.Gstin || payload.BuyerDtls.Gstin.length !== 15)) {
    errors.push("Valid Buyer GSTIN (15 characters) is required for B2B transactions");
  }

  if (!payload.ItemList || payload.ItemList.length === 0) {
    errors.push("At least one item is required in the invoice");
  } else {
    payload.ItemList.forEach((item: any, index: number) => {
      if (!item.HsnCd) errors.push(`HSN Code is required for item ${index + 1}`);
      if (item.Qty <= 0) errors.push(`Quantity must be greater than 0 for item ${index + 1}`);
      if (item.UnitPrice <= 0) errors.push(`Unit Price must be greater than 0 for item ${index + 1}`);
    });
  }

  const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!dateRegex.test(payload.DocDtls?.Dt)) {
    errors.push("Document Date must be in DD/MM/YYYY format");
  }

  if (!payload.SellerDtls?.Stcd) errors.push("Seller State Code is required");
  if (!payload.BuyerDtls?.Stcd) errors.push("Buyer State Code is required");

  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function getEInvoiceStatus(invoiceId: string) {
  try {
    const record = await prisma.eInvoiceRecord.findFirst({
      where: { invoiceId },
      orderBy: { createdAt: 'desc' }
    });
    return record;
  } catch (error) {
    console.error('Failed to fetch E-Invoice status:', error);
    return null;
  }
}

export async function submitEInvoice(payload: any, credentials: any = null) {
  // Check for credentials in env vars
  const hasConfiguredCredentials = process.env.EINVOICE_CLIENT_ID && process.env.EINVOICE_CLIENT_SECRET;
  
  if (!hasConfiguredCredentials && !credentials) {
    return { 
      success: false, 
      error: 'E-Invoice integration is not configured. Please configure API credentials in environment variables.' 
    };
  }

  // Real implementation would make HTTP call to IRP/GSP here
  // For safety as per instructions: NEVER generate fake IRN numbers
  return { 
    success: false, 
    error: 'E-Invoice submission API endpoint not connected. Payload generated successfully.' 
  };
}
