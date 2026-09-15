"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      // Assuming a GET /api/categories endpoint returns category + _count.products
      const res = await fetch("/api/categories");
      if (res.ok) {
        setCategories(await res.json());
      }
    } catch (err) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Name is required");

    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingCategory ? "Category updated" : "Category created");
        setIsDialogOpen(false);
        setEditingCategory(null);
        setFormData({ name: "", description: "" });
        fetchCategories();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to save category");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handleDelete = async (id: string, productCount: number) => {
    if (productCount > 0) {
      return toast.error("Cannot delete category with associated products");
    }
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Category deleted");
        fetchCategories();
      } else {
        toast.error("Failed to delete category");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const openDialogForEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || "" });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <h1 className="text-2xl font-bold">Manage Categories</h1>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingCategory(null);
            setFormData({ name: "", description: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Category Name *</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Electronics" 
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description" 
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save Category</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4">
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded" />)}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Products Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-6 text-gray-500">No categories found.</TableCell></TableRow>
              ) : (
                categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-gray-500">{c.description || "-"}</TableCell>
                    <TableCell className="text-center">{c._count?.products || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openDialogForEdit(c)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-700"
                          onClick={() => handleDelete(c.id, c._count?.products || 0)}
                          disabled={(c._count?.products || 0) > 0}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
