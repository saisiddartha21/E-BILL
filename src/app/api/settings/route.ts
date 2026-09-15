import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const settings = await prisma.companySettings.findFirst();
    return NextResponse.json(settings || {});
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id') || 'system';

    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    
    // In a real app we'd validate via Zod here
    // Example: const parsed = settingsSchema.parse(body);
    const parsed = body;
    
    if (parsed.invoiceStartNumber !== undefined) {
      parsed.startingInvoiceNo = parseInt(parsed.invoiceStartNumber, 10);
      delete parsed.invoiceStartNumber;
    } else if (parsed.startingInvoiceNo !== undefined) {
      parsed.startingInvoiceNo = parseInt(parsed.startingInvoiceNo, 10);
    }
    
    let settings = await prisma.companySettings.findFirst();
    if (settings) {
      settings = await prisma.companySettings.update({
        where: { id: settings.id },
        data: parsed
      });
    } else {
      settings = await prisma.companySettings.create({
        data: parsed
      });
    }

    await logAudit(userId, 'UPDATE_SETTINGS', 'Settings', settings.id, { updated: true });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
