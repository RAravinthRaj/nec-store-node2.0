/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Request, Response, NextFunction } from 'express';
import { User } from '@/src/models';
import { CustomRequestHandler } from '@/types/express';
import { serializeUser, userRoleInclude } from '@/src/utils/db.helpers';
import logger from '@/src/utils/logger';

export const getSession: CustomRequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: No token provided.' });
    }

    const user = await User.findByPk(userId, { include: [userRoleInclude] });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({
      user: serializeUser(user),
      role: (req as any).user?.role,
    });
  } catch (err: any) {
    logger.error(`Error in getSession: ${err?.message || err}`);
    next(err);
  }
};

