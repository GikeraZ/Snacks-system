# Prince Snack Center Management System

A modern, enterprise-grade Smart Snack Center Management System for university environments.

## Features

- **Customer Ordering**: Mobile-first ordering system with QR code support
- **Free Delivery**: Campus-wide delivery to hostels, classrooms, and offices
- **Order Tracking**: Real-time order status updates
- **Loyalty Program**: Points-based rewards system
- **Multiple Payment Methods**: M-Pesa, Cash, Card, Pay on Delivery
- **Inventory Management**: Track ingredients and finished products
- **Employee Management**: Role-based access control
- **Sales Analytics**: Daily, weekly, monthly reports
- **Profit Monitoring**: Automated profit/loss calculations
- **PWA Support**: Installable mobile app experience

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: SQLite (via Prisma ORM)
- **Authentication**: NextAuth.js

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npx tsx prisma/seed.ts
```

## Default Credentials

- Phone: `0700000000`
- Password: `admin123`

## User Roles

1. **SUPER_ADMIN** - Full system access
2. **BUSINESS_PARTNER** - Sales, inventory, reports view
3. **CASHIER** - Process sales and orders
4. **KITCHEN_STAFF** - View and update order status
5. **DELIVERY** - Manage deliveries
6. **CUSTOMER** - Place orders and track deliveries

## Project Structure

```
/pages
  /api
    /auth - Authentication endpoints
    /orders - Order management
    /products - Product management
    /inventory - Inventory tracking
    /deliveries - Delivery management
    /reports - Analytics and reports
  /admin - Admin dashboard
  /kitchen - Kitchen interface
  /delivery - Delivery personnel interface
  /customer - Customer ordering
```

## License

MIT"# Snacks-system" 
