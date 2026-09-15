import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        stockMovements: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { user: { select: { name: true } } },
        },
        salesInvoiceItems: {
          include: { invoice: true },
          orderBy: { id: "desc" },
          take: 10,
        },
      },
    });

    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const updateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
  brand: z.string().optional(),
  description: z.string().optional(),
  hsnCode: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  purchasePrice: z.number().min(0),
  sellingPrice: z.number().min(0),
  mrp: z.number().min(0),
  gstRate: z.number().min(0),
  minStockLevel: z.number().min(0),
  supplierId: z.string().optional().nullable(),
  barcode: z.string().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const role = req.headers.get("x-user-role");
    const userId = req.headers.get("x-user-id") || "system";
    
    if (role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await req.json();
    const validated = updateSchema.parse(body);

    if (validated.barcode) {
      const existingBarcode = await prisma.product.findFirst({
        where: { barcode: validated.barcode, id: { not: params.id } },
      });
      if (existingBarcode) return NextResponse.json({ error: "Barcode already exists" }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: validated,
    });

    await logAudit({
      userId,
      action: "PRODUCT_UPDATED",
      entity: "Product",
      entityId: params.id,
      details: `Updated product ${updatedProduct.sku}`,
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const role = req.headers.get("x-user-role");
    const userId = req.headers.get("x-user-id") || "system";
    
    if (role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const invoiceCount = await prisma.salesInvoiceItem.count({ where: { productId: params.id } });
    if (invoiceCount > 0) {
      return NextResponse.json({ error: "Cannot delete product referenced in invoices" }, { status: 400 });
    }

    await prisma.product.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    await logAudit({
      userId,
      action: "PRODUCT_DELETED",
      entity: "Product",
      entityId: params.id,
      details: `Soft deleted product ${params.id}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
