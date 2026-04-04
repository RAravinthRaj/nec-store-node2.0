/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Order } from '@/src/models';
import { DeliveryStatus, OrderStatus, PaidStatus, Role } from '@/src/config/enum.config';
import { orderProductsInclude, serializeOrder } from '@/src/utils/db.helpers';
import logger from '@/src/utils/logger';

export const cancelOrder = async (_: any, args: { orderId: string }, context: any) => {
  try {
    const currentRole = (context.req as any).user?.role;
    if (!currentRole) {
      throw new Error('Unauthorized: No token provided.');
    }

    if (currentRole !== Role.Retailer) {
      throw new Error("You don't have permission to access this resource.");
    }

    const order = await Order.findByPk(args?.orderId, {
      include: [orderProductsInclude],
    });

    if (!order) {
      throw new Error('Order not found.');
    }

    if (order.deliveryStatus === DeliveryStatus.DELIVERED) {
      throw new Error('Order has already been delivered.');
    }

    if (order.paidStatus === PaidStatus.PAID) {
      throw new Error('Amount has been paid for the Order.');
    }

    order.orderStatus = OrderStatus.CANCELLED;
    await order.save();

    return {
      message: 'Order cancelled successfully.',
      order: serializeOrder(order),
    };
  } catch (err: any) {
    logger.error(`Error in cancelOrder: ${err.message || err}`);
    throw err;
  }
};
