/* 
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Request } from 'express';
import { AddStock, Product } from '../../models';
import { Role } from '../../config/enum.config';
import { productCategoryInclude, serializeProduct } from '../../utils/db.helpers';
import logger from '../../utils/logger';

interface Context {
  req: Request;
}

interface AddStockInput {
  id: string;
  quantity: number;
  buyingPrice: number;
}

export const addStock = async (_: any, args: { input: AddStockInput }, context: Context) => {
  try {
    const currentRole = (context.req as any)?.user?.role;
    if (!currentRole) {
      throw new Error('Unauthorized: No token provided.');
    }

    if (currentRole !== Role.Retailer) {
      throw new Error("You don't have enough permission to perform this operation.");
    }

    const currentUserId = (context.req as any)?.user?.id;
    const { id, quantity, buyingPrice } = args.input;

    const existingProduct = await Product.findByPk(id, { include: [productCategoryInclude] });
    if (!existingProduct) {
      throw new Error('Product not found.');
    }

    if (quantity <= 0 || buyingPrice <= 0) {
      throw new Error('Quantity and buying price must be greater than zero.');
    }

    const previousQuantity = Number(existingProduct.quantity || 0);
    const previousBuyingPrice = Number(existingProduct.buyingPrice || 0);
    const previousSellingPrice = Number(existingProduct.sellingPrice || 0);
    const totalQuantity = previousQuantity + quantity;
    const weightedPrice =
      totalQuantity === 0
        ? 0
        : (previousQuantity * previousBuyingPrice + quantity * buyingPrice) / totalQuantity;

    existingProduct.quantity = totalQuantity;
    existingProduct.buyingPrice = Number(weightedPrice.toFixed(2));
    existingProduct.sellingPrice = Number(weightedPrice.toFixed(2));

    await existingProduct.save();

    const stockEntry = await AddStock.create({
      productId: existingProduct.id,
      userId: currentUserId,
      quantityAdded: quantity,
      buyingPriceAdded: Number(buyingPrice.toFixed(2)),
      previousQuantity,
      previousBuyingPrice,
      previousSellingPrice,
      currentQuantity: existingProduct.quantity,
      currentBuyingPrice: Number(existingProduct.buyingPrice),
      currentSellingPrice: Number(existingProduct.sellingPrice),
    });

    return {
      message: 'Stock Added successfully.',
      product: serializeProduct(existingProduct),
      stockEntry: {
        ...stockEntry.get({ plain: true }),
        buyingPriceAdded: String(stockEntry.buyingPriceAdded),
        previousBuyingPrice: String(stockEntry.previousBuyingPrice),
        previousSellingPrice: String(stockEntry.previousSellingPrice),
        currentBuyingPrice: String(stockEntry.currentBuyingPrice),
        currentSellingPrice: String(stockEntry.currentSellingPrice),
      },
    };
  } catch (err: any) {
    logger.error(`Error in addStockProduct: ${err.message || err}`);
    throw err;
  }
};
