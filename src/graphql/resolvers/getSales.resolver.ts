/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Category, Order, OrderItem, Product } from '../../models';
import logger from '../../utils/logger';
import { Role } from '../../config/enum.config';
import { Op } from 'sequelize';

export interface GetSalesContext {
  req: Request;
}

interface GetSalesInput {
  from?: string;
  to?: string;
  categoryId?: string;
  title?: string;
  skip?: number;
  limit?: number;
  orderBy?: string;
}

interface GetSalesArgs {
  input: GetSalesInput;
}

export const getSales = async (_: any, { input }: GetSalesArgs, context: GetSalesContext) => {
  try {
    const currentRole = (context.req as any).user?.role;
    if (!currentRole) {
      throw new Error('Unauthorized: No token provided.');
    }

    if (currentRole !== Role.Retailer) {
      throw new Error("You don't have permission to perform this operation.");
    }

    const { from, to, categoryId, title, skip = 0, limit, orderBy } = input || {};
    const orderWhere: Record<string, any> = {
      orderStatus: 'completed',
    };

    if (from || to) {
      orderWhere.createdAt = {};
      if (from) orderWhere.createdAt[Op.gte] = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        orderWhere.createdAt[Op.lte] = toDate;
      }
    }

    const orders = await Order.findAll({
      where: orderWhere,
      include: [
        {
          model: OrderItem,
          as: 'products',
          include: [
            { model: Category, as: 'category', required: false },
            { model: Product, as: 'product', required: false },
          ],
        },
      ],
    });

    const salesMap = new Map<string, any>();
    for (const order of orders) {
      for (const item of order.products ?? []) {
        const normalizedTitle = item.title.toLowerCase();
        if (categoryId && item.categoryId !== categoryId) continue;
        if (title && !normalizedTitle.includes(title.toLowerCase())) continue;

        const key = item.productId ?? `${item.title}-${item.categoryId ?? item.categoryName}`;
        const current = salesMap.get(key) ?? {
          title: item.title,
          category: item.category
            ? {
                id: item.category.id,
                name: item.category.name,
                createdAt: item.category.createdAt?.toISOString(),
                updatedAt: item.category.updatedAt?.toISOString(),
              }
            : {
                id: item.categoryId ?? '',
                name: item.categoryName,
                createdAt: item.createdAt?.toISOString(),
                updatedAt: item.updatedAt?.toISOString(),
              },
          left: item.product ? Number(item.product.quantity) : 0,
          sold: 0,
          totalPrice: 0,
          productImage: item.productImage,
          createdAt: item.createdAt?.toISOString(),
          updatedAt: item.updatedAt?.toISOString(),
        };

        current.sold += Number(item.quantity);
        current.totalPrice += Number(item.price) * Number(item.quantity);
        current.left = item.product ? Number(item.product.quantity) : current.left;
        salesMap.set(key, current);
      }
    }

    let items = Array.from(salesMap.values());
    items.sort((a, b) =>
      orderBy === 'DESC' ? b.title.localeCompare(a.title) : a.title.localeCompare(b.title),
    );

    const totalCount = items.length;
    const totalSold = items.reduce((sum, item) => sum + item.sold, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    if (limit) {
      items = items.slice(skip, skip + limit);
    } else {
      items = items.slice(skip);
    }

    return {
      items,
      totalSold,
      totalAmount,
      totalCount,
    };
  } catch (error: any) {
    logger.error(`Error in getSales: ${error.message || error}`);
    throw error;
  }
};
