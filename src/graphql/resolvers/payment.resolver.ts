/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/

import { Request } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import logger from '@/src/utils/logger';
import { config } from '@/src/config/config';
import { Order, PaymentTransaction, Product, sequelize } from '@/src/models';
import { PaidStatus, PaymentTransactionStatus } from '@/src/config/enum.config';
import { finalizeOrderCreation, OrderProductInput } from '@/src/graphql/resolvers/createOrder.resolver';
import { orderProductsInclude, serializeOrder } from '@/src/utils/db.helpers';
import { Transaction, UniqueConstraintError } from 'sequelize';

interface Context {
  req: Request;
}

interface CreateRazorpayOrderArgs {
  products: OrderProductInput[];
}

interface VerifyRazorpayPaymentArgs {
  input: {
    products: OrderProductInput[];
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  };
}

interface RecordPaymentTransactionArgs {
  input: {
    amount: number;
    currency?: string;
    status: string;
    failureReason?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    metadata?: string;
  };
}

interface AppUser {
  id: string;
  rollNumber: string;
  role?: string;
  name?: string;
}

const getRazorpayClient = () => {
  if (!config.razorpayKeyId || !config.razorpayKeySecret) {
    throw new Error('Razorpay keys are not configured.');
  }

  return new Razorpay({
    key_id: config.razorpayKeyId,
    key_secret: config.razorpayKeySecret,
  });
};

