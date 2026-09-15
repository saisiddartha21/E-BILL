'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    if (res.ok) {
      setUsers(await res.json());
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <div className="p-8">Loading users...</div>;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <Button onClick={() => alert('Add user modal would open here')}>Add User</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                  <TableCell>
                    <Badge className={user.isActive ? 'bg-green-500' : 'bg-red-500'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
