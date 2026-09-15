import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import pdfmake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { format } from 'date-fns';
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

if (typeof window === 'undefined') {
  const pdfMakeModule = pdfmake as any;
  pdfMakeModule.vfs = (pdfFonts as any).pdfMake?.vfs || pdfFonts;
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const invoice = await prisma.salesInvoice.findUnique({
      where: { id: params.id },
      include: {
        items: { include: { product: true } }
      }
    });

    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    const inv: any = invoice;

    const settings: any = await prisma.companySettings.findFirst() || {
      companyName: 'SIDDHI SANITARY WORLD',
      shopAddress: '12-8-102/2, Near Railway Gate',
      city: 'Hunter Road, Warangal-506002',
      gstin: '36EPTPS6462C1ZA',
      state: 'Telangana',
      stateCode: '36',
      mobileNumber: '9666043141, 8639776394',
      email: 'siddhisanitaryworld@gmail.com',
      accountHolderName: 'SIDDHI SANITARY WORLD',
      bankName: 'S.B.I-Wgl (37890342694) A/c',
      accountNumber: '37890342694',
      bankBranch: 'MSME Warangal',
      ifscCode: 'SBIN0020777'
    };

    const company = inv.company || settings;
    const totalQty = inv.items?.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0) || 0;

    const halfCgstTotal = inv.cgstTotal ?? ((inv.totalTax || 0) / 2);
    const halfSgstTotal = inv.sgstTotal ?? ((inv.totalTax || 0) / 2);

    // Build Item table rows
    const itemRows: any[] = inv.items.map((item: any, index: number) => {
      const lineTaxable = (item.quantity * item.rate) - (item.discountAmount || 0);
      return [
        { text: (index + 1).toString(), alignment: 'center' },
        { text: item.productName || item.product?.name || '', bold: true },
        { text: item.hsnCode || item.product?.hsnCode || '-', alignment: 'center' },
        { text: `${item.quantity} ${item.unit || 'NOS'}`, bold: true, alignment: 'center' },
        { text: item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), alignment: 'right' },
        { text: item.unit || 'NOS', alignment: 'center' },
        { text: item.discountPercent ? `${item.discountPercent} %` : '', alignment: 'center' },
        { text: lineTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), bold: true, alignment: 'right' }
      ];
    });

    // CGST & SGST rows inside table
    itemRows.push([
      { text: '', alignment: 'center' },
      { text: 'CGST', bold: true, italics: true, alignment: 'right' },
      { text: '', alignment: 'center' },
      { text: '', alignment: 'center' },
      { text: '', alignment: 'right' },
      { text: '', alignment: 'center' },
      { text: '', alignment: 'center' },
      { text: halfCgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), bold: true, alignment: 'right' }
    ]);

    itemRows.push([
      { text: '', alignment: 'center' },
      { text: 'SGST', bold: true, italics: true, alignment: 'right' },
      { text: '', alignment: 'center' },
      { text: '', alignment: 'center' },
      { text: '', alignment: 'right' },
      { text: '', alignment: 'center' },
      { text: '', alignment: 'center' },
      { text: halfSgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), bold: true, alignment: 'right' }
    ]);

    if (inv.roundOff !== undefined && inv.roundOff !== 0) {
      itemRows.push([
        { text: '', alignment: 'center' },
        { text: 'Round Off', bold: true, italics: true, alignment: 'right' },
        { text: '', alignment: 'center' },
        { text: '', alignment: 'center' },
        { text: '', alignment: 'right' },
        { text: '', alignment: 'center' },
        { text: '', alignment: 'center' },
        { text: inv.roundOff.toFixed(2), bold: true, alignment: 'right' }
      ]);
    }

    // Total row
    itemRows.push([
      { text: 'Total', colSpan: 3, alignment: 'right', bold: true },
      {}, {},
      { text: `${totalQty} NOS`, bold: true, alignment: 'center' },
      {},
      {},
      {},
      { text: `₹ ${inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, bold: true, alignment: 'right' }
    ]);

    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [20, 20, 20, 20],
      defaultStyle: { fontSize: 8, color: '#000000' },
      content: [
        { text: 'Tax Invoice', alignment: 'center', bold: true, fontSize: 11, margin: [0, 0, 0, 4] },
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  table: {
                    widths: ['50%', '50%'],
                    body: [
                      [
                        {
                          stack: [
                            { text: company.companyName || 'SIDDHI SANITARY WORLD', bold: true, fontSize: 10 },
                            { text: company.shopAddress || '12-8-102/2, Near Railway Gate' },
                            { text: company.city || 'Hunter Road, Warangal-506002' },
                            { text: `Cell:${company.mobileNumber || '9666043141, 8639776394'}` },
                            { text: `GSTIN/UIN: ${company.gstin || '36EPTPS6462C1ZA'}` },
                            { text: `State Name : ${company.state || 'Telangana'}, Code : ${company.stateCode || '36'}` },
                            { text: `E-Mail : ${company.email || 'siddhisanitaryworld@gmail.com'}`, margin: [0, 0, 0, 4] },
                            { text: 'Consignee (Ship to)', fontSize: 7.5, color: '#444' },
                            { text: inv.consigneeName || inv.customerName, bold: true },
                            { text: inv.consigneeAddress || inv.shippingAddress || inv.customerAddress || 'GUJARATH BASIN' },
                            { text: `State Name : ${inv.consigneeState || inv.customerState || 'Telangana'}, Code : ${inv.consigneeStateCode || inv.customerStateCode || '36'}`, margin: [0, 0, 0, 4] },
                            { text: 'Buyer (Bill to)', fontSize: 7.5, color: '#444' },
                            { text: inv.customerName, bold: true },
                            { text: inv.customerAddress || 'GUJARATH BASIN' },
                            { text: `State Name : ${inv.customerState || 'Telangana'}, Code : ${inv.customerStateCode || '36'}` },
                            { text: `Place of Supply : ${inv.placeOfSupply || 'Telangana'}` }
                          ]
                        },
                        {
                          table: {
                            widths: ['50%', '50%'],
                            body: [
                              [
                                { stack: [{ text: 'Invoice No.', fontSize: 7, color: '#444' }, { text: inv.invoiceNumber, bold: true }] },
                                { stack: [{ text: 'Dated', fontSize: 7, color: '#444' }, { text: format(new Date(inv.invoiceDate), 'dd-MMM-yyyy'), bold: true }] }
                              ],
                              [
                                { stack: [{ text: 'Delivery Note', fontSize: 7, color: '#444' }, { text: inv.deliveryNote || '' }] },
                                { stack: [{ text: 'Mode/Terms of Payment', fontSize: 7, color: '#444' }, { text: inv.paymentMode || '' }] }
                              ],
                              [
                                { stack: [{ text: 'Dispatch Doc No.', fontSize: 7, color: '#444' }, { text: inv.dispatchDocNo || '' }] },
                                { stack: [{ text: 'Delivery Note Date', fontSize: 7, color: '#444' }, { text: inv.deliveryNoteDate ? format(new Date(inv.deliveryNoteDate), 'dd-MMM-yyyy') : '' }] }
                              ],
                              [
                                { stack: [{ text: 'Dispatched through', fontSize: 7, color: '#444' }, { text: inv.dispatchedThrough || '' }] },
                                { stack: [{ text: 'Destination', fontSize: 7, color: '#444' }, { text: inv.destination || '' }] }
                              ]
                            ]
                          },
                          layout: {
                            hLineWidth: () => 0.5,
                            vLineWidth: () => 0.5,
                            hLineColor: () => '#000000',
                            vLineColor: () => '#000000'
                          }
                        }
                      ]
                    ]
                  },
                  layout: {
                    hLineWidth: () => 0.5,
                    vLineWidth: () => 0.5,
                    hLineColor: () => '#000000',
                    vLineColor: () => '#000000'
                  }
                }
              ],
              [
                {
                  table: {
                    headerRows: 1,
                    widths: [22, '*', 55, 45, 50, 25, 38, 60],
                    body: [
                      [
                        { text: 'Sl No.', bold: true, alignment: 'center' },
                        { text: 'Description of Goods', bold: true },
                        { text: 'HSN/SAC', bold: true, alignment: 'center' },
                        { text: 'Quantity', bold: true, alignment: 'center' },
                        { text: 'Rate', bold: true, alignment: 'right' },
                        { text: 'per', bold: true, alignment: 'center' },
                        { text: 'Disc. %', bold: true, alignment: 'center' },
                        { text: 'Amount', bold: true, alignment: 'right' }
                      ],
                      ...itemRows
                    ]
                  },
                  layout: {
                    hLineWidth: () => 0.5,
                    vLineWidth: () => 0.5,
                    hLineColor: () => '#000000',
                    vLineColor: () => '#000000'
                  }
                }
              ],
              [
                {
                  columns: [
                    { text: [{ text: 'Amount Chargeable (in words)\n', fontSize: 7 }, { text: inv.amountInWords || formatAmountInWords(inv.grandTotal), bold: true, fontSize: 8.5 }] },
                    { text: 'E. & O.E', italics: true, alignment: 'right' }
                  ],
                  margin: [2, 2, 2, 2]
                }
              ],
              [
                {
                  table: {
                    widths: [100, 35, 60, 35, 60, '*'],
                    body: [
                      [
                        { text: 'Taxable Value', rowSpan: 2, bold: true, alignment: 'center' },
                        { text: 'CGST', colSpan: 2, bold: true, alignment: 'center' }, {},
                        { text: 'SGST/UTGST', colSpan: 2, bold: true, alignment: 'center' }, {},
                        { text: 'Total Tax Amount', rowSpan: 2, bold: true, alignment: 'center' }
                      ],
                      [
                        {},
                        { text: 'Rate', bold: true, alignment: 'center' },
                        { text: 'Amount', bold: true, alignment: 'center' },
                        { text: 'Rate', bold: true, alignment: 'center' },
                        { text: 'Amount', bold: true, alignment: 'center' },
                        {}
                      ],
                      [
                        { text: inv.taxableAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), alignment: 'right' },
                        { text: '9%', alignment: 'center' },
                        { text: halfCgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), alignment: 'right' },
                        { text: '9%', alignment: 'center' },
                        { text: halfSgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), alignment: 'right' },
                        { text: inv.totalTax?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), alignment: 'right' }
                      ],
                      [
                        { text: `Total: ${inv.taxableAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, bold: true, alignment: 'right' },
                        {},
                        { text: halfCgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), bold: true, alignment: 'right' },
                        {},
                        { text: halfSgstTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), bold: true, alignment: 'right' },
                        { text: inv.totalTax?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), bold: true, alignment: 'right' }
                      ]
                    ]
                  },
                  layout: {
                    hLineWidth: () => 0.5,
                    vLineWidth: () => 0.5,
                    hLineColor: () => '#000000',
                    vLineColor: () => '#000000'
                  }
                }
              ],
              [
                { text: [{ text: 'Tax Amount (in words) : ', fontSize: 7.5 }, { text: formatAmountInWords(inv.totalTax || 0), bold: true, fontSize: 8 }], margin: [2, 2, 2, 2] }
              ]
