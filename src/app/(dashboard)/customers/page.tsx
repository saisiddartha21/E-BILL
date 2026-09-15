'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Eye, Edit, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import debounce from 'lodash/debounce';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  const fetchCustomers = async (searchQuery = search, typeQuery = type, pageQuery = page) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?search=${searchQuery}&type=${typeQuery}&page=${pageQuery}`);
      const data = await res.json();
      setCustomers(data.customers || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setPage(1);
      fetchCustomers(query, type, 1);
    }, 500),
    [type]
  );

  useEffect(() => {
    fetchCustomers(search, type, page);
  }, [type, page]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    debouncedSearch(e.target.value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <Link href="/customers/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Add Customer</Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, mobile, GSTIN..."
            value={search}
            onChange={handleSearch}
            className="pl-8"
          />
        </div>
        <Select value={type} onValueChange={(val) => { setType(val); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Types</SelectItem>
            <SelectItem value="RETAIL">Retail</SelectItem>
            <SelectItem value="BUSINESS">Business</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Card key={i}><CardContent className="h-16 bg-muted animate-pulse" /></Card>)}
        </div>
      ) : customers.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12">
          <p className="text-muted-foreground mb-4">No customers found</p>
          <Link href="/customers/new">
            <Button variant="outline">Add Customer</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="hidden md:block border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>GSTIN</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.mobile}</TableCell>
                    <TableCell>
                      <Badge variant={c.customerType === 'BUSINESS' ? 'default' : 'secondary'}>
                        {c.customerType}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.gstin || '-'}</TableCell>
                    <TableCell className={c.currentBalance > 0 ? 'text-red-500 font-medium' : 'text-green-600'}>
                      {formatCurrency(c.currentBalance)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/customers/${c.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => router.push(`/customers/${c.id}/edit`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Record Payment" onClick={() => router.push(`/customers/${c.id}`)}>
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="md:hidden space-y-4">
            {customers.map((c: any) => (
              <Card key={c.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="font-medium">{c.name}</div>
                    <Badge variant={c.customerType === 'BUSINESS' ? 'default' : 'secondary'}>{c.customerType}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{c.mobile}</div>
                  <div className={`text-sm ${c.currentBalance > 0 ? 'text-red-500' : 'text-green-600'}`}>
                    Balance: {formatCurrency(c.currentBalance)}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/customers/${c.id}`)}>View</Button>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/customers/${c.id}/edit`)}>Edit</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="text-sm">Page {page} of {totalPages}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
