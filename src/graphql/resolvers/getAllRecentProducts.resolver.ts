/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Request } from 'express';
import { RecentProduct, User } from '../../models';
import logger from '../../utils/logger';

interface Context {
  req: Request;
}

interface GetAllRecentProductsArgs {
  userId: string;
}

export const getAllRecentProducts = async (
  _: any,
  { userId }: GetAllRecentProductsArgs,
  context: Context,
) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    const recents = await RecentProduct.findAll({
      where: { userId },
      order: [['updatedAt', 'DESC']],
      limit: 10,
    });

    return recents.map((recent) => recent.productId);
  } catch (err: any) {
    const error = err?.message || err?.toString?.() || 'Unknown error';
    logger.error(`Error in getAllRecentProductIds: ${error}`);
    throw new Error(error);
  }
};
