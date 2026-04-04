/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Request, Response } from 'express';
import { User } from '@/src/models';
import { JwtService } from '@/src/services/jwt.service';
import { Role } from '@/src/config/enum.config';
import { getUserRoles, userRoleInclude } from '@/src/utils/db.helpers';
import logger from '@/src/utils/logger';
import { clearSignInCookie, setAuthCookie } from '@/src/utils/cookie.helpers';

interface Context {
  req: Request;
  res: Response;
}

interface AccessTokenArgs {
  role: Role;
}

export const getAccessToken = async (
  _: any,
  { role }: AccessTokenArgs,
  context: Context,
): Promise<{
  role?: string;
  token?: string;
  roles: Role[];
  requiresRoleSelection: boolean;
}> => {
  try {
    const userId = (context.req as any).user?.id;

    const user = await User.findByPk(userId, { include: [userRoleInclude] });
    if (!user) {
      throw new Error('User not found.');
    }

    const userRoles = getUserRoles(user);
    if (!userRoles || !userRoles?.includes(role)) {
      throw new Error('Unauthorized.');
    }

    const payload = {
      id: user?.id,
      name: user?.name,
      email: user?.email,
      rollNumber: user?.rollNumber,
      department: user?.department,
      profilePicture: user?.profilePicture,
      role: role,
    };

    const newToken = JwtService.getInstance().generateToken(payload, false);

    clearSignInCookie(context.res);
    setAuthCookie(context.res, newToken);

    return {
      role,
      roles: userRoles,
      requiresRoleSelection: userRoles.length > 1,
    };
  } catch (err: any) {
    logger.error(`Error in getAccessToken : ${err}`);
    throw err;
  }
};
