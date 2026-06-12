import { prisma } from './prisma'

const notificationConfig: Record<string, { title: string; message: string; type: string }> = {
  CONFIRMED: { title: 'Order Accepted', message: 'Your order has been accepted and is being processed.', type: 'success' },
  PREPARING: { title: 'Order Being Prepared', message: 'Your order is now being prepared in the kitchen.', type: 'info' },
  READY: { title: 'Order Ready', message: 'Your order is ready for pickup or delivery.', type: 'success' },
  OUT_FOR_DELIVERY: { title: 'Order Out for Delivery', message: 'Your order is on its way to you!', type: 'order' },
  DELIVERED: { title: 'Order Delivered', message: 'Your order has been delivered. Enjoy!', type: 'success' },
  CANCELLED: { title: 'Order Cancelled', message: 'Your order has been cancelled.', type: 'warning' },
}

export async function createOrderNotification(orderId: string, status: string) {
  const config = notificationConfig[status]
  if (!config) return

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { customerId: true, orderNumber: true },
  })
  if (!order) return

  await prisma.notification.create({
    data: {
      userId: order.customerId,
      type: config.type,
      title: config.title,
      message: `${config.message} (${order.orderNumber})`,
      link: `/customer/orders`,
    },
  })
}
