/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Request } from 'express';
import { Op } from 'sequelize';
import { Role } from '../../config/enum.config';
import { Order, PaymentTransaction, User } from '../../models';
import logger from '../../utils/logger';

export interface GetTransactionsContext {
  req: Request;
}

interface GetTransactionsInput {
  from?: string;
  to?: string;
  status?: string;
  search?: string;
  skip?: number;
  limit?: number;
  orderBy?: string;
}

interface GetTransactionsArgs {
  input?: GetTransactionsInput;
}

export const getTransactions = async (
  _: any,
  { input }: GetTransactionsArgs,
  context: GetTransactionsContext,
) => {
  try {
    const currentRole = (context.req as any).user?.role;
    if (!currentRole) {
      throw new Error('Unauthorized: No token provided.');
    }

    if (currentRole !== Role.Retailer) {
      throw new Error("You don't have permission to perform this operation.");
    }

    const { from, to, status, search, skip = 0, limit, orderBy = 'DESC' } = input || {};
    const where: any = {};

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = toDate;
      }
    }

    if (status) {
      where.status = status.toLowerCase();
    }

    const normalizedSearch = search?.trim();
    if (normalizedSearch) {
      where[Op.or] = [
        { razorpayPaymentId: { [Op.like]: `%${normalizedSearch}%` } },
        { '$user.rollNumber$': { [Op.like]: `%${normalizedSearch}%` } },
        { '$order.orderId$': { [Op.like]: `%${normalizedSearch}%` } },
      ];
    }

    const transactions = await PaymentTransaction.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'rollNumber', 'name', 'email'],
          required: true,
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'orderId'],
          required: false,
        },
      ],
      order: [['createdAt', orderBy === 'ASC' ? 'ASC' : 'DESC']],
      subQuery: false,
    });

    const mappedItems = transactions.map((transaction) => ({
      id: transaction.id,
      razorpayPaymentId: transaction.razorpayPaymentId || '',
      rollNumber: transaction.user?.rollNumber || '',
      orderId: transaction.order?.orderId || '',
      amount: Number(transaction.amount),
      status: transaction.status,
      transactionDate: transaction.createdAt?.toISOString() || new Date().toISOString(),
      createdAt: transaction.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: transaction.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    const totalCount = mappedItems.length;
    const totalAmount = mappedItems.reduce((sum, item) => sum + item.amount, 0);

    const items = limit ? mappedItems.slice(skip, skip + limit) : mappedItems.slice(skip);

    return {
      items,
      totalCount,
      totalAmount,
    };
  } catch (error: any) {
    logger.error(`Error in getTransactions: ${error.message || error}`);
    throw error;
  }
};
