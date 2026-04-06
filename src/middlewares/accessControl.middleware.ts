/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/

import { Request, Response, NextFunction } from 'express';
import { User } from '../models';
import { UserStatus } from '../config/enum.config';

interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

export const accessControl = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const userId = req.user?.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    if (user.status === UserStatus.Suspended) {
      res.status(403).json({ error: 'Account is temporarily Suspended. Contact Admin.' });
      return;
    }

    next();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error.' });
  }
};