,
              [
                {
                  columns: [
                    {
                      width: '50%',
                      stack: [
                        { text: 'Declaration', bold: true, decoration: 'underline', margin: [0, 0, 0, 2] },
                        { text: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.', fontSize: 7, color: '#333' }
                      ],
                      margin: [2, 2, 2, 2]
                    },
                    {
                      width: '50%',
                      stack: [
                        { text: "Company's Bank Details", bold: true, margin: [0, 0, 0, 2] },
                        { text: `A/c Holder's Name : ${company.accountHolderName || company.companyName || 'SIDDHI SANITARY WORLD'}`, bold: true },
                        { text: `Bank Name : ${company.bankName || 'S.B.I-Wgl (37890342694) A/c'}`, bold: true },
                        { text: `A/c No. : ${company.accountNumber || '37890342694'}`, bold: true },
                        { text: `Branch & IFS Code : ${company.bankBranch || 'MSME Warangal'} & ${company.ifscCode || 'SBIN0020777'}`, bold: true }
                      ],
                      margin: [2, 2, 2, 2]
                    }
                  ]
                }
              ],
              [
                {
                  columns: [
                    {
                      width: '50%',
                      text: "Customer's Seal and Signature",
                      margin: [2, 35, 2, 2]
                    },
                    {
                      width: '50%',
                      stack: [
                        { text: `for ${company.companyName || 'SIDDHI SANITARY WORLD'}`, bold: true, alignment: 'right' },
                        { text: 'Authorised Signatory', alignment: 'right', margin: [0, 25, 0, 0] }
                      ],
                      margin: [2, 2, 2, 2]
                    }
                  ]
                }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 0.75,
            vLineWidth: () => 0.75,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000'
          }
        },
        { text: `SUBJECT TO ${(company.city || 'WARANGAL').toUpperCase()} JURISDICTION`, alignment: 'center', bold: true, fontSize: 7.5, margin: [0, 4, 0, 0] }
      ]
    };

    const pdfDocGenerator = pdfmake.createPdf(docDefinition);
    
    const buffer = await new Promise<Buffer>((resolve) => {
      pdfDocGenerator.getBuffer((buf) => {
        resolve(buf);
      });
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice_${invoice.invoiceNumber}.pdf"`
      }
    });

  } catch (error: any) {
    console.error('PDF error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

