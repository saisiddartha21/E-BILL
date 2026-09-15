export function prepareEWayBillData(invoice: any, companySettings: any, transportDetails: any) {
  const items = invoice.items.map((item: any) => {
    const qty = Number(item.quantity);
    const rate = Number(item.rate);
    const totAmt = qty * rate;

    return {
      productName: item.product.name,
      hsnCode: item.product.hsnCode,
      quantity: qty,
      qtyUnit: item.product.unit || 'NOS',
      taxableAmount: totAmt,
      cgstRate: Number(item.cgstRate || 0),
      sgstRate: Number(item.sgstRate || 0),
      igstRate: Number(item.igstRate || 0)
    };
  });

  const totalAssVal = items.reduce((sum: number, item: any) => sum + item.taxableAmount, 0);
  const totalCgstVal = items.reduce((sum: number, item: any) => sum + (item.taxableAmount * item.cgstRate / 100), 0);
  const totalSgstVal = items.reduce((sum: number, item: any) => sum + (item.taxableAmount * item.sgstRate / 100), 0);
  const totalIgstVal = items.reduce((sum: number, item: any) => sum + (item.taxableAmount * item.igstRate / 100), 0);
  const totalInvVal = totalAssVal + totalCgstVal + totalSgstVal + totalIgstVal;

  return {
    supplyType: "O",
    subSupplyType: "1",
    docType: "INV",
    docNo: invoice.invoiceNumber,
    docDate: new Date(invoice.invoiceDate).toLocaleDateString('en-GB'),
    fromGstin: companySettings.gstin || "",
    fromTrdName: companySettings.companyName || "",
    fromAddr1: companySettings.shopAddress || "",
    fromPlace: companySettings.city || "",
    fromPincode: Number(companySettings.pincode) || 0,
    fromStateCode: Number(companySettings.stateCode) || 36,
    toGstin: invoice.customer?.gstin || "",
    toTrdName: invoice.customer?.name || "",
    toAddr1: invoice.customer?.billingAddress || "",
    toPlace: invoice.customer?.city || "",
    toPincode: Number(invoice.customer?.pincode) || 0,
    toStateCode: Number(invoice.customer?.stateCode) || 36,
    totalValue: totalAssVal,
    cgstValue: totalCgstVal,
    sgstValue: totalSgstVal,
    igstValue: totalIgstVal,
    totInvValue: totalInvVal,
    transporterId: transportDetails.transporterId || "",
    transporterName: transportDetails.transporterName || "",
    transDocNo: transportDetails.transDocNo || "",
    transMode: transportDetails.transMode || "1",
    vehicleNo: transportDetails.vehicleNo || "",
    vehicleType: transportDetails.vehicleType || "R",
    transDistance: transportDetails.transDistance || "0",
    itemList: items
  };
}

export function validateEWayBillData(data: any) {
  const errors: string[] = [];

  if (!data.fromGstin || data.fromGstin.length !== 15) {
    errors.push("Valid From GSTIN (15 characters) is required");
  }

  if (!data.toGstin || data.toGstin.length !== 15) {
    errors.push("Valid To GSTIN (15 characters) is required");
  }

  if (data.transMode === "1" && !data.vehicleNo) {
    errors.push("Vehicle number is required for road transport");
  }

  if (!data.itemList || data.itemList.length === 0) {
    errors.push("At least one item is required in the e-way bill");
  } else {
    data.itemList.forEach((item: any, index: number) => {
      if (!item.hsnCode) errors.push(`HSN Code is required for item ${index + 1}`);
    });
  }

  if (!data.transDistance || Number(data.transDistance) <= 0) {
    errors.push("Approximate distance must be greater than 0");
  }

  if (!data.fromStateCode) errors.push("From State Code is required");
  if (!data.toStateCode) errors.push("To State Code is required");

  return {
    isValid: errors.length === 0,
    errors
  };
}

export async function submitEWayBill(data: any, credentials: any = null) {
  const hasConfiguredCredentials = process.env.EWAYBILL_CLIENT_ID && process.env.EWAYBILL_CLIENT_SECRET;
  
  if (!hasConfiguredCredentials && !credentials) {
    return { 
      success: false, 
      error: 'E-Way Bill integration is not configured. Please configure API credentials in environment variables.' 
    };
  }

  // Real implementation would make HTTP call to EWB/GSP here
  // NEVER generate fake E-Way Bill numbers
  return { 
    success: false, 
    error: 'E-Way Bill submission API endpoint not connected. Data generated successfully.' 
  };
}
