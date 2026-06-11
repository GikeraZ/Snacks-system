import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create default admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { phone: '0700000000' },
    update: {},
    create: {
      name: 'Admin',
      phone: '0700000000',
      email: 'admin@princesnackcenter.com',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      referralCode: 'ADMIN001',
    },
  })

  // Create categories
  const categoryNames = [
    'Burgers', 'Chips', 'Smokies', 'Sausages', 'Samosas',
    'Chapati', 'Mandazi', 'Tea', 'Coffee', 'Juice',
    'Soda', 'Water', 'Milkshakes', 'Special Meals'
  ]

  for (const name of categoryNames) {
    await prisma.category.upsert({
      where: { slug: name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
      },
    })
  }

  // Create default products
  const products = [
    { name: 'Beef Burger', categorySlug: 'burgers', sellingPrice: 150, costPrice: 100, stockQuantity: 50 },
    { name: 'Chicken Burger', categorySlug: 'burgers', sellingPrice: 180, costPrice: 120, stockQuantity: 30 },
    { name: 'Chips', categorySlug: 'chips', sellingPrice: 80, costPrice: 40, stockQuantity: 100 },
    { name: 'Smokie', categorySlug: 'smokies', sellingPrice: 60, costPrice: 35, stockQuantity: 80 },
    { name: 'Sausage', categorySlug: 'sausages', sellingPrice: 70, costPrice: 45, stockQuantity: 100 },
    { name: 'Samosa', categorySlug: 'samosas', sellingPrice: 30, costPrice: 15, stockQuantity: 150 },
    { name: 'Chapati', categorySlug: 'chapati', sellingPrice: 25, costPrice: 10, stockQuantity: 200 },
    { name: 'Mandazi', categorySlug: 'mandazi', sellingPrice: 20, costPrice: 8, stockQuantity: 200 },
    { name: 'Tea', categorySlug: 'tea', sellingPrice: 30, costPrice: 12, stockQuantity: 500 },
    { name: 'Coffee', categorySlug: 'coffee', sellingPrice: 50, costPrice: 20, stockQuantity: 300 },
    { name: 'Orange Juice', categorySlug: 'juice', sellingPrice: 100, costPrice: 60, stockQuantity: 100 },
    { name: 'Soda', categorySlug: 'soda', sellingPrice: 50, costPrice: 30, stockQuantity: 200 },
    { name: 'Water', categorySlug: 'water', sellingPrice: 40, costPrice: 25, stockQuantity: 300 },
    { name: 'Vanilla Milkshake', categorySlug: 'milkshakes', sellingPrice: 120, costPrice: 80, stockQuantity: 50 },
  ]

  for (const product of products) {
    const category = await prisma.category.findUnique({ where: { slug: product.categorySlug } })
    if (category) {
      await prisma.product.upsert({
        where: { slug: product.name.toLowerCase().replace(/\s+/g, '-') },
        update: {},
        create: {
          name: product.name,
          slug: product.name.toLowerCase().replace(/\s+/g, '-'),
          categoryId: category.id,
          sellingPrice: product.sellingPrice,
          costPrice: product.costPrice,
          stockQuantity: product.stockQuantity,
        },
      })
    }
  }

  // Create loyalty rules
  const rules = [
    { pointsPerKES: 1, rewardType: 'FREE_SODA', requiredPoints: 50 },
    { pointsPerKES: 1, rewardType: 'FREE_CHIPS', requiredPoints: 100 },
    { pointsPerKES: 1, rewardType: 'FREE_BURGER', requiredPoints: 200 },
  ]

  for (const rule of rules) {
    await prisma.loyaltyRule.create({ data: rule })
  }

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })