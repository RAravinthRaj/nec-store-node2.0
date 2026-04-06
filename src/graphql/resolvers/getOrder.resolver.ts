/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Request } from 'express';
import { Role } from '../../config/enum.config';
import { Order } from '../../models';
import { orderProductsInclude, serializeOrder } from '../../utils/db.helpers';
import logger from '../../utils/logger';

interface Context {
  req: Request;
}

interface GetUserArgs {
  id: string;
}

export const getOrder = async (_: any, { id }: GetUserArgs, context: Context) => {
  try {
    const currentRole = (context.req as any).user?.role;
    if (!currentRole) {
      throw new Error('Unauthorized: No token provided.');
    }

    if (currentRole !== Role.Retailer) {
      throw new Error("You don't have permission to perform this operation.");
    }

    const order = await Order.findByPk(id, { include: [orderProductsInclude] });
    if (!order) {
      throw new Error('Order not found');
    }

    return serializeOrder(order);
  } catch (err: any) {
    logger.error(`Error in getUser: ${err.message || err}`);
    throw err;
  }
};
