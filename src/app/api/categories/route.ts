import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    
    const categories = await prisma.category.findMany({
      where: query ? {
        name: { contains: query }
      } : undefined,
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id') || 'system';
    
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: { name, description }
    });

    await logAudit(userId, 'CREATE_CATEGORY', 'Category', category.id, { name });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
