"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, AlertTriangle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const { id } = useParams();
  const [isAdmin, setIsAdmin] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => setIsAdmin(data.user?.role === "ADMIN"))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) {
          setProduct(await res.json());
        } else {
          toast.error("Product not found");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  const isLowStock = product.currentStock <= product.minStockLevel;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" /> {product.name}
          </h1>
        </div>
        {isAdmin && (
          <Link href={`/products/${product.id}/edit`}>
            <Button className="flex items-center gap-2"><Edit className="w-4 h-4" /> Edit Product</Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Product Info</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-gray-500">SKU</div><div className="font-medium">{product.sku}</div>
            <div className="text-gray-500">Category</div><div className="font-medium">{product.category?.name || "N/A"}</div>
            <div className="text-gray-500">Brand</div><div className="font-medium">{product.brand || "-"}</div>
            <div className="text-gray-500">Unit</div><div className="font-medium">{product.unit}</div>
            <div className="text-gray-500">HSN Code</div><div className="font-medium">{product.hsnCode || "-"}</div>
            <div className="text-gray-500">Barcode</div><div className="font-medium">{product.barcode || "-"}</div>
          </div>
          {product.description && (
            <div className="pt-2">
              <div className="text-gray-500 text-sm mb-1">Description</div>
              <p className="text-sm">{product.description}</p>
            </div>
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">Pricing</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-gray-500">Purchase Price</div>
            <div className="font-medium">{formatCurrency(product.purchasePrice)}</div>
            <div className="text-gray-500">Selling Price</div>
            <div className="font-medium text-green-600">{formatCurrency(product.sellingPrice)}</div>
            <div className="text-gray-500">MRP</div>
            <div className="font-medium">{formatCurrency(product.mrp)}</div>
            <div className="text-gray-500">GST Rate</div>
            <div className="font-medium">{product.gstRate}%</div>
          </div>
        </Card>

        <Card className={`p-6 space-y-4 ${isLowStock ? "border-red-200 bg-red-50" : ""}`}>
          <h3 className="font-semibold text-lg border-b pb-2">Stock Status</h3>
          <div className="flex flex-col items-center justify-center py-4">
            <div className={`text-4xl font-bold ${isLowStock ? "text-red-600" : "text-gray-800"}`}>
              {product.currentStock}
            </div>
            <div className="text-sm text-gray-500 mt-1">{product.unit}</div>
          </div>
          {isLowStock && (
            <div className="flex items-center gap-2 text-red-600 text-sm justify-center">
              <AlertTriangle className="w-4 h-4" /> Low Stock Warning
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm mt-4">
            <div className="text-gray-500">Min Level</div><div className="font-medium">{product.minStockLevel}</div>
            <div className="text-gray-500">Opening Stock</div><div className="font-medium">{product.openingStock || 0}</div>
          </div>
        </Card>
      </div>

      <Card className="mt-8 p-6">
        <Tabs defaultValue="stock">
          <TabsList className="mb-4">
            <TabsTrigger value="stock">Stock History</TabsTrigger>
            <TabsTrigger value="sales">Sales History</TabsTrigger>
          </TabsList>
          <TabsContent value="stock">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.stockMovements?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-gray-500 py-4">No stock movements found.</TableCell></TableRow>
                ) : (
                  product.stockMovements?.map((m: any) => {
                    const quantity = m.quantityIn > 0 ? +m.quantityIn : -m.quantityOut;
                    return (
                    <TableRow key={m.id}>
                      <TableCell>{formatDate(m.createdAt)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {m.transactionType}
                        </span>
                      </TableCell>
                      <TableCell>{m.referenceNumber || m.referenceType}</TableCell>
                      <TableCell className={quantity > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {quantity > 0 ? "+" : ""}{quantity}
                      </TableCell>
                      <TableCell>{m.balanceAfter}</TableCell>
                      <TableCell>{m.user?.name || "System"}</TableCell>
                    </TableRow>
                  )})
                )}
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="sales">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {product.salesInvoiceItems?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-4">No sales history found.</TableCell></TableRow>
                ) : (
                  product.salesInvoiceItems?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.invoice?.invoiceDate)}</TableCell>
                      <TableCell>{item.invoice?.invoiceNumber || "N/A"}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.rate)}</TableCell>
                      <TableCell>{formatCurrency(item.totalAmount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
