'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Printer, Download, ArrowLeft, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import toast from 'react-hot-toast';
import { ToWords } from 'to-words';

const toWords = new ToWords();

function formatAmountInWords(amount: number): string {
  if (!amount || isNaN(amount)) return 'INR Zero Only';
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  
  try {
    const rupeesStr = toWords.convert(rupees);
    if (paise > 0) {
      const paiseStr = toWords.convert(paise);
      return `INR ${rupeesStr} and ${paiseStr} paise Only`;
    } else {
      return `INR ${rupeesStr} Only`;
    }
  } catch (e) {
    return `INR ${amount.toFixed(2)} Only`;
  }
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`/api/invoices/${params.id}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setInvoice(data);
      } catch (e) {
        toast.error('Could not load invoice details');
      }
      setLoading(false);
    };
    fetchInvoice();
  }, [params.id]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!invoice) return <div className="p-10 text-center">Invoice not found</div>;

  const totalQty = invoice.items?.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0) || 0;
  const company = invoice.company || {};

  // Calculate GST rate breakdown totals
  const halfCgstTotal = invoice.cgstTotal ?? ((invoice.totalTax || 0) / 2);
  const halfSgstTotal = invoice.sgstTotal ?? ((invoice.totalTax || 0) / 2);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Action Bar */}
      <div className="flex justify-between items-center print:hidden">
        <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
          <Button variant="outline" onClick={async () => {
            try {
              const res = await fetch(`/api/invoices/${params.id}/pdf`);
              if (!res.ok) throw new Error('PDF generation failed');
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `Invoice_${invoice.invoiceNumber}.pdf`;
              a.click();
              URL.revokeObjectURL(url);
            } catch (e) {
              toast.error('Failed to download PDF');
            }
          }}><Download className="mr-2 h-4 w-4" /> PDF</Button>
          {invoice.status === 'ACTIVE' && (
            <Button variant="destructive" onClick={async () => {
              if (!confirm('Are you sure you want to cancel this invoice?')) return;
              try {
                const res = await fetch(`/api/invoices/${params.id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to cancel');
                toast.success('Invoice cancelled');
                router.refresh();
                const r = await fetch(`/api/invoices/${params.id}`);
                if (r.ok) setInvoice(await r.json());
              } catch (e) {
                toast.error('Failed to cancel invoice');
              }
            }}><Ban className="mr-2 h-4 w-4" /> Cancel Invoice</Button>
          )}
        </div>
      </div>

      {/* Tally Prime GST Tax Invoice Box */}
      <Card className="bg-white text-black p-4 shadow-lg print:shadow-none print:p-0 border-none font-sans text-xs" id="printable-invoice">
        
        {/* Invoice Title */}
        <h1 className="text-center text-sm font-bold mb-1">Tax Invoice</h1>

        {/* Outer Frame */}
        <div className="border border-black">
          
          {/* Header Split: Left (Seller, Consignee, Buyer) | Right (Invoice Metadata Grid) */}
          <div className="grid grid-cols-12 border-b border-black">
            
            {/* Left Column (Span 6) */}
            <div className="col-span-6 border-r border-black flex flex-col justify-between">
              
              {/* Seller / Company Details */}
              <div className="p-2 border-b border-black leading-snug">
                <h2 className="font-bold text-sm uppercase tracking-tight">{company.companyName || 'SIDDHI SANITARY WORLD'}</h2>
                <p>{company.shopAddress || '12-8-102/2, Near Railway Gate'}</p>
                <p>{company.city || 'Hunter Road, Warangal-506002'}</p>
                <p>Cell:{company.mobileNumber || '9666043141, 8639776394'}</p>
                <p>GSTIN/UIN: {company.gstin || '36EPTPS6462C1ZA'}</p>
                <p>State Name : {company.state || 'Telangana'}, Code : {company.stateCode || '36'}</p>
                <p>E-Mail : {company.email || 'siddhisanitaryworld@gmail.com'}</p>
              </div>

              {/* Consignee (Ship to) */}
              <div className="p-2 border-b border-black leading-snug">
                <p className="text-[11px] text-gray-700 font-medium">Consignee (Ship to)</p>
                <p className="font-bold text-xs uppercase">{invoice.consigneeName || invoice.customerName}</p>
                <p>{invoice.consigneeAddress || invoice.shippingAddress || invoice.customerAddress || 'GUJARATH BASIN'}</p>
                <p>State Name : {invoice.consigneeState || invoice.customerState || 'Telangana'}, Code : {invoice.consigneeStateCode || invoice.customerStateCode || '36'}</p>
              </div>

              {/* Buyer (Bill to) */}
              <div className="p-2 leading-snug">
                <p className="text-[11px] text-gray-700 font-medium">Buyer (Bill to)</p>
                <p className="font-bold text-xs uppercase">{invoice.customerName}</p>
                <p>{invoice.customerAddress || 'GUJARATH BASIN'}</p>
                <p>State Name : {invoice.customerState || 'Telangana'}, Code : {invoice.customerStateCode || '36'}</p>
                <p>Place of Supply : {invoice.placeOfSupply || 'Telangana'}</p>
              </div>
            </div>

            {/* Right Column (Span 6): 2-Column Metadata Sub-Grid */}
            <div className="col-span-6 flex flex-col justify-between">
              <div className="grid grid-cols-2 text-xs">
                
                {/* Row 1 */}
                <div className="border-r border-b border-black p-1.5 min-h-[44px]">
                  <span className="text-[10px] text-gray-600 block">Invoice No.</span>
                  <span className="font-bold text-xs">{invoice.invoiceNumber}</span>
                </div>
                <div className="border-b border-black p-1.5 min-h-[44px]">
                  <span className="text-[10px] text-gray-600 block">Dated</span>
                  <span className="font-bold text-xs">{format(new Date(invoice.invoiceDate), 'dd-MMM-yyyy')}</span>
                </div>

                {/* Row 2 */}
                <div className="border-r border-b border-black p-1.5 min-h-[36px]">
                  <span className="text-[10px] text-gray-600 block">Delivery Note</span>
                  <span>{invoice.deliveryNote || ''}</span>
                </div>
                <div className="border-b border-black p-1.5 min-h-[36px]">
                  <span className="text-[10px] text-gray-600 block">Mode/Terms of Payment</span>
                  <span>{invoice.paymentMode || ''}</span>
                </div>

                {/* Row 3 */}
                <div className="border-r border-b border-black p-1.5 min-h-[36px]">
                  <span className="text-[10px] text-gray-600 block">Dispatch Doc No.</span>
                  <span>{invoice.dispatchDocNo || ''}</span>
                </div>
                <div className="border-b border-black p-1.5 min-h-[36px]">
                  <span className="text-[10px] text-gray-600 block">Delivery Note Date</span>
                  <span>{invoice.deliveryNoteDate ? format(new Date(invoice.deliveryNoteDate), 'dd-MMM-yyyy') : ''}</span>
                </div>

                {/* Row 4 */}
                <div className="border-r border-b border-black p-1.5 min-h-[36px]">
                  <span className="text-[10px] text-gray-600 block">Dispatched through</span>
                  <span>{invoice.dispatchedThrough || ''}</span>
                </div>
                <div className="border-b border-black p-1.5 min-h-[36px]">
                  <span className="text-[10px] text-gray-600 block">Destination</span>
                  <span>{invoice.destination || ''}</span>
                </div>
              </div>

              {/* Lower empty space on right metadata column */}
              <div className="flex-1"></div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border-b border-black">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-black text-[11px] font-bold">
                  <th className="border-r border-black px-1.5 py-1 text-center w-10">Sl No.</th>
                  <th className="border-r border-black px-2 py-1 text-left">Description of Goods</th>
                  <th className="border-r border-black px-1.5 py-1 text-center w-20">HSN/SAC</th>
                  <th className="border-r border-black px-1.5 py-1 text-center w-20">Quantity</th>
                  <th className="border-r border-black px-1.5 py-1 text-right w-20">Rate</th>
                  <th className="border-r border-black px-1 py-1 text-center w-12">per</th>
                  <th className="border-r border-black px-1.5 py-1 text-center w-16">Disc. %</th>
                  <th className="px-2 py-1 text-right w-24">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item: any, idx: number) => {
                  const lineTaxable = (item.quantity * item.rate) - (item.discountAmount || 0);
                  return (
                    <tr key={idx} className="align-top">
                      <td className="border-r border-black px-1.5 py-1 text-center">{idx + 1}</td>
                      <td className="border-r border-black px-2 py-1 font-bold">{item.productName}</td>
                      <td className="border-r border-black px-1.5 py-1 text-center">{item.hsnCode || '-'}</td>
                      <td className="border-r border-black px-1.5 py-1 text-center font-bold">{item.quantity} {item.unit || 'NOS'}</td>
                      <td className="border-r border-black px-1.5 py-1 text-right">{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="border-r border-black px-1 py-1 text-center">{item.unit || 'NOS'}</td>
                      <td className="border-r border-black px-1.5 py-1 text-center">{item.discountPercent ? `${item.discountPercent} %` : ''}</td>
                      <td className="px-2 py-1 text-right font-bold">{lineTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}

                {/* CGST Row inside Table */}
                <tr>
                  <td className="border-r border-black py-0.5"></td>
                  <td className="border-r border-black px-2 py-0.5 text-right font-bold italic">CGST</td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="px-2 py-0.5 text-right font-bold">{halfCgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>

                {/* SGST Row inside Table */}
                <tr>
                  <td className="border-r border-black py-0.5"></td>
                  <td className="border-r border-black px-2 py-0.5 text-right font-bold italic">SGST</td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="px-2 py-0.5 text-right font-bold">{halfSgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>

                {/* Round Off Row inside Table (if present) */}
                {invoice.roundOff !== undefined && invoice.roundOff !== 0 && (
                  <tr>
                    <td className="border-r border-black py-0.5"></td>
                    <td className="border-r border-black px-2 py-0.5 text-right font-bold italic">Round Off</td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="px-2 py-0.5 text-right font-bold">{invoice.roundOff.toFixed(2)}</td>
                  </tr>
                )}

                {/* Table Total Row */}
                <tr className="border-t border-black font-bold text-xs">
                  <td colSpan={3} className="border-r border-black px-2 py-1 text-right">Total</td>
                  <td className="border-r border-black px-1.5 py-1 text-center font-bold">
                    {totalQty} NOS
                  </td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black"></td>
                  <td className="px-2 py-1 text-right font-bold">₹ {invoice.grandTotal?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount Chargeable (in words) */}
          <div className="flex justify-between items-center px-2 py-1.5 border-b border-black font-bold">
            <div>
              <span className="text-[11px] font-normal block">Amount Chargeable (in words)</span>
              <span className="text-xs">{invoice.amountInWords || formatAmountInWords(invoice.grandTotal)}</span>
            </div>
            <span className="text-xs italic font-normal">E. & O.E</span>
          </div>

          {/* GST Tax Breakdown Table */}
          <div className="border-b border-black">
            <table className="w-full text-[11px] border-collapse text-center">
              <thead>
                <tr className="border-b border-black">
                  <th rowSpan={2} className="border-r border-black px-2 py-1 text-center w-28">Taxable Value</th>
                  <th colSpan={2} className="border-r border-black px-2 py-0.5 text-center">CGST</th>
                  <th colSpan={2} className="border-r border-black px-2 py-0.5 text-center">SGST/UTGST</th>
                  <th rowSpan={2} className="px-2 py-1 text-center w-28">Total Tax Amount</th>
                </tr>
                <tr className="border-b border-black">
                  <th className="border-r border-black px-1 py-0.5 text-center w-16">Rate</th>
                  <th className="border-r border-black px-1 py-0.5 text-center w-24">Amount</th>
                  <th className="border-r border-black px-1 py-0.5 text-center w-16">Rate</th>
                  <th className="border-r border-black px-1 py-0.5 text-center w-24">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border-r border-black px-2 py-1 text-right font-medium">{invoice.taxableAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="border-r border-black px-1 py-1">9%</td>
                  <td className="border-r border-black px-2 py-1 text-right font-medium">{halfCgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="border-r border-black px-1 py-1">9%</td>
                  <td className="border-r border-black px-2 py-1 text-right font-medium">{halfSgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-2 py-1 text-right font-medium">{invoice.totalTax?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr className="border-t border-black font-bold">
                  <td className="border-r border-black px-2 py-1 text-right">Total: {invoice.taxableAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black px-2 py-1 text-right">{halfCgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="border-r border-black"></td>
                  <td className="border-r border-black px-2 py-1 text-right">{halfSgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-2 py-1 text-right">{invoice.totalTax?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Amount in Words */}
          <div className="px-2 py-1.5 border-b border-black text-xs">
            <span className="font-normal">Tax Amount (in words) : </span>
            <span className="font-bold">{formatAmountInWords(invoice.totalTax || 0)}</span>
          </div>

          {/* Declaration & Bank Details */}
          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-6 border-r border-black p-2 space-y-1">
              <p className="font-bold underline text-[11px]">Declaration</p>
              <p className="text-[10px] text-gray-700 leading-tight">
                We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
              </p>
            </div>
            <div className="col-span-6 p-2 text-[11px] leading-tight space-y-0.5">
              <p className="font-bold">Company's Bank Details</p>
              <p>A/c Holder's Name : <strong>{company.accountHolderName || company.companyName || 'SIDDHI SANITARY WORLD'}</strong></p>
              <p>Bank Name : <strong>{company.bankName || 'S.B.I-Wgl (37890342694) A/c'}</strong></p>
              <p>A/c No. : <strong>{company.accountNumber || '37890342694'}</strong></p>
              <p>Branch & IFS Code : <strong>{company.bankBranch || 'MSME Warangal'} & {company.ifscCode || 'SBIN0020777'}</strong></p>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-12 text-xs">
            <div className="col-span-6 border-r border-black p-3 pt-12">
              <p className="font-medium">Customer's Seal and Signature</p>
            </div>
            <div className="col-span-6 p-3 pt-4 text-right flex flex-col justify-between">
              <p className="font-bold">for {company.companyName || 'SIDDHI SANITARY WORLD'}</p>
              <p className="font-medium pt-8">Authorised Signatory</p>
            </div>
          </div>
        </div>

        {/* Jurisdictional Footer */}
        <p className="text-center text-[10px] font-bold tracking-widest mt-2 uppercase">
          SUBJECT TO {company.city?.toUpperCase() || 'WARANGAL'} JURISDICTION
        </p>
      </Card>
    </div>
  );
}

