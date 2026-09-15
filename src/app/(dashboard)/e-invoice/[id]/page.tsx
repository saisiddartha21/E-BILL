'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, CheckCircle2, XCircle, FileJson, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function EInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [validation, setValidation] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [payload, setPayload] = useState<string>('');

  useEffect(() => {
    fetchDetails();
  }, [params.id]);

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/einvoice/${params.id}`);
      if (!res.ok) throw new Error('Failed to fetch details');
      const json = await res.json();
      setData(json);
      
      const latestRecord = json.eInvoiceRecords?.[0];
      if (latestRecord?.requestPayload) {
        setPayload(latestRecord.requestPayload);
      }
    } catch (error) {
      toast.error('Failed to load e-invoice details');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    try {
      setValidating(true);
      const res = await fetch(`/api/einvoice/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate' })
      });
      const result = await res.json();
      setValidation(result);
      if (result.isValid) toast.success('Validation passed');
      else toast.error('Validation failed');
    } catch (error) {
      toast.error('Validation request failed');
    } finally {
      setValidating(false);
    }
  };

  const handlePrepare = async () => {
    try {
      setPreparing(true);
      const res = await fetch(`/api/einvoice/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'prepare' })
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Payload prepared successfully');
        setPayload(JSON.stringify(result.payload, null, 2));
        fetchDetails();
      } else {
        toast.error(result.error || 'Failed to prepare payload');
      }
    } catch (error) {
      toast.error('Failed to prepare payload');
    } finally {
      setPreparing(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/einvoice/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit' })
      });
      const result = await res.json();
      if (result.success) {
        toast.success('E-Invoice submitted successfully');
        fetchDetails();
      } else {
        toast.error(result.error || 'Failed to submit E-Invoice');
        fetchDetails(); // To update status to FAILED
      }
    } catch (error) {
      toast.error('Submission request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadJson = () => {
    if (!payload) return;
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `einvoice_${data?.invoice.invoiceNumber}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Data not found</div>;

  const invoice = data.invoice;
  const latestRecord = data.eInvoiceRecords?.[0];
  const status = latestRecord?.status || 'NOT_GENERATED';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/e-invoice" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Manage E-Invoice</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Invoice Summary</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Invoice Number</p>
              <p className="font-medium">{invoice.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-gray-500">Date</p>
              <p className="font-medium">{formatDate(invoice.invoiceDate)}</p>
            </div>
            <div>
              <p className="text-gray-500">Customer</p>
              <p className="font-medium">{invoice.customer.name}</p>
            </div>
            <div>
              <p className="text-gray-500">GSTIN</p>
              <p className="font-medium">{invoice.customer.gstin || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Amount</p>
              <p className="font-medium text-lg">{formatCurrency(invoice.grandTotal)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">E-Invoice Status</h2>
          <div className="flex items-center gap-3">
            <span className="font-medium">Current Status:</span>
            <span className={`px-3 py-1 text-sm rounded-full font-medium ${
              status === 'GENERATED' ? 'bg-green-100 text-green-800' :
              status === 'FAILED' ? 'bg-red-100 text-red-800' :
              status === 'READY' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {status}
            </span>
          </div>
          {latestRecord?.errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-100">
              {latestRecord.errorMessage}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-gray-500" /> Validation
          </h2>
          <p className="text-sm text-gray-500 mb-4">Validate invoice data against NIC requirements</p>
          <button 
            onClick={handleValidate} 
            disabled={validating}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            {validating ? 'Validating...' : 'Run Validation'}
          </button>
          
          {validation && (
            <div className={`mt-4 p-4 rounded-md border ${validation.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              {validation.isValid ? (
                <div className="flex items-center text-green-700">
                  <CheckCircle2 className="w-5 h-5 mr-2" /> All validations passed
                </div>
              ) : (
                <div>
                  <div className="flex items-center text-red-700 font-medium mb-2">
                    <XCircle className="w-5 h-5 mr-2" /> Validation Failed
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-red-600">
                    {validation.errors.map((err: string, i: number) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <FileJson className="w-5 h-5 text-gray-500" /> Generate JSON Payload
          </h2>
          <div className="flex gap-3 mb-4">
            <button 
              onClick={handlePrepare} 
              disabled={preparing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            >
              {preparing ? 'Preparing...' : 'Prepare Payload'}
            </button>
            {payload && (
              <button 
                onClick={downloadJson}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm font-medium transition-colors"
              >
                Download JSON
              </button>
            )}
          </div>
          
          {payload && (
            <div className="mt-4 bg-gray-900 rounded-md p-4 overflow-x-auto">
              <pre className="text-xs text-green-400">
                {typeof payload === 'string' ? JSON.stringify(JSON.parse(payload), null, 2) : JSON.stringify(payload, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-gray-500" /> Submit to IRP
          </h2>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-blue-800 text-sm mb-4">
            E-Invoice integration is not configured. You can download the JSON payload above and upload it manually to the GST portal, or configure API credentials in environment variables.
          </div>
          <button 
            onClick={handleSubmit} 
            disabled={submitting || !payload}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit to IRP'}
          </button>
        </div>
      </div>
    </div>
  );
}
