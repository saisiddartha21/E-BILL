import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const purchaseReturn = await prisma.purchaseReturn.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        purchase: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!purchaseReturn) {
      return NextResponse.json({ error: "Purchase return not found" }, { status: 404 });
    }

    return NextResponse.json(purchaseReturn);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
