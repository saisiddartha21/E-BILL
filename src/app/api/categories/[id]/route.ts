import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
    });
    
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const role = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id') || 'system';
    
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description } = body;

    const category = await prisma.category.update({
      where: { id: params.id },
      data: { name, description }
    });

    await logAudit(userId, 'UPDATE_CATEGORY', 'Category', category.id, { name });

    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const role = req.headers.get('x-user-role');
    const userId = req.headers.get('x-user-id') || 'system';
    
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const count = await prisma.product.count({
      where: { categoryId: params.id }
    });

    if (count > 0) {
      return NextResponse.json({ error: 'Cannot delete category in use by products' }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id: params.id }
    });

    await logAudit(userId, 'DELETE_CATEGORY', 'Category', params.id, {});

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
