export interface User {
  id: string
  name?: string | null
  email?: string | null
  phone?: string | null
  role: 'SUPER_ADMIN' | 'BUSINESS_PARTNER' | 'CASHIER' | 'KITCHEN_STAFF' | 'DELIVERY' | 'CUSTOMER'
  loyaltyPoints?: number
}

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  categoryId: string
  category: Category
  costPrice: number
  sellingPrice: number
  imageUrl?: string
  isActive: boolean
  isFeatured: boolean
  stockQuantity: number
  lowStockAlert: number
  preparationTime: number
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  isActive: boolean
}

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  customer: User
  deliveryPersonId?: string
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED'
  paymentMethod: 'MPESA' | 'CASH' | 'CARD' | 'PAY_ON_DELIVERY'
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  totalAmount: number
  discountAmount: number
  deliveryFee: number
  notes?: string
  estimatedTime?: Date
  deliveredAt?: Date
  createdAt: Date
  items: OrderItem[]
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  product: Product
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Delivery {
  id: string
  orderId: string
  deliveryPersonId?: string
  status: string
  locationType: 'HOSTEL' | 'ROOM' | 'CLASSROOM' | 'LIBRARY' | 'OFFICE'
  locationDetails: string
  customerName: string
  customerPhone: string
  assignedAt?: Date
  pickedAt?: Date
  deliveredAt?: Date
  notes?: string
}

export interface Expense {
  id: string
  userId: string
  category: string
  amount: number
  description?: string
  receiptUrl?: string
  date: Date
}

export interface Ingredient {
  id: string
  name: string
  unit: string
  costPerUnit: number
  stockQuantity: number
  lowStockAlert: number
  isActive: boolean
}

export interface DashboardStats {
  todaySales: number
  totalOrders: number
  activeDeliveries: number
  inventoryValue: number
  profitToday: number
  expensesToday: number
  topProducts: Product[]
  activeCustomers: User[]
}

export interface Notification {
  id: string
  title: string
  message: string
  type: 'order' | 'success' | 'warning' | 'info'
  time: string
  read: boolean
}