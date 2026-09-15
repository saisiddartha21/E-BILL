import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const skip = (page - 1) * limit;
    
    const where = search ? {
      OR: [
        { name: { contains: search } },
        { mobile: { contains: search } },
        { gstin: { contains: search } },
      ]
    } : {};

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.supplier.count({ where })
    ]);

    return NextResponse.json({
      data: suppliers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch suppliers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Check for duplicate mobile
    if (data.mobile) {
      const existing = await prisma.supplier.findFirst({
        where: { mobile: data.mobile }
      });
      if (existing) {
        return NextResponse.json({ error: 'Mobile number already exists' }, { status: 400 });
      }
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        contactPerson: data.contactPerson,
        mobile: data.mobile,
        email: data.email,
        address: data.address,
        gstin: data.gstin,
        state: data.state,
        stateCode: data.stateCode,
        openingBalance: data.openingBalance || 0,
        currentBalance: data.openingBalance || 0,
        notes: data.notes
      }
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error('Failed to create supplier:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
