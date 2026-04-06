/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { AddStock, Product, Category } from '../../models';
import logger from '../../utils/logger';
import { Role } from '../../config/enum.config';
import { Op } from 'sequelize';
import { GetSalesContext } from './getSales.resolver';

interface GetIncomingStockInput {
  from?: string;
  to?: string;
  categoryId?: string;
  title?: string;
  skip?: number;
  limit?: number;
  orderBy?: string;
}

interface GetIncomingStockArgs {
  input: GetIncomingStockInput;
}

export const getIncomingStock = async (
  _: any,
  { input }: GetIncomingStockArgs,
  context: GetSalesContext,
) => {
  try {
    const currentRole = (context.req as any).user?.role;
    if (!currentRole) {
      throw new Error('Unauthorized: No token provided.');
    }

    if (currentRole !== Role.Retailer) {
      throw new Error("You don't have permission to perform this operation.");
    }

    const { from, to, categoryId, title, skip = 0, limit, orderBy } = input || {};

    const where: Record<string, any> = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = toDate;
      }
    }

    const productWhere: Record<string, any> = {};
    if (categoryId) {
      productWhere.categoryId = categoryId;
    }
    if (title?.trim()) {
      productWhere.title = {
        [Op.like]: `%${title.trim()}%`,
      };
    }

    const entries = await AddStock.findAll({
      where,
      include: [
        {
          model: Product,
          as: 'product',
          required: true,
          where: productWhere,
          include: [
            {
              model: Category,
              as: 'category',
              required: false,
            },
          ],
        },
      ],
      order: [['createdAt', orderBy === 'DESC' ? 'DESC' : 'ASC']],
    });

    const totalCount = entries.length;
    const totalQuantityAdded = entries.reduce((sum, entry) => sum + Number(entry.quantityAdded || 0), 0);
    const totalAmount = entries.reduce(
      (sum, entry) => sum + Number(entry.quantityAdded || 0) * Number(entry.buyingPriceAdded || 0),
      0,
    );

    const slicedEntries = limit ? entries.slice(skip, skip + limit) : entries.slice(skip);

    return {
      items: slicedEntries.map((entry) => ({
        id: entry.id,
        productId: entry.productId,
        userId: entry.userId,
        quantityAdded: Number(entry.quantityAdded),
        buyingPriceAdded: String(entry.buyingPriceAdded),
        previousQuantity: Number(entry.previousQuantity),
        previousBuyingPrice: String(entry.previousBuyingPrice),
        previousSellingPrice: String(entry.previousSellingPrice),
        currentQuantity: Number(entry.currentQuantity),
        currentBuyingPrice: String(entry.currentBuyingPrice),
        currentSellingPrice: String(entry.currentSellingPrice),
        product: entry.product,
        createdAt: entry.createdAt?.toISOString(),
        updatedAt: entry.updatedAt?.toISOString(),
      })),
      totalQuantityAdded,
      totalAmount,
      totalCount,
    };
  } catch (error: any) {
    logger.error(`Error in getIncomingStock: ${error.message || error}`);
    throw error;
  }
};
