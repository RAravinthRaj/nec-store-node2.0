/* 
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Request } from 'express';
import { Role } from '../../config/enum.config';
import { User } from '../../models';
import { serializeUser, userRecentInclude, userRoleInclude } from '../../utils/db.helpers';
import logger from '../../utils/logger';

interface Context {
  req: Request;
}

interface GetUserArgs {
  id: string;
}

export const getUser = async (_: any, { id }: GetUserArgs, context: Context) => {
  try {
    const currentRole = (context.req as any).user?.role;
    if (!currentRole) {
      throw new Error('Unauthorized: No token provided.');
    }

    const tokenUserId = (context.req as any).user?.id;
    const tokenUser = await User.findByPk(tokenUserId, {
      include: [userRoleInclude, userRecentInclude],
    });
    if (!tokenUser) {
      throw new Error('User not found.');
    }

    const isAdmin = currentRole === Role.Admin;

    if (!isAdmin && id && tokenUser.id.toString() !== id) {
      throw new Error("You don't have permission to perform this operation.");
    }

    if (isAdmin && id) {
      const requestedUser = await User.findByPk(id, {
        include: [userRoleInclude, userRecentInclude],
      });
      if (!requestedUser) {
        throw new Error(`User with ID ${id} not found.`);
      }

      return serializeUser(requestedUser);
    }

    return serializeUser(tokenUser);
  } catch (err: any) {
    logger.error(`Error in getUser : ${err}`);
    throw err;
  }
};
