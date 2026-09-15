import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Company Settings
  await prisma.companySettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      companyName: 'SRI VAISHNAVI TRADERS',
      shopAddress: '',
      city: '',
      mobileNumber: '',
      alternateMobile: '',
      email: '',
      gstin: '',
      state: 'Telangana',
      stateCode: '36',
      pincode: '',
      logoUrl: '',
      bankName: '',
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankBranch: '',
      invoicePrefix: 'SVE',
      startingInvoiceNo: 1,
      currentInvoiceNo: 0,
      financialYearStart: '2026-04-01',
      defaultGstRate: 18.0,
      termsAndConditions: 'Goods once sold will not be taken back or exchanged. All disputes subject to local jurisdiction.',
      authorizedSignatory: '',
      enableNegativeStock: false,
      enableCustomGstRates: false,
    },
  });
  console.log('✓ Company settings created');

  // 2. Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      name: 'Admin',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✓ Admin user created (admin / admin123)');

  // 3. Staff User
  const staffPassword = await bcrypt.hash('staff123', 10);
  await prisma.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      username: 'staff',
      passwordHash: staffPassword,
      name: 'Staff User',
      role: 'STAFF',
      isActive: true,
    },
  });
  console.log('✓ Staff user created (staff / staff123)');

  // 4. Default Categories
  const categoryNames = [
    'PVC Pipes', 'CPVC Pipes', 'SWR Pipes', 'Elbows', 'Bends',
    'Tees', 'Couplers', 'Valves', 'Taps', 'Basin Fittings',
    'Bathroom Fittings', 'Water Tanks', 'Plumbing Accessories', 'Sanitaryware', 'Other'
  ];

  const categories: Record<string, string> = {};
  for (const name of categoryNames) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: name,
        isDefault: true,
      },
    });
    categories[name] = category.id;
  }
  console.log(`✓ ${categoryNames.length} categories created`);

  // 5. Suppliers
  // Note: Supplier.mobile is not unique in schema, so we use findFirst + create pattern
  let supplier1 = await prisma.supplier.findFirst({ where: { mobile: '9876543210' } });
  if (!supplier1) {
    supplier1 = await prisma.supplier.create({
      data: {
        name: 'Astral Pipes Ltd',
        contactPerson: 'Sales Dept',
        mobile: '9876543210',
        email: '',
        address: 'Hyderabad, Telangana',
        gstin: '',
        state: 'Telangana',
        stateCode: '36',
        openingBalance: 0,
        currentBalance: 0,
        notes: 'PVC and CPVC pipes supplier',
      },
    });
  }

  let supplier2 = await prisma.supplier.findFirst({ where: { mobile: '9876543211' } });
  if (!supplier2) {
    supplier2 = await prisma.supplier.create({
      data: {
        name: 'Supreme Industries',
        contactPerson: 'Distributor',
        mobile: '9876543211',
        email: '',
        address: 'Hyderabad, Telangana',
        gstin: '',
        state: 'Telangana',
        stateCode: '36',
        openingBalance: 0,
        currentBalance: 0,
        notes: 'SWR pipes and fittings supplier',
      },
    });
  }
  console.log('✓ 2 suppliers created');

  // 6. Customers
  const customer1 = await prisma.customer.upsert({
    where: { mobile: '9123456789' },
    update: {},
    create: {
      name: 'Ramesh Kumar',
      mobile: '9123456789',
      alternateMobile: '',
      email: '',
      billingAddress: 'Hyderabad, Telangana',
      shippingAddress: '',
      gstin: '',
      state: 'Telangana',
      stateCode: '36',
      pincode: '',
      customerType: 'RETAIL',
      openingBalance: 0,
      currentBalance: 0,
      creditLimit: 0,
      notes: '',
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { mobile: '9123456790' },
    update: {},
    create: {
      name: 'Krishna Builders',
      mobile: '9123456790',
      alternateMobile: '',
      email: '',
      billingAddress: 'Secunderabad, Telangana',
      shippingAddress: '',
      gstin: '',
      state: 'Telangana',
      stateCode: '36',
      pincode: '',
      customerType: 'BUSINESS',
      openingBalance: 0,
      currentBalance: 0,
      creditLimit: 50000,
      notes: 'Regular builder customer',
    },
  });
  console.log('✓ 2 customers created');

  // 7. Products
  const products = [
    { name: 'PVC Elbow 1"', sku: 'SVE-001', cat: 'Elbows', hsn: '3917', unit: 'NOS', pp: 15, sp: 22, mrp: 25, gst: 18, stock: 200, min: 50, brand: 'Astral' },
    { name: 'CPVC Pipe 1/2" x 3m', sku: 'SVE-002', cat: 'CPVC Pipes', hsn: '3917', unit: 'PCS', pp: 180, sp: 250, mrp: 280, gst: 18, stock: 100, min: 20, brand: 'Astral' },
    { name: 'SWR Pipe 4" x 3m', sku: 'SVE-003', cat: 'SWR Pipes', hsn: '3917', unit: 'PCS', pp: 350, sp: 480, mrp: 520, gst: 18, stock: 50, min: 10, brand: 'Supreme' },
    { name: 'Brass Ball Valve 1"', sku: 'SVE-004', cat: 'Valves', hsn: '8481', unit: 'NOS', pp: 280, sp: 400, mrp: 450, gst: 18, stock: 75, min: 15, brand: 'Zoloto' },
    { name: 'Pillar Cock', sku: 'SVE-005', cat: 'Taps', hsn: '8481', unit: 'NOS', pp: 350, sp: 520, mrp: 580, gst: 18, stock: 40, min: 10, brand: 'Jaquar' },
    { name: 'PVC Tee 1"', sku: 'SVE-006', cat: 'Tees', hsn: '3917', unit: 'NOS', pp: 18, sp: 28, mrp: 32, gst: 18, stock: 150, min: 30, brand: 'Astral' },
    { name: 'CPVC Coupler 1/2"', sku: 'SVE-007', cat: 'Couplers', hsn: '3917', unit: 'NOS', pp: 12, sp: 18, mrp: 22, gst: 18, stock: 300, min: 50, brand: 'Ashirvad' },
    { name: 'SWR Bend 4"', sku: 'SVE-008', cat: 'Bends', hsn: '3917', unit: 'NOS', pp: 85, sp: 130, mrp: 150, gst: 18, stock: 60, min: 15, brand: 'Supreme' },
    { name: 'Wash Basin', sku: 'SVE-009', cat: 'Sanitaryware', hsn: '6910', unit: 'NOS', pp: 800, sp: 1200, mrp: 1500, gst: 18, stock: 15, min: 5, brand: 'Parryware' },
    { name: 'PVC Solvent Cement 100ml', sku: 'SVE-010', cat: 'Plumbing Accessories', hsn: '3506', unit: 'NOS', pp: 45, sp: 70, mrp: 80, gst: 18, stock: 100, min: 25, brand: 'Astral' },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        name: p.name,
        sku: p.sku,
        categoryId: categories[p.cat],
        brand: p.brand,
        hsnCode: p.hsn,
        unit: p.unit,
        purchasePrice: p.pp,
        sellingPrice: p.sp,
        mrp: p.mrp,
        gstRate: p.gst,
        openingStock: p.stock,
        currentStock: p.stock,
        minStockLevel: p.min,
        description: '',
        isActive: true,
      },
    });

    // 8. Opening stock movement
    const existingMovement = await prisma.stockMovement.findFirst({
      where: {
        productId: product.id,
        transactionType: 'OPENING_STOCK',
      },
    });

    if (!existingMovement) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          transactionType: 'OPENING_STOCK',
          referenceType: 'MANUAL',
          referenceId: '',
          referenceNumber: 'INITIAL_SEED',
          quantityIn: p.stock,
          quantityOut: 0,
          balanceAfter: p.stock,
          notes: 'Opening stock from seed data',
        },
      });
    }
  }
  console.log(`✓ ${products.length} products created with opening stock`);

  console.log('\n✅ Seed completed successfully!');
  console.log('Login credentials:');
  console.log('  Admin: admin / admin123');
  console.log('  Staff: staff / staff123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
