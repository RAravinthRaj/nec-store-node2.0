/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/

import { Request } from 'express';
import { Notification, Order, OrderItem, Product, sequelize } from '@/src/models';
import logger from '@/src/utils/logger';
import { DeliveryStatus, OrderStatus, PaidStatus, Role } from '@/src/config/enum.config';
import { IdService } from '@/src/services/orderId.service';
import { config } from '@/src/config/config';
import {
  findUsersByRole,
  orderProductsInclude,
  productCategoryInclude,
  serializeOrder,
} from '@/src/utils/db.helpers';
import { Op, Transaction } from 'sequelize';

interface Context {
  req: Request;
}

export interface OrderProductInput {
  productId: string;
  quantity: number;
}

interface CreateOrderArgs {
  products: OrderProductInput[];
}

interface PaymentMeta {
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
}

interface AppUser {
  id: string;
  rollNumber: string;
  role?: string;
  name?: string;
}

type PreparedOrderItem = {
  productId: string;
  categoryId: string;
  title: string;
  categoryName: string;
  quantity: number;
  price: number;
  productImage: string | null;
};

const sendRetailerNotifications = async (createdOrder: Order, user: AppUser) => {
  const retailers = await findUsersByRole(Role.Retailer);

  if (retailers.length === 0) {
    logger.warn('No retailers found to send notifications');
    return;
  }

  for (const retailer of retailers) {
    try {
      await Notification.create({
        userId: retailer.id,
        title: 'New Order',
        message: `New order received from ${user.name || user.rollNumber} containing ${createdOrder.products?.length ?? 0} item${(createdOrder.products?.length ?? 0) > 1 ? 's' : ''}.`,
        role: Role.Retailer,
        type: 'NEW_ORDER',
      });
      logger.info(`Notification sent to retailer ${retailer.id}`);
    } catch (err: any) {
      logger.error(
        `Failed to create notification for retailer ${retailer.id}: ${err.message || err}`,
      );
    }
  }

  const orderedProductIds = (createdOrder.products ?? [])
    .map((item) => item.productId)
    .filter((productId): productId is string => Boolean(productId));

  const orderedProducts = orderedProductIds.length
    ? await Product.findAll({
        where: { id: { [Op.in]: orderedProductIds } },
      })
    : [];

  for (const product of orderedProducts) {
    if (product.quantity <= config.threshold) {
      for (const retailer of retailers) {
        try {
          await Notification.create({
            userId: retailer.id,
            title: 'Stock Alert',
            message: `Stock alert: The product "${product.title}" has fallen below the threshold. Remaining quantity: ${product.quantity}.`,
            role: Role.Retailer,
            type: 'STOCK_INSUFFICIENT',
          });
          logger.info(`Notification sent to retailer ${retailer.id}`);
        } catch (err: any) {
          logger.error(
            `Failed to create notification for retailer ${retailer.id}: ${err.message || err}`,
          );
        }
      }
    }
  }
};

const prepareOrderItems = async (
  products: OrderProductInput[],
  transaction: Transaction,
): Promise<{
  totalAmount: number;
  orderItems: PreparedOrderItem[];
  lockedProducts: Product[];
}> => {
  const orderItems: PreparedOrderItem[] = [];
  const lockedProducts: Product[] = [];
  let totalAmount = 0;

  for (const item of products) {
    if (!item?.productId) throw new Error('Product ID is required');
    if (item?.quantity <= 0) throw new Error('Quantity must be greater than 0');

    const product = await Product.findByPk(item.productId, {
      include: [productCategoryInclude],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!product || !product.category) {
      throw new Error(`Product with ID ${item.productId} not found`);
    }

    if (product.quantity < item.quantity) {
      throw new Error(`Insufficient stock for ${product.title}`);
    }

    totalAmount += Number(product.sellingPrice) * item.quantity;
    orderItems.push({
      productId: product.id,
      categoryId: product.category.id,
      title: product.title,
      categoryName: product.category.name,
      quantity: item.quantity,
      price: Number(product.sellingPrice),
      productImage: product.productImage || null,
    });

    product.quantity -= item.quantity;
    lockedProducts.push(product);
  }

  return { totalAmount, orderItems, lockedProducts };
};

export const finalizeOrderCreation = async ({
  user,
  products,
  paidStatus,
  paymentMeta,
  transaction: externalTransaction,
}: {
  user: AppUser;
  products: OrderProductInput[];
  paidStatus: PaidStatus;
  paymentMeta?: PaymentMeta;
  transaction?: Transaction;
}) => {
  const createOrderInTransaction = async (transaction: Transaction) => {
    const { totalAmount, orderItems, lockedProducts } = await prepareOrderItems(products, transaction);

    const orderId = await IdService.getInstance().getNextOrderId();
    const createdOrder = await Order.create(
      {
        orderId,
        orderBy: user.id,
        rollNumber: user.rollNumber,
        totalAmount,
        razorpayOrderId: paymentMeta?.razorpayOrderId ?? null,
        razorpayPaymentId: paymentMeta?.razorpayPaymentId ?? null,
        razorpaySignature: paymentMeta?.razorpaySignature ?? null,
        deliveryStatus: DeliveryStatus.NOT_DELIVERED,
        paidStatus,
        orderStatus: OrderStatus.CREATED,
      },
      { transaction },
    );

    await OrderItem.bulkCreate(
      orderItems.map((item) => ({
        orderId: createdOrder.id,
        ...item,
      })),
      { transaction },
    );

    for (const product of lockedProducts) {
      await product.save({ transaction });
    }

    return createdOrder;
  };

  const newOrder = externalTransaction
    ? await createOrderInTransaction(externalTransaction)
    : await sequelize.transaction(async (transaction) => createOrderInTransaction(transaction));

  const createdOrder = await Order.findByPk(newOrder.id, {
    include: [orderProductsInclude],
    transaction: externalTransaction,
  });

  if (!createdOrder) {
    throw new Error('Failed to create order');
  }

  if (externalTransaction) {
    externalTransaction.afterCommit(async () => {
      await sendRetailerNotifications(createdOrder, user);
    });
  } else {
    await sendRetailerNotifications(createdOrder, user);
  }

  return createdOrder;
};

export const createOrder = async (_: any, args: CreateOrderArgs, context: Context) => {
  try {
    const user = (context.req as any)?.user as AppUser | undefined;
    if (!user?.role) {
      throw new Error('Unauthorized: No token provided.');
    }

    const { products } = args;

    if (!products || !Array.isArray(products) || products.length === 0) {
      throw new Error('Products cannot be empty.');
    }

    const createdOrder = await finalizeOrderCreation({
      user,
      products,
      paidStatus: PaidStatus.UNPAID,
    });

    return {
      message: 'Order created successfully',
      order: serializeOrder(createdOrder),
    };
  } catch (err: any) {
    logger.error(`Error in createOrder: ${err.message || err}`);
    throw new Error(err.message || 'Failed to create order');
  }
};
