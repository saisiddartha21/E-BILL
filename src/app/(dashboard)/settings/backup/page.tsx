'use client';

import { Download, AlertTriangle, Database, FileSpreadsheet } from 'lucide-react';

export default function BackupPage() {
  const handleDownloadDb = () => {
    window.location.href = '/api/backup?type=database';
  };

  const handleExport = (entity: string) => {
    window.location.href = `/api/backup?type=data&entity=${entity}`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Backup & Export</h1>
        <p className="text-gray-500 mt-2">Manage your data backups and export records to CSV.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Database className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">Full Database Backup</h2>
            <p className="text-gray-500 text-sm mt-1 mb-4">
              Download a complete copy of your SQLite database file. This file contains all your settings, customers, products, and invoices. Keep it safe.
            </p>
            <button 
              onClick={handleDownloadDb}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" /> Download Database (.db)
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">Export Data to CSV</h2>
            <p className="text-gray-500 text-sm mt-1 mb-4">
              Export specific records to CSV format for use in Excel or other spreadsheet software.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              <button onClick={() => handleExport('customers')} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">Export Customers</button>
              <button onClick={() => handleExport('products')} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">Export Products</button>
              <button onClick={() => handleExport('invoices')} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm">Export Invoices</button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-red-50 p-6 rounded-lg border border-red-200 mt-12">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-red-900">Danger Zone</h2>
            <p className="text-red-700 text-sm mt-1 mb-4">
              These actions are irreversible. Please ensure you have a database backup before proceeding.
            </p>
            <button 
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
              onClick={() => {
                if (confirm('Are you absolutely sure you want to delete all demo data? This cannot be undone.')) {
                  alert('Demo data deletion would happen here.');
                }
              }}
            >
              Delete All Demo Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
