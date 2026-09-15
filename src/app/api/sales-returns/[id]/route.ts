import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const salesReturn = await prisma.salesReturn.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        invoice: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!salesReturn) {
      return NextResponse.json({ error: "Sales return not found" }, { status: 404 });
    }

    return NextResponse.json(salesReturn);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
