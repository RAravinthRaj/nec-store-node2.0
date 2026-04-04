/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/

import { Request } from 'express';
import { Notification } from '@/src/models';
import { serializeNotification } from '@/src/utils/db.helpers';
import logger from '@/src/utils/logger';

interface Context {
  req: Request;
}

export const getNotifications = async (_: any, __: any, context: Context) => {
  try {
    const userId = (context.req as any).user?.id;

    if (!userId) {
      throw new Error('Unauthorized: No token provided.');
    }

    const notifications = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
    return notifications.map(serializeNotification);
  } catch (err: any) {
    const error = err?.message || err?.toString?.() || 'Unknown error';
    logger.error(`Error in getNotifications: ${error}`);
    throw new Error(error);
  }
};
