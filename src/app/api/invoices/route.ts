import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

const itemSchema = z.object({
  productId: z.string().nullable().optional(),
  productName: z.string(),
  hsnCode: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  quantity: z.number().positive(),
  rate: z.number().nonnegative(),
  mrp: z.number().nonnegative().optional(),
  discountPercent: z.number().min(0).max(100).default(0),
  discountAmount: z.number().nonnegative().default(0),
  gstRate: z.number().nonnegative().default(18)
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  customerId: z.string().optional().nullable(),
  customerName: z.string().min(1, "Customer name is required"),
  customerMobile: z.string().optional(),
  customerAddress: z.string().optional(),
  customerGstin: z.string().optional(),
  customerState: z.string().optional(),
  customerStateCode: z.string().optional(),
  shippingAddress: z.string().optional(),
  placeOfSupply: z.string().optional(),
  items: z.array(itemSchema).min(1, "At least one item is required"),
  invoiceDiscountType: z.enum(['PERCENTAGE', 'FIXED']).default('PERCENTAGE'),
  invoiceDiscountValue: z.number().nonnegative().default(0),
  paymentMode: z.string().default('CASH'),
  paidAmount: z.number().nonnegative().default(0),
  notes: z.string().optional()
});

import { amountToWords } from '@/lib/amount-to-words';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const paymentStatus = searchParams.get('paymentStatus') || '';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const skip = (page - 1) * limit;

    const whereClause: any = {
      ...(status && status !== 'ALL' ? { status } : {}),
      ...(paymentStatus && paymentStatus !== 'ALL' ? { paymentStatus } : {}),
    };

    if (search) {
      whereClause.OR = [
        { invoiceNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerMobile: { contains: search } },
      ];
    }

    if (fromDate && toDate) {
      whereClause.invoiceDate = {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      };
    }

    const [invoices, total] = await Promise.all([
      prisma.salesInvoice.findMany({
        where: whereClause,
        include: { customer: true, items: true },
        orderBy: [{ invoiceDate: 'desc' }, { invoiceNumber: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.salesInvoice.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      invoices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error("GET Invoices Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = invoiceSchema.parse(body);

    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: { username: 'admin', name: 'Admin', passwordHash: 'hash', role: 'ADMIN' }
      });
    }

    const createdInvoice = await prisma.$transaction(async (tx) => {
      const settings = await tx.companySettings.findUnique({ where: { id: 'default' } });
      if (!settings) throw new Error("Company settings not found");

      const now = data.invoiceDate ? new Date(data.invoiceDate) : new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      let fy = '';
      if (currentMonth >= 4) {
        fy = `${currentYear.toString().slice(-2)}-${(currentYear + 1).toString().slice(-2)}`;
      } else {
        fy = `${(currentYear - 1).toString().slice(-2)}-${currentYear.toString().slice(-2)}`;
      }

      let invoiceNumber = data.invoiceNumber?.trim();
      if (!invoiceNumber) {
        const nextInvoiceNo = settings.currentInvoiceNo + 1;
        const paddedNumber = nextInvoiceNo.toString().padStart(4, '0');
        invoiceNumber = `${settings.invoicePrefix}/${fy}/${paddedNumber}`;

        await tx.companySettings.update({
          where: { id: 'default' },
          data: { currentInvoiceNo: nextInvoiceNo }
        });
      }

      const isInterState = settings.stateCode !== (data.customerStateCode || settings.stateCode);
      let subtotal = 0;
      let totalItemDiscount = 0;
      
      const defaultProduct = await tx.product.findFirst();
      const invoiceItems: any[] = [];

      for (const item of data.items) {
        let product: any = null;
        if (item.productId) {
          product = await tx.product.findUnique({ where: { id: item.productId } });
        }
        
        if (product && !settings.enableNegativeStock && product.currentStock < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}`);
        }

        const effectiveProductId = product?.id || item.productId || defaultProduct?.id || '';

        const discountAmount = item.discountAmount;
        const taxableAmount = (item.quantity * item.rate) - discountAmount;
        
        let cgstRate = 0, sgstRate = 0, igstRate = 0;
        let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;

        if (isInterState) {
          igstRate = item.gstRate;
          igstAmount = (taxableAmount * igstRate) / 100;
        } else {
          cgstRate = item.gstRate / 2;
          sgstRate = item.gstRate / 2;
          cgstAmount = (taxableAmount * cgstRate) / 100;
          sgstAmount = (taxableAmount * sgstRate) / 100;
        }

        const totalAmount = taxableAmount + cgstAmount + sgstAmount + igstAmount;

        subtotal += (item.quantity * item.rate);
        totalItemDiscount += discountAmount;

        invoiceItems.push({
          productId: effectiveProductId,
          productName: item.productName || product?.name || 'Item',
          hsnCode: item.hsnCode || product?.hsnCode || '',
          unit: item.unit || product?.unit || 'NOS',
          quantity: item.quantity,
          rate: item.rate,
          mrp: item.mrp || product?.mrp || 0,
          discountPercent: item.discountPercent || 0,
          discountAmount,
          taxableAmount,
          gstRate: item.gstRate,
          cgstRate,
          cgstAmount,
          sgstRate,
          sgstAmount,
          igstRate,
          igstAmount,
          totalAmount
        });

        if (product) {
          // Stock Update
          await tx.product.update({
            where: { id: product.id },
            data: { currentStock: product.currentStock - item.quantity }
          });

          // Stock Movement
          await tx.stockMovement.create({
            data: {
              productId: product.id,
              transactionType: 'SALE',
              referenceType: 'INVOICE',
              referenceNumber: invoiceNumber,
              quantityOut: item.quantity,
              balanceAfter: product.currentStock - item.quantity,
              userId: user.id
            }
          });
        }
      }

      let overallTaxable = subtotal - totalItemDiscount;
      let overallDiscountAmount = 0;
      if (data.invoiceDiscountType === 'PERCENTAGE') {
        overallDiscountAmount = (overallTaxable * data.invoiceDiscountValue) / 100;
      } else {
        overallDiscountAmount = data.invoiceDiscountValue;
      }
      overallTaxable -= overallDiscountAmount;

      let finalCgstTotal = 0, finalSgstTotal = 0, finalIgstTotal = 0;
      if (isInterState) {
        invoiceItems.forEach(i => finalIgstTotal += (i.taxableAmount - (i.taxableAmount / (subtotal - totalItemDiscount) * overallDiscountAmount)) * i.igstRate / 100);
      } else {
        invoiceItems.forEach(i => {
          const itemNetTaxable = i.taxableAmount - (i.taxableAmount / (subtotal - totalItemDiscount) * overallDiscountAmount);
          finalCgstTotal += itemNetTaxable * i.cgstRate / 100;
          finalSgstTotal += itemNetTaxable * i.sgstRate / 100;
        });
      }

      const totalTax = finalCgstTotal + finalSgstTotal + finalIgstTotal;
      const totalBeforeRound = overallTaxable + totalTax;
      const grandTotal = Math.round(totalBeforeRound);
      const roundOff = grandTotal - totalBeforeRound;
      
      let paymentStatus = 'PENDING';
      if (data.paymentMode !== 'CREDIT') {
        if (data.paidAmount >= grandTotal) paymentStatus = 'PAID';
        else if (data.paidAmount > 0) paymentStatus = 'PARTIAL';
      }
      const balanceAmount = grandTotal - data.paidAmount;

      const invoice = await tx.salesInvoice.create({
        data: {
          invoiceNumber,
          customerId: data.customerId,
          customerName: data.customerName,
          customerMobile: data.customerMobile || '',
          customerAddress: data.customerAddress || '',
          customerGstin: data.customerGstin || '',
          customerState: data.customerState || 'Telangana',
          customerStateCode: data.customerStateCode || '36',
          shippingAddress: data.shippingAddress || '',
          placeOfSupply: data.placeOfSupply || '36-Telangana',
          isInterState,
          subtotal,
          itemDiscount: totalItemDiscount,
          invoiceDiscount: overallDiscountAmount,
          invoiceDiscountType: data.invoiceDiscountType,
          invoiceDiscountValue: data.invoiceDiscountValue,
          taxableAmount: overallTaxable,
          cgstTotal: finalCgstTotal,
          sgstTotal: finalSgstTotal,
          igstTotal: finalIgstTotal,
          totalTax,
          roundOff,
          grandTotal,
          amountInWords: amountToWords(grandTotal),
          paymentMode: data.paymentMode,
          paymentStatus,
          paidAmount: data.paidAmount,
          balanceAmount,
          notes: data.notes || '',
          createdById: user.id,
          items: {
            create: invoiceItems
          }
        },
        include: { items: true }
      });

      if (data.customerId && balanceAmount > 0) {
        await tx.customer.update({
          where: { id: data.customerId },
          data: { currentBalance: { increment: balanceAmount } }
        });
      }

      if (data.paidAmount > 0) {
        await tx.payment.create({
          data: {
            amount: data.paidAmount,
            paymentMode: data.paymentMode,
            paymentType: 'RECEIVED',
            referenceNo: invoiceNumber,
            customerId: data.customerId,
            invoiceId: invoice.id
          }
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'INVOICE_CREATED',
          entity: 'INVOICE',
          entityId: invoice.id,
          details: JSON.stringify({ invoiceNumber, grandTotal })
        }
      });

      return invoice;
    });

    return NextResponse.json(createdInvoice, { status: 201 });
  } catch (error: any) {
    console.error("POST Invoice Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
