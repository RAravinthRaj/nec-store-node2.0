/* 
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Request } from 'express';
import { Category, Product } from '../../models';
import { Role } from '../../config/enum.config';
import { productCategoryInclude } from '../../utils/db.helpers';
import logger from '../../utils/logger';
import { ImageBucketService } from '../../services/imageBucket.service';

interface Context {
  req: Request;
}

interface UpdateProductInput {
  id: string;
  title?: string;
  categoryId?: string;
  quantity?: number;
  buyingPrice?: number;
  sellingPrice?: number;
  productImage?: string;
  isDeleted?: boolean;
}

export const updateProduct = async (
  _: any,
  args: { input: UpdateProductInput },
  context: Context,
) => {
  try {
    const currentRole = (context.req as any)?.user?.role;
    if (!currentRole) {
      throw new Error('Unauthorized: No token provided.');
    }

    if (currentRole !== Role.Retailer) {
      throw new Error("You don't have enough permission to perform this operation.");
    }

    const { id, title, categoryId, quantity, buyingPrice, sellingPrice, productImage, isDeleted } =
      args.input;

    const existingProduct = await Product.findByPk(id, { include: [productCategoryInclude] });
    if (!existingProduct) {
      throw new Error('Product not found.');
    }

    if (
      (quantity !== undefined && quantity < 0) ||
      (buyingPrice !== undefined && buyingPrice < 0) ||
      (sellingPrice !== undefined && sellingPrice < 0)
    ) {
      throw new Error('Quantity or prices must be non-negative');
    }

    if (title?.trim()) existingProduct.title = title.trim();
    if (quantity !== undefined && quantity > 0) existingProduct.quantity = quantity;
    if (buyingPrice !== undefined && buyingPrice > 0) existingProduct.buyingPrice = buyingPrice;
    if (sellingPrice !== undefined && sellingPrice > 0)
      existingProduct.sellingPrice = sellingPrice;
    if (isDeleted !== undefined) existingProduct.isDeleted = isDeleted;
    if (productImage) {
      const imageService = ImageBucketService.getInstance();

      if (imageService.isValidBase64Image(productImage)) {
        const updatedProductImage = await imageService.uploadBase64Image(productImage);

        existingProduct.productImage = updatedProductImage;
      } else {
        throw new Error('Invalid base64 image for profilePicture.');
      }
    }

    if (categoryId?.trim()) {
      const categoryDoc = await Category.findByPk(categoryId);
      if (!categoryDoc) {
        throw new Error('Category not found.');
      }

      existingProduct.categoryId = categoryDoc.id;
    }

    await existingProduct.save();

    return {
      message: isDeleted ? 'Product deleted successfully.' : 'Product updated successfully.',
    };
  } catch (err: any) {
    logger.error(`Error in updateProduct: ${err.message || err}`);
    throw err;
  }
};
