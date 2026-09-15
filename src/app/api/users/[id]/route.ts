import prisma from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import bcryptjs from 'bcryptjs';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const role = req.headers.get('x-user-role');
    if (role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, username: true, name: true, role: true, isActive: true }
    });
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const role = req.headers.get('x-user-role');
    const adminId = req.headers.get('x-user-id') || 'system';
    if (role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { name, userRole, isActive, password } = await req.json();
    
    let updateData: any = { name, role: userRole, isActive };
    if (password) {
      updateData.passwordHash = await bcryptjs.hash(password, 10);
    }

    // Prevent deactivating last admin
    if (isActive === false) {
      const targetUser = await prisma.user.findUnique({ where: { id: params.id }});
      if (targetUser?.role === 'ADMIN') {
        const adminCount = await prisma.user.count({ where: { role: 'ADMIN', isActive: true }});
        if (adminCount <= 1) {
          return NextResponse.json({ error: 'Cannot deactivate the last admin' }, { status: 400 });
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, username: true, name: true, role: true, isActive: true }
    });

    await logAudit(adminId, 'UPDATE_USER', 'User', params.id, { username: updated.username });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const role = req.headers.get('x-user-role');
    const adminId = req.headers.get('x-user-id') || 'system';
    if (role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    if (adminId === params.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: params.id }});
    if (targetUser?.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN', isActive: true }});
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last admin' }, { status: 400 });
      }
    }

    await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false }
    });

    await logAudit(adminId, 'DEACTIVATE_USER', 'User', params.id, {});

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
