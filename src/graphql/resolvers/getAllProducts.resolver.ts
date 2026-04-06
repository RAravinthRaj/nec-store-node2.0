/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/

import { Product } from '../../models';
import { Op } from 'sequelize';
import {
  likeContains,
  productCategoryInclude,
  serializeProduct,
} from '../../utils/db.helpers';
import logger from '../../utils/logger';

interface Context {
  req: any;
}

interface GetAllProductsArgs {
  skip?: number;
  limit?: number;
  orderBy?: 'ASC' | 'DESC';
  categoryId?: string;
  title?: string;
  productIds?: string[];
  isRecentProduct?: boolean;
}

export const getAllProducts = async (_: any, args: GetAllProductsArgs, context: Context) => {
  try {
    let { skip = 0, limit = 10, orderBy, isRecentProduct, categoryId, title, productIds } = args;
    const currentRole = context.req?.user?.role;
    const normalizedTitle = title?.trim() || '';

    const filter: Record<string, any> = {};
    filter.isDeleted = false;

    if (productIds?.length) {
      filter.id = { [Op.in]: productIds };
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    // Empty search text should behave like no title filter and return the full dataset.
    if (normalizedTitle) {
      filter.title = likeContains(normalizedTitle);
    }

    const { rows, count } = await Product.findAndCountAll({
      where: filter,
      include: [productCategoryInclude],
      offset: skip,
      limit,
      order: orderBy && !isRecentProduct ? [['title', orderBy]] : undefined,
    });

    let products = rows;
    const totalCount = count;

    if (isRecentProduct && productIds?.length) {
      const orderMap = new Map(productIds.map((id, idx) => [id.toString(), idx]));

      products = products.sort(
        (a: any, b: any) =>
          (orderMap.get(a.id.toString()) ?? 0) - (orderMap.get(b.id.toString()) ?? 0),
      );
    }

    return {
      products: products.map((product) => {
        const serializedProduct = serializeProduct(product);

        if (currentRole === 'customer') {
          return {
            ...serializedProduct,
            buyingPrice: serializedProduct.price,
          };
        }

        return serializedProduct;
      }),
      totalCount,
    };
  } catch (err: any) {
    logger.error(`Error in getAllProducts: ${err.message || err}`);
    throw err;
  }
};
