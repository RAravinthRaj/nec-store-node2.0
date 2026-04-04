/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Request } from 'express';
import { Category } from '@/src/models';
import { Role } from '@/src/config/enum.config';
import { serializeCategory } from '@/src/utils/db.helpers';
import logger from '@/src/utils/logger';

interface Context {
  req: Request;
}

interface AddCategoryArgs {
  name: string;
}

export const addCategory = async (_: any, { name }: AddCategoryArgs, context: Context) => {
  try {
    const currentRole = (context.req as any).user?.role;
    if (!currentRole) {
      throw new Error('Unauthorized: No token provided.');
    }

    if (currentRole !== Role.Retailer) {
      throw new Error("You don't have enough permission to perform this operation.");
    }

    name = name?.trim();
    if (!name) {
      throw new Error('Category name is required.');
    }

    const newCategory = await Category.create({ name });
    return serializeCategory(newCategory);
  } catch (err: any) {
    const error = err?.message || err?.toString?.() || 'Unknown error';

    logger.error(`Error in addCategory: ${error}`);

    if (err?.name === 'SequelizeUniqueConstraintError') {
      throw new Error('Category already exists.');
    }

    throw error;
  }
};
