"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, Filter, Edit, Trash2, AlertTriangle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ProductsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => setIsAdmin(data.user?.role === "ADMIN"))
      .catch(err => console.error(err));
  }, []);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("");
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, category, brand, lowStock, page]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) setCategories(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        search: debouncedSearch,
        brand,
      });
      if (category !== "all") params.append("categoryId", category);
      if (lowStock) params.append("lowStock", "true");

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Product deleted successfully");
        fetchProducts();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6" /> Products
        </h1>
        {isAdmin && (
          <div className="flex gap-2">
            <Link href="/products/categories">
              <Button variant="outline">Categories</Button>
            </Link>
            <Link href="/products/new">
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Product
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Filter by brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="w-[180px]"
          />
          <Button
            variant={lowStock ? "destructive" : "outline"}
            onClick={() => setLowStock(!lowStock)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" /> Low Stock
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No products found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const isLow = p.currentStock <= p.minStockLevel;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.sku}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.category?.name || "N/A"}</TableCell>
                      <TableCell>{p.brand || "-"}</TableCell>
                      <TableCell>{formatCurrency(p.sellingPrice)}</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-2 ${isLow ? 'text-red-500 font-medium' : ''}`}>
                          {p.currentStock} {p.unit}
                          {isLow && <AlertTriangle className="w-4 h-4" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/products/${p.id}`}>
                            <Button variant="outline" size="sm">View</Button>
                          </Link>
                          {isAdmin && (
                            <>
                              <Link href={`/products/${p.id}/edit`}>
                                <Button variant="ghost" size="icon">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(p.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex justify-between items-center mt-6">
          <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)} variant="outline">Previous</Button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <Button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} variant="outline">Next</Button>
        </div>
      </Card>
    </div>
  );
}
