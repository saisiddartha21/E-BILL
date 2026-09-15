'use client';

import { useState, useEffect } from 'react';
import { formatDate } from '@/lib/utils';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/audit-logs?page=${page}&action=${actionFilter}&entity=${entityFilter}`);
      const data = await res.json();
      setLogs(data.logs);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityFilter]);

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800';
    if (action.includes('UPDATE')) return 'bg-yellow-100 text-yellow-800';
    if (action.includes('DELETE') || action.includes('CANCEL')) return 'bg-red-100 text-red-800';
    if (action.includes('LOGIN')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <select 
          value={actionFilter} 
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="border rounded-md px-3 py-2 w-full sm:w-48"
        >
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="LOGIN">Login</option>
        </select>

        <select 
          value={entityFilter} 
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
          className="border rounded-md px-3 py-2 w-full sm:w-48"
        >
          <option value="">All Entities</option>
          <option value="INVOICE">Invoice</option>
          <option value="PRODUCT">Product</option>
          <option value="CUSTOMER">Customer</option>
          <option value="USER">User</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Loading logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No logs found.</td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.user?.name || 'System'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.entity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.entityId}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination Placeholder */}
      <div className="flex justify-between items-center">
        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-4 py-2 border rounded-md disabled:opacity-50 text-sm">Previous</button>
        <span className="text-sm text-gray-600">Page {page} of {totalPages || 1}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-4 py-2 border rounded-md disabled:opacity-50 text-sm">Next</button>
      </div>
    </div>
  );
}
