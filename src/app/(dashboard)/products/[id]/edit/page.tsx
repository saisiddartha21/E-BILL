"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
  brand: z.string().optional(),
  description: z.string().optional(),
  hsnCode: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
  purchasePrice: z.coerce.number().min(0),
  sellingPrice: z.coerce.number().min(0),
  mrp: z.coerce.number().min(0),
  gstRate: z.coerce.number().min(0),
  minStockLevel: z.coerce.number().min(0),
  barcode: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productSku, setProductSku] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then(setCategories).catch(console.error);
    
    if (id) {
      fetch(`/api/products/${id}`)
        .then((r) => r.json())
        .then((data) => {
          setProductSku(data.sku);
          form.reset({
            name: data.name,
            categoryId: data.categoryId,
            brand: data.brand || "",
            description: data.description || "",
            hsnCode: data.hsnCode || "",
            unit: data.unit,
            purchasePrice: data.purchasePrice,
            sellingPrice: data.sellingPrice,
            mrp: data.mrp,
            gstRate: data.gstRate,
            minStockLevel: data.minStockLevel,
            barcode: data.barcode || "",
          });
          setLoading(false);
        })
        .catch(() => {
          toast.error("Failed to load product");
          setLoading(false);
        });
    }
  }, [id, form]);

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Product updated successfully");
        router.push(`/products/${id}`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update product");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/products/${id}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Product: {productSku}</h1>
      </div>

      <Card className="p-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input value={productSku} disabled className="bg-gray-100" />
              <p className="text-xs text-gray-500">SKU cannot be changed.</p>
            </div>
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input {...form.register("name")} />
              {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select onValueChange={(val) => form.setValue("categoryId", val)} defaultValue={form.getValues("categoryId")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input {...form.register("brand")} />
            </div>

            <div className="space-y-2">
              <Label>Unit *</Label>
              <Select onValueChange={(val) => form.setValue("unit", val)} defaultValue={form.getValues("unit")}>
                <SelectTrigger>
                  <SelectValue />
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
              <Input {...form.register("hsnCode")} />
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
              <Select onValueChange={(val) => form.setValue("gstRate", Number(val))} defaultValue={form.getValues("gstRate")?.toString()}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {gstRates?.map((g: any) => (
                    <SelectItem key={g} value={g.toString()}>{g}%</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Minimum Stock Level</Label>
              <Input type="number" {...form.register("minStockLevel")} />
            </div>
            <div className="space-y-2">
              <Label>Barcode (Optional)</Label>
              <Input {...form.register("barcode")} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea {...form.register("description")} />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Link href={`/products/${id}`}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? "Updating..." : "Update Product"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
