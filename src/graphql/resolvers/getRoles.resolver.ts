/* 
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Request } from 'express';
import { User } from '../../models';
import { getUserRoles, userRoleInclude } from '../../utils/db.helpers';
import logger from '../../utils/logger';

interface Context {
  req: Request;
}

interface RoleSelectionResponse {
  roles: string[];
  requiresRoleSelection: boolean;
  selectedRole: string | null;
}

const getResolvedRoles = async (context: Context): Promise<RoleSelectionResponse> => {
  try {
    const id = (context.req as any).user?.id;

    const user = await User.findByPk(id, { include: [userRoleInclude] });
    if (!user) {
      throw new Error('User not found');
    }

    const roles = getUserRoles(user);

    return {
      roles,
      requiresRoleSelection: roles.length > 1,
      selectedRole: roles.length === 1 ? roles[0] : null,
    };
  } catch (err: any) {
    logger.error(`Error in getRoles : ${err}`);
    throw err;
  }
};

export const getRoles = async (_: any, __: any, context: Context): Promise<string[]> => {
  const { roles } = await getResolvedRoles(context);
  return roles;
};

export const getRoleSelection = async (
  _: any,
  __: any,
  context: Context,
): Promise<RoleSelectionResponse> => getResolvedRoles(context);
