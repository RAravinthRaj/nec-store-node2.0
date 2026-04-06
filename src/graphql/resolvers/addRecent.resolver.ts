/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/

import { Request } from 'express';
import { Product, RecentProduct, User } from '../../models';
import { userRecentInclude, userRoleInclude, serializeUser } from '../../utils/db.helpers';
import logger from '../../utils/logger';

interface Context {
  req: Request;
}

interface AddRecentArgs {
  userId: string;
  productId: string;
}

export const addRecent = async (_: any, { userId, productId }: AddRecentArgs, context: Context) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const existingRecent = await RecentProduct.findOne({ where: { userId, productId } });
    if (existingRecent) {
      existingRecent.set('updatedAt', new Date());
      await existingRecent.save();
    } else {
      await RecentProduct.create({ userId, productId });
    }

    const oldRecents = await RecentProduct.findAll({
      where: { userId },
      order: [['updatedAt', 'DESC']],
      offset: 10,
    });

    if (oldRecents.length) {
      await RecentProduct.destroy({
        where: { id: oldRecents.map((item) => item.id) },
      });
    }

    const updatedUser = await User.findByPk(userId, {
      include: [userRoleInclude, userRecentInclude],
    });

    if (!updatedUser) {
      throw new Error('User not found');
    }

    return serializeUser(updatedUser);
  } catch (err: any) {
    const error = err?.message || err?.toString?.() || 'Unknown error';
    logger.error(`Error in addRecent: ${error}`);
    throw new Error(error);
  }
};
