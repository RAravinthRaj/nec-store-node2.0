/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Request, Response, NextFunction } from 'express';
import { CustomRequestHandler } from '@/types/express';
import { clearAuthCookies } from '@/src/utils/cookie.helpers';
import logger from '@/src/utils/logger';

export const logout: CustomRequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    clearAuthCookies(res);
    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (err: any) {
    logger.error(`Error in logout: ${err?.message || err}`);
    next(err);
  }
};
