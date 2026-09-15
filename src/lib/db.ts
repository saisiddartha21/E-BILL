import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function initializeDatabase(): string {
  // If user configured a custom external database URL (e.g. Postgres / Supabase / Turso), use it
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('dev.db')) {
    return process.env.DATABASE_URL;
  }

  // On Vercel / serverless runtime, copy bundled dev.db to writable /tmp directory if needed
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    const tmpDbPath = path.join('/tmp', 'dev.db');

    if (!fs.existsSync(tmpDbPath)) {
      const possibleBundledPaths = [
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), 'dev.db'),
        path.resolve('./prisma/dev.db'),
        path.resolve('./dev.db'),
      ];

      let copied = false;
      for (const srcPath of possibleBundledPaths) {
        if (fs.existsSync(srcPath)) {
          try {
            fs.copyFileSync(srcPath, tmpDbPath);
            copied = true;
            console.log(`Copied SQLite DB from ${srcPath} to ${tmpDbPath}`);
            break;
          } catch (err) {
            console.error(`Failed to copy DB from ${srcPath}:`, err);
          }
        }
      }

      if (!copied) {
        console.warn('Bundled dev.db not found. Fallback to /tmp/dev.db');
      }
    }

    return `file:${tmpDbPath}`;
  }

  return process.env.DATABASE_URL || 'file:./dev.db';
}

process.env.DATABASE_URL = initializeDatabase();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
