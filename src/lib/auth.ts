import bcryptjs from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.AUTH_SECRET || 'fallback-secret-for-development';
const key = new TextEncoder().encode(secretKey);

export async function hashPassword(password: string): Promise<string> {
  return await bcryptjs.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcryptjs.compare(password, hash);
}

export async function signToken(payload: { userId: string; username: string; role: string; name: string }): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as { userId: string; username: string; role: string; name: string; exp?: number };
  } catch (error) {
    return null;
  }
}

export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) return null;
  return await verifyToken(token);
}
