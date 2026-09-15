import { z } from 'zod';

const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const mobileRegex = /^[6-9]\d{9}$/;

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().regex(mobileRegex, 'Invalid mobile number (10 digits starting with 6-9)'),
  alternateMobile: z.string().regex(mobileRegex, 'Invalid mobile number').optional().or(z.literal('')),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  gstin: z.string().regex(gstinRegex, 'Invalid GSTIN format').optional().or(z.literal('')),
  state: z.string().optional(),
  stateCode: z.string().optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode').optional().or(z.literal('')),
  customerType: z.enum(['RETAIL', 'BUSINESS']).default('RETAIL'),
  openingBalance: z.number().default(0),
  creditLimit: z.number().optional().default(0),
  notes: z.string().optional(),
});

export const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().regex(mobileRegex, 'Invalid mobile number'),
  gstin: z.string().regex(gstinRegex, 'Invalid GSTIN format').optional().or(z.literal('')),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  address: z.string().optional(),
  state: z.string().optional(),
  stateCode: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  sellingPrice: z.number().min(0, 'Selling price must be >= 0'),
  purchasePrice: z.number().min(0, 'Purchase price must be >= 0'),
  gstRate: z.number().refine(val => [0, 5, 12, 18, 28].includes(val), { message: 'Invalid GST rate' }),
  unit: z.string().min(1, 'Unit is required'),
  hsnCode: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  openingStock: z.number().min(0).default(0),
});

export const invoiceItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().gt(0, 'Quantity must be > 0'),
  rate: z.number().min(0, 'Rate must be >= 0'),
  discountPercent: z.number().min(0).max(100).default(0),
});

export const salesInvoiceSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().optional(), // For cash customer
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  isInterState: z.boolean().default(false),
  paymentMode: z.string().optional(),
  amountPaid: z.number().min(0).default(0),
  notes: z.string().optional()
});

export const purchaseSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  isInterState: z.boolean().default(false),
  paymentMode: z.string().optional(),
  amountPaid: z.number().min(0).default(0),
  notes: z.string().optional(),
  referenceBillNo: z.string().optional()
});

export const paymentSchema = z.object({
  amount: z.number().gt(0, 'Amount must be > 0'),
  paymentMode: z.string().min(1, 'Payment mode is required'),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
});

export const companySettingsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  gstin: z.string().regex(gstinRegex, 'Invalid GSTIN').optional().or(z.literal('')),
  mobile: z.string().regex(mobileRegex, 'Invalid mobile').optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  state: z.string().optional(),
  stateCode: z.string().optional(),
  bankDetails: z.string().optional(),
  enableNegativeStock: z.boolean().default(false),
});

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().refine(val => val !== 0, { message: 'Quantity cannot be 0' }),
  notes: z.string().optional()
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});
