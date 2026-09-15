import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId');
    const lowStock = searchParams.get('lowStock') === 'true';
    const movements = searchParams.get('movements') === 'true';
    const productId = searchParams.get('productId');

    if (movements) {
      const moves = await prisma.stockMovement.findMany({
        where: productId ? { productId } : {},
        include: { product: true, user: true },
        orderBy: { movementDate: 'desc' }
      });
      return NextResponse.json(moves);
    }

    let whereClause: any = {
      OR: [
        { name: { contains: search } },
        { sku: { contains: search } }
      ]
    };

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: { category: true }
    });

    const filtered = lowStock 
      ? products.filter(p => p.currentStock <= p.minStockLevel)
      : products;

    return NextResponse.json(filtered);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
