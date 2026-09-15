import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        purchases: {
          orderBy: { purchaseDate: 'desc' },
          take: 50
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          take: 50
        }
      }
    });

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Failed to fetch supplier:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    
    if (data.mobile) {
      const existing = await prisma.supplier.findFirst({
        where: { mobile: data.mobile, id: { not: params.id } }
      });
      if (existing) {
        return NextResponse.json({ error: 'Mobile number already exists' }, { status: 400 });
      }
    }

    const supplier = await prisma.supplier.update({
      where: { id: params.id },
      data: {
        name: data.name,
        contactPerson: data.contactPerson,
        mobile: data.mobile,
        email: data.email,
        address: data.address,
        gstin: data.gstin,
        state: data.state,
        stateCode: data.stateCode,
        notes: data.notes
      }
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Failed to update supplier:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const purchasesCount = await prisma.purchase.count({
      where: { supplierId: params.id }
    });

    if (purchasesCount > 0) {
      return NextResponse.json({ error: 'Cannot delete supplier with active purchases' }, { status: 400 });
    }

    await prisma.supplier.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete supplier:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
