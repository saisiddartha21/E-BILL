import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const productSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
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
  openingStock: z.number().min(0).default(0),
  supplierId: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const brand = searchParams.get("brand") || "";
    const lowStock = searchParams.get("lowStock") === "true";
    const sort = searchParams.get("sort") || "name";

    const skip = (page - 1) * limit;

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (brand) where.brand = { contains: brand };

    let orderBy: any = { name: "asc" };
    if (sort === "createdAt") orderBy = { createdAt: "desc" };
    else if (sort === "currentStock") orderBy = { currentStock: "asc" };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    // Handle precise low stock filter in JS
    let filteredProducts = products;
    if (lowStock) {
      filteredProducts = products.filter((p) => p.currentStock <= p.minStockLevel);
    }

    return NextResponse.json({
      products: filteredProducts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const role = req.headers.get("x-user-role");
    const userId = req.headers.get("x-user-id") || "system";
    
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const validated = productSchema.parse(body);

    const existingSku = await prisma.product.findUnique({ where: { sku: validated.sku } });
    if (existingSku) return NextResponse.json({ error: "SKU already exists" }, { status: 400 });

    if (validated.barcode) {
      const existingBarcode = await prisma.product.findFirst({ where: { barcode: validated.barcode } });
      if (existingBarcode) return NextResponse.json({ error: "Barcode already exists" }, { status: 400 });
    }

    const newProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sku: validated.sku,
          name: validated.name,
          categoryId: validated.categoryId,
          brand: validated.brand || "",
          description: validated.description || "",
          hsnCode: validated.hsnCode || "",
          unit: validated.unit,
          purchasePrice: validated.purchasePrice,
          sellingPrice: validated.sellingPrice,
          mrp: validated.mrp,
          gstRate: validated.gstRate,
          minStockLevel: validated.minStockLevel,
          openingStock: validated.openingStock,
          currentStock: validated.openingStock,
          supplierId: validated.supplierId || null,
          barcode: validated.barcode || null,
          isActive: true,
        },
        include: { category: true },
      });

      if (validated.openingStock > 0) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            movementDate: new Date(),
            transactionType: "OPENING_STOCK",
            referenceType: "MANUAL",
            referenceId: "",
            referenceNumber: "INITIAL_SEED",
            quantityIn: validated.openingStock,
            quantityOut: 0,
            balanceAfter: validated.openingStock,
            notes: "Opening Stock initialized",
            userId: userId !== "system" ? userId : null,
          },
        });
      }

      return product;
    });

    await logAudit({
      userId,
      action: "PRODUCT_ADDED",
      entity: "Product",
      entityId: newProduct.id,
      details: `Added product ${newProduct.sku} - ${newProduct.name}`,
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
