import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { customerSchema } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const sort = searchParams.get('sort') || 'createdAt:desc';
    
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { mobile: { contains: search } },
        { gstin: { contains: search } },
      ];
    }
    
    if (type && type !== 'All') {
      where.customerType = type.toUpperCase();
    }

    const [sortField, sortOrder] = sort.split(':');
    const orderBy = { [sortField]: sortOrder || 'desc' };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({ customers, total, page, limit, totalPages });
  } catch (error: any) {
    console.error('Error in GET /api/customers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const data = customerSchema.parse(body);

    const existing = await prisma.customer.findUnique({
      where: { mobile: data.mobile },
    });

    if (existing) {
      return NextResponse.json({ error: 'Mobile number already exists' }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        ...data,
        currentBalance: data.openingBalance || 0,
      } as any,
    });

    await logAudit(prisma, {
      userId: session.userId,
      action: 'CUSTOMER_CREATED' as any,
      entity: 'CUSTOMER',
      entityId: customer.id,
      details: { name: customer.name, mobile: customer.mobile },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error('Error in POST /api/customers:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
