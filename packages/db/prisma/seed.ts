import { PrismaClient, UserRole, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

function generateSKU(category: string, index: number): string {
  const prefix = category.substring(0, 3).toUpperCase();
  return `${prefix}-${String(index).padStart(5, '0')}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean up existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.dailySalesStats.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventoryLog.deleteMany();
  await prisma.stockLock.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.storeConfig.deleteMany();

  // Create store configuration
  console.log('🏪 Creating store configuration...');
  await prisma.storeConfig.create({
    data: {
      name: 'QuickMart',
      description: 'Your neighborhood quick-commerce store',
      phone: '+91-9876543210',
      email: 'support@quickmart.local',
      address: '123 Market Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India',
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata',
      deliveryRadius: 5.0,
      minOrderAmount: new Prisma.Decimal(99),
      deliveryFee: new Prisma.Decimal(25),
      freeDeliveryAbove: new Prisma.Decimal(499),
      operatingHours: {
        monday: { open: '08:00', close: '22:00' },
        tuesday: { open: '08:00', close: '22:00' },
        wednesday: { open: '08:00', close: '22:00' },
        thursday: { open: '08:00', close: '22:00' },
        friday: { open: '08:00', close: '22:00' },
        saturday: { open: '08:00', close: '23:00' },
        sunday: { open: '09:00', close: '21:00' },
      },
      isOpen: true,
      taxRate: new Prisma.Decimal(5),
      taxInclusive: true,
    },
  });

  // Create admin users
  console.log('👤 Creating admin users...');
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@quickmart.local',
      phone: '+919876543210',
      passwordHash: await hashPassword('Admin@123'),
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  const storeManager = await prisma.user.create({
    data: {
      email: 'manager@quickmart.local',
      phone: '+919876543211',
      passwordHash: await hashPassword('Manager@123'),
      firstName: 'Store',
      lastName: 'Manager',
      role: UserRole.ADMIN,
      isActive: true,
      isEmailVerified: true,
      isPhoneVerified: true,
    },
  });

  // Create test customers
  console.log('👥 Creating test customers...');
  const customers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john@example.com',
        phone: '+919876543212',
        passwordHash: await hashPassword('Customer@123'),
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.CUSTOMER,
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane@example.com',
        phone: '+919876543213',
        passwordHash: await hashPassword('Customer@123'),
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.CUSTOMER,
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'mike@example.com',
        phone: '+919876543214',
        passwordHash: await hashPassword('Customer@123'),
        firstName: 'Mike',
        lastName: 'Johnson',
        role: UserRole.CUSTOMER,
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    }),
  ]);

  // Create addresses for customers
  console.log('📍 Creating customer addresses...');
  await Promise.all(
    customers.map((customer, index) =>
      prisma.address.create({
        data: {
          userId: customer.id,
          label: 'Home',
          fullName: `${customer.firstName} ${customer.lastName}`,
          phone: customer.phone!,
          addressLine1: `${100 + index} Main Street`,
          addressLine2: `Apt ${index + 1}`,
          landmark: 'Near Central Park',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'India',
          latitude: 19.076 + index * 0.01,
          longitude: 72.8777 + index * 0.01,
          isDefault: true,
        },
      })
    )
  );

  // Create categories
  console.log('📦 Creating categories...');
  const categoriesData = [
    { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', description: 'Fresh fruits and vegetables' },
    { name: 'Dairy & Eggs', slug: 'dairy-eggs', description: 'Milk, cheese, eggs and more' },
    { name: 'Bakery', slug: 'bakery', description: 'Fresh bread, cakes and pastries' },
    { name: 'Beverages', slug: 'beverages', description: 'Soft drinks, juices and water' },
    { name: 'Snacks', slug: 'snacks', description: 'Chips, biscuits and namkeen' },
    { name: 'Grocery & Staples', slug: 'grocery-staples', description: 'Rice, dal, flour and oil' },
    { name: 'Personal Care', slug: 'personal-care', description: 'Skincare, haircare and hygiene' },
    { name: 'Household', slug: 'household', description: 'Cleaning supplies and essentials' },
  ];

  const categories = await Promise.all(
    categoriesData.map((cat, index) =>
      prisma.category.create({
        data: {
          ...cat,
          sortOrder: index,
          isActive: true,
          image: `https://images.unsplash.com/photo-${1550000000000 + index * 1000}?w=400`,
        },
      })
    )
  );

  // Create products
  console.log('🛍️ Creating products...');
  const productsData = [
    // Fruits & Vegetables
    { name: 'Fresh Bananas', price: 49, discountedPrice: 45, category: 0, stock: 100, unit: 'dozen' },
    { name: 'Red Apples', price: 180, discountedPrice: 160, category: 0, stock: 80, unit: 'kg' },
    { name: 'Fresh Tomatoes', price: 40, discountedPrice: null, category: 0, stock: 150, unit: 'kg' },
    { name: 'Onions', price: 35, discountedPrice: 30, category: 0, stock: 200, unit: 'kg' },
    { name: 'Potatoes', price: 30, discountedPrice: null, category: 0, stock: 250, unit: 'kg' },
    { name: 'Fresh Spinach', price: 25, discountedPrice: 22, category: 0, stock: 60, unit: 'bunch' },
    { name: 'Carrots', price: 45, discountedPrice: null, category: 0, stock: 90, unit: 'kg' },
    { name: 'Green Capsicum', price: 80, discountedPrice: 70, category: 0, stock: 40, unit: 'kg' },
    
    // Dairy & Eggs
    { name: 'Amul Milk 1L', price: 64, discountedPrice: null, category: 1, stock: 200, unit: 'litre' },
    { name: 'Farm Fresh Eggs (12)', price: 84, discountedPrice: 78, category: 1, stock: 100, unit: 'pack' },
    { name: 'Amul Butter 500g', price: 275, discountedPrice: 260, category: 1, stock: 50, unit: 'pack' },
    { name: 'Greek Yogurt', price: 120, discountedPrice: 110, category: 1, stock: 40, unit: 'pack' },
    { name: 'Cheese Slices', price: 150, discountedPrice: null, category: 1, stock: 60, unit: 'pack' },
    { name: 'Paneer 200g', price: 90, discountedPrice: 85, category: 1, stock: 45, unit: 'pack' },
    
    // Bakery
    { name: 'White Bread', price: 40, discountedPrice: 35, category: 2, stock: 80, unit: 'pack' },
    { name: 'Whole Wheat Bread', price: 50, discountedPrice: null, category: 2, stock: 60, unit: 'pack' },
    { name: 'Butter Croissant', price: 45, discountedPrice: 40, category: 2, stock: 30, unit: 'piece' },
    { name: 'Chocolate Cake Slice', price: 80, discountedPrice: null, category: 2, stock: 25, unit: 'piece' },
    { name: 'Pav Buns (8)', price: 30, discountedPrice: null, category: 2, stock: 100, unit: 'pack' },
    
    // Beverages
    { name: 'Coca-Cola 2L', price: 96, discountedPrice: 90, category: 3, stock: 120, unit: 'bottle' },
    { name: 'Fresh Orange Juice 1L', price: 120, discountedPrice: 110, category: 3, stock: 40, unit: 'bottle' },
    { name: 'Mineral Water 1L', price: 20, discountedPrice: null, category: 3, stock: 300, unit: 'bottle' },
    { name: 'Mango Juice 1L', price: 95, discountedPrice: 85, category: 3, stock: 80, unit: 'pack' },
    { name: 'Green Tea (25 bags)', price: 180, discountedPrice: 165, category: 3, stock: 50, unit: 'pack' },
    
    // Snacks
    { name: 'Lays Classic Chips', price: 30, discountedPrice: null, category: 4, stock: 150, unit: 'pack' },
    { name: 'Oreo Cookies', price: 35, discountedPrice: 30, category: 4, stock: 120, unit: 'pack' },
    { name: 'Haldiram Bhujia 400g', price: 140, discountedPrice: 125, category: 4, stock: 60, unit: 'pack' },
    { name: 'Dark Chocolate Bar', price: 100, discountedPrice: 90, category: 4, stock: 80, unit: 'piece' },
    { name: 'Mixed Nuts 200g', price: 250, discountedPrice: 230, category: 4, stock: 35, unit: 'pack' },
    
    // Grocery & Staples
    { name: 'Basmati Rice 5kg', price: 450, discountedPrice: 420, category: 5, stock: 100, unit: 'bag' },
    { name: 'Toor Dal 1kg', price: 160, discountedPrice: 150, category: 5, stock: 80, unit: 'pack' },
    { name: 'Sunflower Oil 1L', price: 180, discountedPrice: 165, category: 5, stock: 70, unit: 'bottle' },
    { name: 'Wheat Flour 5kg', price: 250, discountedPrice: 235, category: 5, stock: 90, unit: 'bag' },
    { name: 'Sugar 1kg', price: 48, discountedPrice: 45, category: 5, stock: 150, unit: 'pack' },
    { name: 'Salt 1kg', price: 25, discountedPrice: null, category: 5, stock: 200, unit: 'pack' },
    
    // Personal Care
    { name: 'Dove Soap (3 pack)', price: 180, discountedPrice: 165, category: 6, stock: 60, unit: 'pack' },
    { name: 'Head & Shoulders Shampoo', price: 350, discountedPrice: 320, category: 6, stock: 40, unit: 'bottle' },
    { name: 'Colgate Toothpaste', price: 120, discountedPrice: 110, category: 6, stock: 100, unit: 'tube' },
    { name: 'Nivea Body Lotion', price: 280, discountedPrice: 250, category: 6, stock: 30, unit: 'bottle' },
    
    // Household
    { name: 'Vim Dishwash Bar', price: 25, discountedPrice: null, category: 7, stock: 150, unit: 'piece' },
    { name: 'Surf Excel 1kg', price: 250, discountedPrice: 230, category: 7, stock: 80, unit: 'pack' },
    { name: 'Colin Glass Cleaner', price: 120, discountedPrice: 110, category: 7, stock: 45, unit: 'bottle' },
    { name: 'Harpic Toilet Cleaner', price: 85, discountedPrice: 78, category: 7, stock: 90, unit: 'bottle' },
    { name: 'Garbage Bags (30)', price: 60, discountedPrice: null, category: 7, stock: 70, unit: 'pack' },
  ];

  let productIndex = 1;
  for (const productData of productsData) {
    const category = categories[productData.category];
    const product = await prisma.product.create({
      data: {
        sku: generateSKU(category.name, productIndex),
        name: productData.name,
        slug: slugify(productData.name),
        description: `Fresh ${productData.name.toLowerCase()} delivered to your doorstep`,
        price: new Prisma.Decimal(productData.price),
        discountedPrice: productData.discountedPrice 
          ? new Prisma.Decimal(productData.discountedPrice) 
          : null,
        categoryId: category.id,
        unit: productData.unit,
        unitValue: new Prisma.Decimal(1),
        stockQuantity: productData.stock,
        lowStockThreshold: 10,
        isAvailable: true,
        isFeatured: productIndex <= 8,
        tags: [category.name.toLowerCase(), productData.unit],
      },
    });

    // Add product image
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: `https://images.unsplash.com/photo-${1550000000000 + productIndex * 100}?w=400`,
        altText: productData.name,
        sortOrder: 0,
        isPrimary: true,
      },
    });

    // Create initial inventory log
    await prisma.inventoryLog.create({
      data: {
        productId: product.id,
        action: 'STOCK_IN',
        quantity: productData.stock,
        previousStock: 0,
        newStock: productData.stock,
        notes: 'Initial stock',
        performedBy: superAdmin.id,
      },
    });

    productIndex++;
  }

  // Create carts for customers
  console.log('🛒 Creating customer carts...');
  await Promise.all(
    customers.map((customer) =>
      prisma.cart.create({
        data: {
          userId: customer.id,
        },
      })
    )
  );

  console.log('✅ Database seeded successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Super Admin: admin@quickmart.local / Admin@123');
  console.log('Store Manager: manager@quickmart.local / Manager@123');
  console.log('Customer: john@example.com / Customer@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
