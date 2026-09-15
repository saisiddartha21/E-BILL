import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || '';
    const entity = searchParams.get('entity') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;
    
    let whereClause: any = {};
    if (action) whereClause.action = action;
    if (entity) whereClause.entity = entity;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: { name: true, username: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.auditLog.count({ where: whereClause })
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
