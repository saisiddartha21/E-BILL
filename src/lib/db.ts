import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function initializeDatabase(): string {
  // 1. If explicit DATABASE_URL is set in environment (e.g. Postgres/MySQL/Turso/Supabase or explicit SQLite path)
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
    return process.env.DATABASE_URL;
  }

  // 2. Check if local prisma/dev.db exists and is accessible
  const localDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  if (fs.existsSync(localDbPath)) {
    try {
      fs.accessSync(localDbPath, fs.constants.R_OK);
      return `file:${localDbPath}`;
    } catch (err) {
      console.warn('Local dev.db exists but not readable, falling back to /tmp/dev.db');
    }
  }

  // 3. For serverless container environments (Zoho Catalyst AppSail, Vercel, AWS Lambda), fallback to /tmp/dev.db
  const tmpDbPath = path.join('/tmp', 'dev.db');
  if (!fs.existsSync(tmpDbPath)) {
    const possibleBundledPaths = [
      localDbPath,
      path.join(process.cwd(), 'dev.db'),
      path.resolve('./prisma/dev.db'),
      path.resolve('./dev.db'),
    ];

    for (const srcPath of possibleBundledPaths) {
      if (fs.existsSync(srcPath)) {
        try {
          fs.copyFileSync(srcPath, tmpDbPath);
          console.log(`Copied SQLite DB from ${srcPath} to ${tmpDbPath}`);
          break;
        } catch (err) {
          console.error(`Failed to copy DB from ${srcPath}:`, err);
        }
      }
    }
  }

  if (fs.existsSync(tmpDbPath)) {
    return `file:${tmpDbPath}`;
  }

  return 'file:./prisma/dev.db';
}

process.env.DATABASE_URL = initializeDatabase();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
