import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const entity = searchParams.get('entity');

    if (type === 'database') {
      const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
      if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': 'application/x-sqlite3',
            'Content-Disposition': 'attachment; filename="backup.db"',
          }
        });
      }
      return NextResponse.json({ error: 'Database file not found' }, { status: 404 });
    }

    if (type === 'data' && entity) {
      let data: any[] = [];
      
      switch (entity) {
        case 'customers': data = await prisma.customer.findMany(); break;
        case 'products': data = await prisma.product.findMany(); break;
        case 'invoices': data = await prisma.salesInvoice.findMany({ include: { items: true } }); break;
        default: return NextResponse.json({ error: 'Invalid entity' }, { status: 400 });
      }

      // Convert to CSV simply
      if (data.length === 0) return new NextResponse("No data", { headers: { 'Content-Type': 'text/csv' } });
      
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(obj => Object.values(obj).map(v => typeof v === 'object' ? JSON.stringify(v) : v).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${entity}_export.csv"`,
        }
      });
    }

    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: 'Failed to generate backup' }, { status: 500 });
  }
}
