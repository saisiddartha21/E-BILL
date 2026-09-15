import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');
    
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get('x-user-role');
    const adminId = req.headers.get('x-user-id') || 'system';
    
    if (role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { username, name, password, userRole } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    const passwordHash = await bcryptjs.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        name,
        passwordHash,
        role: userRole || 'STAFF',
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        isActive: true,
      }
    });

    await logAudit(adminId, 'CREATE_USER', 'User', user.id, { username: user.username });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
