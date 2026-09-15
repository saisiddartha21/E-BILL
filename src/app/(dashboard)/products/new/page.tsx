"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { unitOptions, gstRates } from "@/lib/utils";

const formSchema = z.object({
  sku: z.string().min(1, "SKU is required"),
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
  brand: z.string().optional(),
  description: z.string().optional(),
  hsnCode: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  purchasePrice: z.coerce.number().min(0, "Invalid price"),
  sellingPrice: z.coerce.number().min(0, "Invalid price"),
  mrp: z.coerce.number().min(0, "Invalid price"),
  gstRate: z.coerce.number().min(0),
  openingStock: z.coerce.number().min(0),
  minStockLevel: z.coerce.number().min(0),
  supplierId: z.string().optional(),
  barcode: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sku: "SVE-",
      name: "",
      brand: "",
      description: "",
      hsnCode: "",
      unit: "NOS",
      purchasePrice: 0,
      sellingPrice: 0,
      mrp: 0,
      gstRate: 0,
      openingStock: 0,
      minStockLevel: 5,
      barcode: "",
      categoryId: "",
      supplierId: "",
    },
  });

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories).catch(console.error);
    fetch("/api/suppliers").then((r) => r.json()).then(setSuppliers).catch(console.error);
  }, []);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Product created successfully");
        router.push("/products");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create product");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/products">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <h1 className="text-2xl font-bold">Add New Product</h1>
      </div>

      <Card className="p-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>SKU *</Label>
              <Input {...form.register("sku")} placeholder="e.g. SVE-001" />
              {form.formState.errors.sku && <p className="text-sm text-red-500">{form.formState.errors.sku.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input {...form.register("name")} placeholder="Product Name" />
              {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select onValueChange={(val) => form.setValue("categoryId", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.categoryId && <p className="text-sm text-red-500">{form.formState.errors.categoryId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input {...form.register("brand")} placeholder="Brand Name" />
            </div>

            <div className="space-y-2">
              <Label>Unit *</Label>
              <Select defaultValue="NOS" onValueChange={(val) => form.setValue("unit", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions?.map((u: any) => (
                    <SelectItem key={u.value || u} value={u.value || u}>{u.label || u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>HSN / SAC Code</Label>
              <Input {...form.register("hsnCode")} placeholder="HSN Code" />
            </div>

            <div className="space-y-2">
              <Label>Purchase Price (₹) *</Label>
              <Input type="number" step="0.01" {...form.register("purchasePrice")} />
            </div>
            <div className="space-y-2">
              <Label>Selling Price (₹) *</Label>
              <Input type="number" step="0.01" {...form.register("sellingPrice")} />
            </div>

            <div className="space-y-2">
              <Label>MRP (₹) *</Label>
              <Input type="number" step="0.01" {...form.register("mrp")} />
            </div>
            <div className="space-y-2">
              <Label>GST Rate (%) *</Label>
              <Select defaultValue="0" onValueChange={(val) => form.setValue("gstRate", Number(val))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select GST" />
                </SelectTrigger>
                <SelectContent>
                  {gstRates?.map((g: any) => (
                    <SelectItem key={g} value={g.toString()}>{g}%</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Opening Stock</Label>
              <Input type="number" {...form.register("openingStock")} />
            </div>
            <div className="space-y-2">
              <Label>Minimum Stock Level</Label>
              <Input type="number" {...form.register("minStockLevel")} />
            </div>

            <div className="space-y-2">
              <Label>Barcode (Optional)</Label>
              <Input {...form.register("barcode")} placeholder="Scan or enter barcode" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea {...form.register("description")} placeholder="Product description..." />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link href="/products">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
