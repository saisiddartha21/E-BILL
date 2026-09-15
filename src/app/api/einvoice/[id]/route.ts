import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { prepareEInvoicePayload, validateEInvoicePayload, submitEInvoice } from '@/lib/einvoice';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.salesInvoice.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const companySettings = await prisma.companySettings.findFirst();
    const eInvoiceRecords = await prisma.eInvoiceRecord.findMany({
      where: { invoiceId: params.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ invoice, companySettings, eInvoiceRecords });
  } catch (error) {
    console.error('Error fetching e-invoice details:', error);
    return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { action, cancelReason } = await request.json();
    
    const invoice = await prisma.salesInvoice.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: { include: { product: true } }
      }
    });

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const companySettings = await prisma.companySettings.findFirst() || {};

    if (action === 'validate') {
      const payload = prepareEInvoicePayload(invoice, companySettings);
      const validation = validateEInvoicePayload(payload);
      return NextResponse.json(validation);
    }
    
    if (action === 'prepare') {
      const payload = prepareEInvoicePayload(invoice, companySettings);
      
      const record = await prisma.eInvoiceRecord.create({
        data: {
          invoiceId: invoice.id,
          status: 'READY',
          requestPayload: JSON.stringify(payload)
        }
      });
      
      return NextResponse.json({ success: true, payload, recordId: record.id });
    }
    
    if (action === 'submit') {
      const payload = prepareEInvoicePayload(invoice, companySettings);
      const result = await submitEInvoice(payload);
      
      if (!result.success) {
        await prisma.eInvoiceRecord.create({
          data: {
            invoiceId: invoice.id,
            status: 'FAILED',
            requestPayload: JSON.stringify(payload),
            errorMessage: result.error || 'Submission failed'
          }
        });
        return NextResponse.json({ success: false, error: result.error });
      }
      
      const record = await prisma.eInvoiceRecord.create({
        data: {
          invoiceId: invoice.id,
          status: 'GENERATED',
          requestPayload: JSON.stringify(payload),
          irnNumber: (result as any).data?.irn || '',
          ackNumber: (result as any).data?.ackNo || '',
          ackDate: (result as any).data?.ackDate || '',
          signedQrCode: (result as any).data?.signedQr || ''
        }
      });
      
      return NextResponse.json({ success: true, data: (result as any).data });
    }
    
    if (action === 'cancel') {
      const record = await prisma.eInvoiceRecord.findFirst({
        where: { invoiceId: invoice.id, status: 'GENERATED' }
      });
      
      if (!record) return NextResponse.json({ error: 'No generated E-Invoice found' }, { status: 400 });
      
      await prisma.eInvoiceRecord.update({
        where: { id: record.id },
        data: {
          status: 'CANCELLED',
          cancelReason,
          cancelDate: new Date().toISOString()
        }
      });
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing e-invoice action:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
