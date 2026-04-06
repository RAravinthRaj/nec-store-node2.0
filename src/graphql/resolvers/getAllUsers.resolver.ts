/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Request } from 'express';
import { Role } from '../../config/enum.config';
import { User } from '../../models';
import { likeContains, serializeUser, userRecentInclude, userRoleInclude } from '../../utils/db.helpers';
import logger from '../../utils/logger';

interface Context {
  req: Request;
}

interface GetAllUsersArgs {
  name?: string;
  email?: string;
  skip?: number;
  limit?: number;
  orderBy?: 'ASC' | 'DESC';
}

export const getAllUsers = async (
  _: any,
  { name, email, skip = 0, limit = 10, orderBy = 'ASC' }: GetAllUsersArgs,
  context: Context,
) => {
  try {
    const currentRole = (context.req as any).user?.role;
    if (!currentRole) {
      throw new Error('Unauthorized: No token provided.');
    }

    const currentUserId = (context.req as any).user?.id;
    const currentUser = await User.findByPk(currentUserId);
    if (!currentUser) {
      throw new Error('User not found.');
    }

    if (currentRole !== Role.Admin) {
      throw new Error("You don't have enough permission to perform this operation.");
    }

    const filter: Record<string, any> = {};

    if (name?.trim()) {
      filter.name = likeContains(name.trim());
    }

    if (email?.trim()) {
      filter.email = likeContains(email.trim());
    }

    const { rows, count } = await User.findAndCountAll({
      where: filter,
      include: [userRoleInclude, userRecentInclude],
      order: [['name', orderBy]],
      offset: skip,
      limit,
      distinct: true,
    });

    return { users: rows.map(serializeUser), totalCount: count };
  } catch (err: any) {
    logger.error(`Error in getAllUsers : ${err}`);
    throw err;
  }
};
