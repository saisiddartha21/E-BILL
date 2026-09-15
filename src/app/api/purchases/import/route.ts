import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const pdf = require("pdf-parse/lib/pdf-parse.js");
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Please upload a PDF invoice." }, { status: 400 });
    }

    const result = await pdf(Buffer.from(await file.arrayBuffer()));
    const text = result.text.replace(/\r/g, "");
    const products = await prisma.product.findMany({ where: { isActive: true } });
    const items = products.flatMap((product) => {
      const line = (text as string).split("\n").find((value: string) => {
        const normalized = value.toLowerCase();
        return normalized.includes(product.sku.toLowerCase()) || normalized.includes(product.name.toLowerCase());
      });

      if (!line) return [];
      const numbers = line.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];
      if (numbers.length < 2) return [];

      const rate = numbers[numbers.length - 1];
      const quantity = numbers[numbers.length - 2];
      return [{ productId: product.id, quantity, rate, gstRate: product.gstRate, unit: product.unit }];
    });

    const invoiceNumber = text.match(/(?:invoice|inv)[\s#.:/-]*([A-Z0-9][A-Z0-9/-]*)/i)?.[1] || "";
    const date = text.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/)?.[1] || "";

    return NextResponse.json({ invoiceNumber, date, items, text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Could not read this PDF invoice." }, { status: 500 });
  }
}