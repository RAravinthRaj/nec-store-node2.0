/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Request } from 'express';
import { Product } from '@/src/models';
import { Role } from '@/src/config/enum.config';
import logger from '@/src/utils/logger';

interface Context {
  req: Request;
}

interface DeleteProductInput {
  id: string;
}

export const deleteProduct = async (
  _: any,
  { input }: { input: DeleteProductInput },
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

    const existingProduct = await Product.findByPk(input.id);
    if (!existingProduct) {
      throw new Error('Product not found.');
    }

    await existingProduct.destroy();

    return {
      message: 'Product deleted successfully.',
    };
  } catch (err: any) {
    logger.error(`Error in deleteProduct: ${err.message || err}`);
    throw err;
  }
};
