import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ success: false, error: 'Account is deactivated' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    };

    const token = await signToken(tokenPayload);

    await logAudit({
      userId: user.id,
      action: 'LOGIN',
      details: 'User logged in successfully',
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      }
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
