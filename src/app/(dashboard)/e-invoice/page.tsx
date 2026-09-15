'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Eye, Search, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EInvoicePage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/einvoice?status=${statusFilter}&search=${search}`);
      const data = await res.json();
      setInvoices(data);
    } catch (error) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NOT_GENERATED': return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Not Generated</span>;
      case 'READY': return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Ready</span>;
      case 'SUBMITTED': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Submitted</span>;
      case 'GENERATED': return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Generated</span>;
      case 'FAILED': return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Failed</span>;
      case 'CANCELLED': return <span className="px-2 py-1 bg-gray-200 text-gray-600 line-through text-xs rounded-full">Cancelled</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">E-Invoice</h1>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start text-blue-800">
        <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">E-Invoice integration requires authorized GSP credentials.</p>
          <p className="text-sm mt-1 text-blue-700">Configure your API credentials in environment variables (EINVOICE_CLIENT_ID, EINVOICE_CLIENT_SECRET) to enable automated submission to IRP.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search invoice or customer..."
            className="w-full pl-9 pr-4 py-2 border rounded-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchInvoices()}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-md px-4 py-2 w-full sm:w-auto"
        >
          <option value="All">All Statuses</option>
          <option value="NOT_GENERATED">Not Generated</option>
          <option value="READY">Ready</option>
          <option value="GENERATED">Generated</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IRN</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">Loading invoices...</td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">No invoices found.</td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(invoice.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{invoice.customerName}</div>
                      <div className="text-xs text-gray-500">GSTIN: {invoice.customerGstin || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(invoice.totalAmount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">{getStatusBadge(invoice.eInvoiceStatus)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-[150px]" title={invoice.irn || ''}>
                      {invoice.irn ? (invoice.irn.substring(0, 10) + '...') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/e-invoice/${invoice.id}`} className="text-blue-600 hover:text-blue-900 inline-flex items-center">
                        <Eye className="w-4 h-4 mr-1" /> Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
