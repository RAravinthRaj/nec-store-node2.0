/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Order, User } from '../../models';
import logger from '../../utils/logger';
import { likeContains, orderProductsInclude, serializeOrder } from '../../utils/db.helpers';
import { Op } from 'sequelize';

interface Context {
  req: any;
}

interface GetAllOrdersArgs {
  skip?: number;
  limit?: number;
  orderId?: string;
  userId?: string;
  rollNumber?: string;
  orderBy?: 'ASC' | 'DESC';
}

export const getAllOrders = async (_: any, args: GetAllOrdersArgs, context: Context) => {
  try {
    const user = (context.req as any).user;
    if (!user?.role) {
      throw new Error('Unauthorized: No token provided.');
    }

    const { skip = 0, limit = 10, orderId, userId, rollNumber, orderBy = 'ASC' } = args;

    const filter: Record<string, any> = {};

    filter.orderStatus = { [Op.ne]: 'cancelled' };

    if (orderId?.trim()) {
      filter.orderId = likeContains(orderId.trim());
    }

    if (userId?.trim()) {
      filter.orderBy = userId.trim();
    }

    if (rollNumber?.trim()) {
      const matchedUsers = await User.findAll({
        where: {
          rollNumber: likeContains(rollNumber.trim()),
        },
      });

      filter.orderBy = { [Op.in]: matchedUsers.map((matchedUser) => matchedUser.id) };
    }

    const sortOrder = orderBy === 'DESC' ? -1 : 1;

    const { rows, count } = await Order.findAndCountAll({
      where: filter,
      include: [orderProductsInclude],
      order: [['orderId', sortOrder === 1 ? 'ASC' : 'DESC']],
      offset: skip,
      limit,
      distinct: true,
    });

    return { orders: rows.map(serializeOrder), totalCount: count };
  } catch (err: any) {
    logger.error(`Error in getAllOrders: ${err.message || err}`);
    throw new Error('Failed to fetch orders');
  }
};
