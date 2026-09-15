"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

export default function StockPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [tab, setTab] = useState<'current' | 'movements' | 'low'>('current');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStock();
    fetchMovements();
  }, [search]);

  const fetchStock = async () => {
    const res = await fetch(`/api/stock?search=${search}`);
    const data = await res.json();
    setProducts(data || []);
  };

  const fetchMovements = async () => {
    const res = await fetch('/api/stock?movements=true');
    const data = await res.json();
    setMovements(data || []);
  };

  const lowStockProducts = products.filter(p => p.currentStock <= p.minStockLevel);
  const outOfStock = products.filter(p => p.currentStock <= 0);
  const totalValue = products.reduce((acc, p) => acc + (p.currentStock * p.purchasePrice), 0);

  const displayProducts = tab === 'low' ? lowStockProducts : products;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Stock Management</h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-2xl font-bold">{products.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-gray-500">Low Stock</p>
          <p className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-gray-500">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{outOfStock.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <p className="text-sm text-gray-500">Total Stock Value</p>
          <p className="text-2xl font-bold">₹{totalValue.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex gap-4 border-b pb-2">
        <Button variant={tab === 'current' ? 'default' : 'ghost'} onClick={() => setTab('current')}>Current Stock</Button>
        <Button variant={tab === 'movements' ? 'default' : 'ghost'} onClick={() => setTab('movements')}>Movements</Button>
        <Button variant={tab === 'low' ? 'default' : 'ghost'} onClick={() => setTab('low')}>Low Stock Alerts</Button>
      </div>

      {(tab === 'current' || tab === 'low') && (
        <div className="space-y-4">
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-72" />
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Min Level</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayProducts.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.sku}</TableCell>
                    <TableCell>{p.category?.name}</TableCell>
                    <TableCell>{p.currentStock} {p.unit}</TableCell>
                    <TableCell>{p.minStockLevel}</TableCell>
                    <TableCell>
                      {p.currentStock <= 0 ? <Badge variant="destructive">Out of Stock</Badge> : 
                       p.currentStock <= p.minStockLevel ? <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Low Stock</Badge> : 
                       <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">OK</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {tab === 'movements' && (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>In</TableHead>
                <TableHead>Out</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map(m => (
                <TableRow key={m.id}>
                  <TableCell>{new Date(m.movementDate).toLocaleDateString()}</TableCell>
                  <TableCell>{m.product?.name}</TableCell>
                  <TableCell><Badge variant="outline">{m.transactionType}</Badge></TableCell>
                  <TableCell>{m.referenceNumber || m.referenceType}</TableCell>
                  <TableCell className="text-green-600">{m.quantityIn > 0 ? `+${m.quantityIn}` : '-'}</TableCell>
                  <TableCell className="text-red-600">{m.quantityOut > 0 ? `-${m.quantityOut}` : '-'}</TableCell>
                  <TableCell className="font-bold">{m.balanceAfter}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
