'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowLeft, CheckCircle2, XCircle, FileJson, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function EWayBillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [validation, setValidation] = useState<any>(null);
  const [transportDetails, setTransportDetails] = useState({
    transporterId: '',
    transporterName: '',
    transMode: '1',
    vehicleNo: '',
    vehicleType: 'R',
    transDistance: '0',
    transDocNo: '',
  });

  useEffect(() => {
    fetchDetails();
  }, [params.id]);

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/eway-bill/${params.id}`);
      if (!res.ok) throw new Error('Failed to fetch details');
      const json = await res.json();
      setData(json);
      
      const record = json.eWayBillRecords?.[0];
      if (record?.transportDetails) {
        setTransportDetails(JSON.parse(record.transportDetails));
      }
    } catch (error) {
      toast.error('Failed to load e-way bill details');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    try {
      const res = await fetch(`/api/eway-bill/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', transportDetails })
      });
      const result = await res.json();
      setValidation(result);
      if (result.isValid) toast.success('Validation passed');
      else toast.error('Validation failed');
    } catch (error) {
      toast.error('Validation request failed');
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(`/api/eway-bill/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', transportDetails })
      });
      const result = await res.json();
      if (result.success) {
        toast.success('E-Way Bill submitted successfully');
      } else {
        toast.error(result.error || 'Failed to submit');
      }
      fetchDetails();
    } catch (error) {
      toast.error('Submission request failed');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Data not found</div>;

  const invoice = data.invoice;
  const status = data.eWayBillRecords?.[0]?.status || 'NOT_GENERATED';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/e-way-bill" className="text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Manage E-Way Bill</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Invoice Summary</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-500">Invoice Number</p><p className="font-medium">{invoice.invoiceNumber}</p></div>
            <div><p className="text-gray-500">Date</p><p className="font-medium">{formatDate(invoice.invoiceDate)}</p></div>
            <div><p className="text-gray-500">Customer</p><p className="font-medium">{invoice.customer.name}</p></div>
            <div><p className="text-gray-500">Amount</p><p className="font-medium text-lg">{formatCurrency(invoice.grandTotal)}</p></div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">E-Way Bill Status</h2>
          <span className={`px-3 py-1 text-sm rounded-full font-medium inline-block bg-gray-100 text-gray-800`}>
            {status}
          </span>
          {data.eWayBillRecords?.[0]?.errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-100">
              {data.eWayBillRecords[0].errorMessage}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
        <h2 className="text-lg font-semibold border-b pb-2">Transport Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transport Mode</label>
            <select
              value={transportDetails.transMode}
              onChange={(e) => setTransportDetails({...transportDetails, transMode: e.target.value})}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="1">Road</option>
              <option value="2">Rail</option>
              <option value="3">Air</option>
              <option value="4">Ship</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number (Required for Road)</label>
            <input
              type="text"
              value={transportDetails.vehicleNo}
              onChange={(e) => setTransportDetails({...transportDetails, vehicleNo: e.target.value})}
              className="w-full px-3 py-2 border rounded-md uppercase"
              placeholder="e.g. MH01AB1234"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Approx. Distance (in KM)</label>
            <input
              type="number"
              value={transportDetails.transDistance}
              onChange={(e) => setTransportDetails({...transportDetails, transDistance: e.target.value})}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transporter ID</label>
            <input
              type="text"
              value={transportDetails.transporterId}
              onChange={(e) => setTransportDetails({...transportDetails, transporterId: e.target.value})}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Transporter Name</label>
            <input
              type="text"
              value={transportDetails.transporterName}
              onChange={(e) => setTransportDetails({...transportDetails, transporterName: e.target.value})}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <button 
            onClick={handleValidate}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-sm font-medium"
          >
            Validate Data
          </button>
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
          >
            Submit E-Way Bill
          </button>
        </div>

        {validation && (
          <div className={`p-4 rounded-md border ${validation.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            {validation.isValid ? (
              <div className="flex items-center text-green-700">
                <CheckCircle2 className="w-5 h-5 mr-2" /> Valid for submission
              </div>
            ) : (
              <div>
                <div className="flex items-center text-red-700 font-medium mb-2">
                  <XCircle className="w-5 h-5 mr-2" /> Validation Errors
                </div>
                <ul className="list-disc pl-5 space-y-1 text-sm text-red-600">
                  {validation.errors.map((err: string, i: number) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
