/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Request } from 'express';
import { Category, Notification, Product } from '../../models';
import { Role } from '../../config/enum.config';
import {
  findUsersByRole,
  productCategoryInclude,
  serializeProduct,
} from '../../utils/db.helpers';
import logger from '../../utils/logger';
import { ImageBucketService } from '../../services/imageBucket.service';
import { Op } from 'sequelize';

interface Context {
  req: Request;
}

interface AddProductArgs {
  title: string;
  categoryId: string;
  quantity?: number;
  buyingPrice?: number;
  sellingPrice?: number;
  productImage?: string;
  __v?: number;
}

export const addProduct = async (_: any, args: AddProductArgs, context: Context) => {
  try {
    const currentRole = (context.req as any)?.user?.role;

    if (!currentRole) {
      throw new Error('Unauthorized: No token provided.');
    }

    if (currentRole !== Role.Retailer) {
      throw new Error("You don't have enough permission to perform this operation.");
    }

    let {
      title,
      categoryId,
      quantity = 0,
      buyingPrice = 0,
      sellingPrice = 0,
      productImage,
    } = args;

    if (
      !title?.trim() ||
      !categoryId?.trim()
    ) {
      throw new Error('Title and category are required.');
    }

    if (quantity < 0 || buyingPrice < 0 || sellingPrice < 0) {
      throw new Error('Quantity and prices must be non-negative.');
    }

    const categoryDoc = await Category.findByPk(categoryId);
    if (!categoryDoc) {
      throw new Error('Category not found.');
    }

    const existingProduct = await Product.findOne({
      where: {
        title: { [Op.eq]: title.trim() },
        categoryId: categoryDoc.id,
      },
    });
    if (existingProduct) {
      if (existingProduct.isDeleted) {
        await existingProduct.destroy();
      } else {
        throw new Error(`${title} already exists under ${categoryDoc.name}.`);
      }
    }

    if (productImage) {
      const imageService = ImageBucketService.getInstance();

      if (imageService.isValidBase64Image(productImage)) {
        const updatedProductImage = await imageService.uploadBase64Image(productImage);
        productImage = updatedProductImage;
      } else {
        throw new Error('Invalid base64 image for product image.');
      }
    }

    const newProduct = await Product.create({
      title: title.trim(),
      categoryId: categoryDoc.id,
      quantity: Number(quantity) || 0,
      buyingPrice: Number(buyingPrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      productImage: productImage || null,
    });

    const customers = await findUsersByRole(Role.Customer);
    for (const customer of customers) {
      await Notification.create({
        userId: customer.id,
        title: 'New Product',
        message: `New Product "${newProduct.title}" added under ${categoryDoc.name}.`,
        role: Role.Customer,
        type: 'NEW_PRODUCT',
      });
    }

    const createdProduct = await Product.findByPk(newProduct.id, {
      include: [productCategoryInclude],
    });

    if (!createdProduct) {
      throw new Error('Failed to fetch created product.');
    }

    return serializeProduct(createdProduct);
  } catch (err: any) {
    logger.error(`Error in addProduct: ${err.message || err}`);
    throw err;
  }
};
