import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { customerSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        invoices: { orderBy: { invoiceDate: 'desc' }, take: 10 },
        payments: { orderBy: { paymentDate: 'desc' }, take: 10 },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const data = customerSchema.parse(body);

    const existing = await prisma.customer.findFirst({
      where: { mobile: data.mobile, id: { not: params.id } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Mobile number already in use by another customer' }, { status: 400 });
    }

    const currentCustomer = await prisma.customer.findUnique({ where: { id: params.id } });
    if (!currentCustomer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        ...data,
        currentBalance: currentCustomer.currentBalance - currentCustomer.openingBalance + (data.openingBalance || 0),
      } as any,
    });

    await logAudit(prisma, {
      userId: session.userId,
      action: 'CUSTOMER_EDITED' as any,
      entity: 'CUSTOMER',
      entityId: customer.id,
      details: { updatedFields: data },
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: { invoices: { where: { status: 'ACTIVE' } } },
    });

    if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (customer.invoices.length > 0) {
      return NextResponse.json({ error: 'Cannot delete customer with active invoices' }, { status: 400 });
    }

    await prisma.customer.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    await logAudit(prisma, {
      userId: session.userId,
      action: 'CUSTOMER_DELETED' as any,
      entity: 'CUSTOMER',
      entityId: params.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
