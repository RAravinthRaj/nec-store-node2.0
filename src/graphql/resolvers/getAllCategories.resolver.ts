/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Request } from 'express';
import { Category } from '../../models';
import { serializeCategory } from '../../utils/db.helpers';
import logger from '../../utils/logger';

interface Context {
  req: Request;
}

export const getAllCategories = async (_: any, __: any, context: Context) => {
  try {
    const currentRole = (context.req as any).user?.role;
    if (!currentRole) {
      throw new Error('Unauthorized: No token provided.');
    }

    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    return categories.map(serializeCategory);
  } catch (err: any) {
    logger.error(`Error in getAllCategories: ${err}`);
    throw err;
  }
};
