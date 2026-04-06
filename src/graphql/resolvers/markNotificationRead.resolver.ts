/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/

import { Notification } from '../../models';
import { serializeNotification } from '../../utils/db.helpers';
import logger from '../../utils/logger';

interface MarkNotificationReadArgs {
  id: string;
}

interface Context {
  req: Request;
}

export const markNotificationRead = async (
  _: any,
  { id }: MarkNotificationReadArgs,
  context: Context,
) => {
  try {
    const userId = (context.req as any).user?.id;

    if (!userId) {
      throw new Error('Unauthorized: No token provided.');
    }

    const notification = await Notification.findOne({ where: { id, userId } });

    if (!notification) {
      throw new Error('Notification not found or not accessible.');
    }

    notification.isRead = true;
    await notification.save();

    return serializeNotification(notification);
  } catch (err: any) {
    const error = err?.message || err?.toString?.() || 'Unknown error';
    logger.error(`Error in markNotificationRead: ${error}`);
    throw new Error(error);
  }
};
