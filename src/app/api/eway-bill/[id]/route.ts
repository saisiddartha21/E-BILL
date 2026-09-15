import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { prepareEWayBillData, validateEWayBillData, submitEWayBill } from '@/lib/eway-bill';

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
          include: { product: true }
        }
      }
    });

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    const companySettings = await prisma.companySettings.findFirst();
    const eWayBillRecords = await prisma.eWayBillRecord.findMany({
      where: { invoiceId: params.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ invoice, companySettings, eWayBillRecords });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { action, transportDetails, cancelReason } = await request.json();
    
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
      const payload = prepareEWayBillData(invoice, companySettings, transportDetails);
      const validation = validateEWayBillData(payload);
      return NextResponse.json(validation);
    }
    
    if (action === 'prepare') {
      const payload = prepareEWayBillData(invoice, companySettings, transportDetails);
      
      const record = await prisma.eWayBillRecord.create({
        data: {
          invoiceId: invoice.id,
          status: 'READY',
          requestPayload: JSON.stringify(payload),
          transporterId: transportDetails?.transporterId || '',
          transporterName: transportDetails?.transporterName || '',
          transportMode: transportDetails?.transportMode || 'ROAD',
          vehicleNumber: transportDetails?.vehicleNumber || '',
          vehicleType: transportDetails?.vehicleType || 'REGULAR',
          approxDistance: parseFloat(transportDetails?.approxDistance || '0') || 0,
          transDocNumber: transportDetails?.transDocNumber || '',
          transDocDate: transportDetails?.transDocDate || '',
        }
      });
      
      return NextResponse.json({ success: true, payload, recordId: record.id });
    }
    
    if (action === 'submit') {
      const payload = prepareEWayBillData(invoice, companySettings, transportDetails);
      const result = await submitEWayBill(payload);
      
      if (!result.success) {
        await prisma.eWayBillRecord.create({
          data: {
            invoiceId: invoice.id,
            status: 'FAILED',
            requestPayload: JSON.stringify(payload),
            transporterId: transportDetails?.transporterId || '',
            transporterName: transportDetails?.transporterName || '',
            transportMode: transportDetails?.transportMode || 'ROAD',
            vehicleNumber: transportDetails?.vehicleNumber || '',
            vehicleType: transportDetails?.vehicleType || 'REGULAR',
            approxDistance: parseFloat(transportDetails?.approxDistance || '0') || 0,
            transDocNumber: transportDetails?.transDocNumber || '',
            transDocDate: transportDetails?.transDocDate || '',
            errorMessage: result.error || 'Submission failed'
          }
        });
        return NextResponse.json({ success: false, error: result.error });
      }
      
      const record = await prisma.eWayBillRecord.create({
        data: {
          invoiceId: invoice.id,
          status: 'GENERATED',
          requestPayload: JSON.stringify(payload),
          transporterId: transportDetails?.transporterId || '',
          transporterName: transportDetails?.transporterName || '',
          transportMode: transportDetails?.transportMode || 'ROAD',
          vehicleNumber: transportDetails?.vehicleNumber || '',
          vehicleType: transportDetails?.vehicleType || 'REGULAR',
          approxDistance: parseFloat(transportDetails?.approxDistance || '0') || 0,
          transDocNumber: transportDetails?.transDocNumber || '',
          transDocDate: transportDetails?.transDocDate || '',
          ewayBillNumber: (result as any).data?.ewayBillNumber || '',
          ewayBillDate: (result as any).data?.ewayBillDate || '',
          validUpto: (result as any).data?.validUpto || ''
        }
      });
      
      return NextResponse.json({ success: true, data: (result as any).data });
    }
    
    if (action === 'cancel') {
      const record = await prisma.eWayBillRecord.findFirst({
        where: { invoiceId: invoice.id, status: 'GENERATED' }
      });
      
      if (!record) return NextResponse.json({ error: 'No generated E-Way Bill found' }, { status: 400 });
      
      await prisma.eWayBillRecord.update({
        where: { id: record.id },
        data: { status: 'CANCELLED', cancelReason, cancelDate: new Date().toISOString() }
      });
      
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