const calculateOrderAmount = async (products: OrderProductInput[]) => {
  let totalAmount = 0;

  for (const item of products) {
    if (!item?.productId) {
      throw new Error('Product ID is required');
    }
    if (item?.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const product = await Product.findByPk(item.productId);
    if (!product) {
      throw new Error(`Product with ID ${item.productId} not found`);
    }

    if (product.quantity < item.quantity) {
      throw new Error(`Insufficient stock for ${product.title}`);
    }

    totalAmount += Number(product.sellingPrice) * item.quantity;
  }

  return totalAmount;
};

const createPaymentTransactionLog = async ({
  userId,
  orderId = null,
  amount,
  status,
  currency = 'INR',
  failureReason = null,
  razorpayOrderId = null,
  razorpayPaymentId = null,
  razorpaySignature = null,
  metadata = null,
  transaction,
}: {
  userId: string;
  orderId?: string | null;
  amount: number;
  status: PaymentTransactionStatus;
  currency?: string;
  failureReason?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  metadata?: string | null;
  transaction?: Transaction;
}) =>
  PaymentTransaction.create(
    {
    userId,
    orderId,
    gateway: 'razorpay',
    status,
    amount,
    currency,
    failureReason,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    metadata,
    },
    transaction ? { transaction } : undefined,
  );

export const createRazorpayOrder = async (
  _: any,
  args: CreateRazorpayOrderArgs,
  context: Context,
) => {
  try {
    const user = (context.req as any)?.user as AppUser | undefined;
    if (!user?.role) {
      throw new Error('Unauthorized: No token provided.');
    }

    const { products } = args;
    if (!products || !Array.isArray(products) || products.length === 0) {
      throw new Error('Products cannot be empty.');
    }

    const totalAmount = await calculateOrderAmount(products);
    const razorpay = getRazorpayClient();
    const paymentOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: `nec_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        userId: user.id,
        rollNumber: user.rollNumber,
      },
    });

    return {
      message: 'Razorpay order created successfully.',
      paymentOrder: {
        id: paymentOrder.id,
        amount: Number(paymentOrder.amount),
        currency: paymentOrder.currency,
        key: config.razorpayKeyId,
      },
    };
  } catch (err: any) {
    logger.error(`Error in createRazorpayOrder: ${err.message || err}`);
    throw new Error(err.message || 'Failed to create Razorpay order.');
  }
};

export const verifyRazorpayPayment = async (
  _: any,
  args: VerifyRazorpayPaymentArgs,
  context: Context,
) => {
  try {
    const user = (context.req as any)?.user as AppUser | undefined;
    if (!user?.role) {
      throw new Error('Unauthorized: No token provided.');
    }

    const { products, razorpayOrderId, razorpayPaymentId, razorpaySignature } = args.input;

    if (!products || !products.length) {
      throw new Error('Products cannot be empty.');
    }

    const expectedSignature = crypto
      .createHmac('sha256', config.razorpayKeySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      const totalAmount = await calculateOrderAmount(products);
      await createPaymentTransactionLog({
        userId: user.id,
        amount: totalAmount,
        status: PaymentTransactionStatus.FAILED,
        failureReason: 'Invalid payment signature.',
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });
      throw new Error('Invalid payment signature.');
    }

    const totalAmount = await calculateOrderAmount(products);

    try {
      const result = await sequelize.transaction(async (transaction) => {
        const existingTransaction = await PaymentTransaction.findOne({
          where: { razorpayPaymentId },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (existingTransaction?.status === PaymentTransactionStatus.SUCCESS && existingTransaction.orderId) {
          const existingOrder = await Order.findByPk(existingTransaction.orderId, {
            include: [orderProductsInclude],
            transaction,
            lock: transaction.LOCK.UPDATE,
          });

          if (!existingOrder) {
            throw new Error('Payment already succeeded but order could not be found.');
          }

          return {
            message: 'Payment already verified successfully.',
            order: serializeOrder(existingOrder),
          };
        }

        if (existingTransaction?.status === PaymentTransactionStatus.PROCESSING) {
          throw new Error('Payment is already being processed. Please try again shortly.');
        }

        const processingTransaction =
          existingTransaction ??
          (await createPaymentTransactionLog({
            userId: user.id,
            amount: totalAmount,
            status: PaymentTransactionStatus.PROCESSING,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            transaction,
          }));

        const createdOrder = await finalizeOrderCreation({
          user,
          products,
          paidStatus: PaidStatus.PAID,
          paymentMeta: {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
          },
          transaction,
        });

        processingTransaction.status = PaymentTransactionStatus.SUCCESS;
        processingTransaction.orderId = createdOrder.id;
        processingTransaction.amount = Number(createdOrder.totalAmount);
        processingTransaction.failureReason = null;
        processingTransaction.razorpayOrderId = razorpayOrderId;
        processingTransaction.razorpayPaymentId = razorpayPaymentId;
        processingTransaction.razorpaySignature = razorpaySignature;
        await processingTransaction.save({ transaction });

        return {
          message: 'Payment verified and order created successfully.',
          order: serializeOrder(createdOrder),
        };
      });

      return result;
    } catch (err: any) {
      if (err instanceof UniqueConstraintError) {
        const existingOrder = await Order.findOne({
          where: { razorpayPaymentId },
          include: [orderProductsInclude],
        });

        if (existingOrder) {
          return {
            message: 'Payment already verified successfully.',
            order: serializeOrder(existingOrder),
          };
        }
      }

      throw err;
    }
  } catch (err: any) {
    logger.error(`Error in verifyRazorpayPayment: ${err.message || err}`);
    throw new Error(err.message || 'Failed to verify payment.');
  }
};

export const recordPaymentTransaction = async (
  _: any,
  args: RecordPaymentTransactionArgs,
  context: Context,
) => {
  try {
    const user = (context.req as any)?.user as AppUser | undefined;
    if (!user?.role) {
      throw new Error('Unauthorized: No token provided.');
    }

    const {
      amount,
      currency = 'INR',
      status,
      failureReason,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      metadata,
    } = args.input;

    const normalizedStatus =
      status === PaymentTransactionStatus.SUCCESS
        ? PaymentTransactionStatus.SUCCESS
        : PaymentTransactionStatus.FAILED;

    const existingTransaction = razorpayPaymentId
      ? await PaymentTransaction.findOne({
          where: { razorpayPaymentId },
        })
      : null;

    if (existingTransaction) {
      if (existingTransaction.status !== PaymentTransactionStatus.SUCCESS) {
        existingTransaction.status = normalizedStatus;
        existingTransaction.amount = amount;
        existingTransaction.currency = currency;
        existingTransaction.failureReason = failureReason ?? null;
        existingTransaction.razorpayOrderId = razorpayOrderId ?? null;
        existingTransaction.razorpaySignature = razorpaySignature ?? null;
        existingTransaction.metadata = metadata ?? null;
        await existingTransaction.save();
      }
    } else {
      await createPaymentTransactionLog({
        userId: user.id,
        amount,
        currency,
        status: normalizedStatus,
        failureReason: failureReason ?? null,
        razorpayOrderId: razorpayOrderId ?? null,
        razorpayPaymentId: razorpayPaymentId ?? null,
        razorpaySignature: razorpaySignature ?? null,
        metadata: metadata ?? null,
      });
    }

    return {
      message: 'Payment transaction recorded successfully.',
    };
  } catch (err: any) {
    logger.error(`Error in recordPaymentTransaction: ${err.message || err}`);
    throw new Error(err.message || 'Failed to record payment transaction.');
  }
};
