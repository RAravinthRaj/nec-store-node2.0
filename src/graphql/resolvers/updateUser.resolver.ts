/*
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { Request, Response } from 'express';
import { User, UserRole } from '@/src/models';
import { JwtService } from '@/src/services/jwt.service';
import { Department, Role, UserStatus } from '@/src/config/enum.config';
import logger from '@/src/utils/logger';
import { ImageBucketService } from '@/src/services/imageBucket.service';
import { getUserRoles, userRoleInclude } from '@/src/utils/db.helpers';
import { setAuthCookie } from '@/src/utils/cookie.helpers';

interface Context {
  req: Request;
  res: Response;
}

interface UpdateUserInput {
  id: string;
  email?: string;
  name?: string;
  rollNumber?: string;
  department?: string;
  profilePicture?: string | null;
  roles?: Role[];
  status?: UserStatus;
}

export const updateUser = async (
  _: any,
  { input }: { input: UpdateUserInput },
  context: Context,
) => {
  try {
    const currentRole = (context.req as any).user?.role;
    if (!currentRole) {
      throw new Error('Unauthorized: No token provided.');
    }

    const currentUserId = (context.req as any).user?.id;
    const tokenUser = await User.findByPk(currentUserId, {
      include: [userRoleInclude],
    });

    if (!tokenUser) throw new Error('User not found.');

    const isAdmin = currentRole === Role.Admin;
    let targetUser = tokenUser;

    if (!isAdmin && (input.roles !== undefined || input.status !== undefined)) {
      throw new Error("You don't have enough permission to perform this operation.");
    }

    if (input.id && input.id !== tokenUser.id) {
      if (!isAdmin) {
        throw new Error("You don't have enough permission to perform this operation.");
      }

      const foundUser = await User.findByPk(input.id, {
        include: [userRoleInclude],
      });
      if (!foundUser) throw new Error('User not found.');
      targetUser = foundUser;
    }

    if (input.profilePicture) {
      const imageService = ImageBucketService.getInstance();

      if (imageService.isValidBase64Image(input.profilePicture)) {
        const profilePicture = await imageService.uploadBase64Image(input.profilePicture);

        input.profilePicture = profilePicture;
      } else {
        throw new Error('Invalid base64 image for profilePicture.');
      }
    }

    const fieldsToUpdate: {
      name?: string;
      email?: string;
      rollNumber?: string;
      department?: Department;
      profilePicture?: string | null;
      status?: UserStatus;
    } = {
      ...(input.name && { name: input.name }),
      ...(input.email && { email: input.email }),
      ...(input.rollNumber && { rollNumber: input.rollNumber }),
      ...(input.department && { department: input.department as Department }),
      ...(input.profilePicture !== undefined && { profilePicture: input.profilePicture }),
    };

    if (isAdmin && input.id && input.id !== tokenUser.id) {
      if (input.roles) {
        const oldRoles = getUserRoles(targetUser);
        const mergedRoles = Array.from(new Set([...oldRoles, ...input.roles]));
        await UserRole.destroy({ where: { userId: targetUser.id } });
        await UserRole.bulkCreate(
          mergedRoles.map((role) => ({
            userId: targetUser.id,
            role,
          })),
        );
      }

      if (input.status) {
        fieldsToUpdate.status = input.status;
      }
    }

    await targetUser.update(fieldsToUpdate);
    const updatedUser = await User.findByPk(targetUser.id, {
      include: [userRoleInclude],
    });

    if (!updatedUser) throw new Error('User update failed.');

    const isSelfUpdate = updatedUser.id.toString() === tokenUser.id.toString();
    const updatedSelfFields = input.name || input.rollNumber || input.department || input.email;

    let newToken: string | undefined;
    if (isSelfUpdate && updatedSelfFields) {
      const payload = {
        id: updatedUser?.id,
        name: updatedUser?.name,
        rollNumber: updatedUser?.rollNumber,
        department: updatedUser?.department,
        email: updatedUser?.email,
        role: currentRole,
        profilePicture: updatedUser?.profilePicture,
      };
      newToken = JwtService.getInstance().generateToken(payload, false);
      setAuthCookie(context.res, newToken);
    }

    return {
      message: 'User updated successfully.',
    };
  } catch (err: any) {
    logger.error(`Error in updateUser : ${err}`);
    throw err;
  }
};
