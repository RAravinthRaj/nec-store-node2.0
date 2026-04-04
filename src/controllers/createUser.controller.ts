/* 
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/
import { NextFunction, Request, Response } from 'express';
import validator from 'validator';
import { CustomRequestHandler } from '@/types/express';
import { Notification, User, UserRole } from '@/src/models';
import { Department, Role } from '@/src/config/enum.config';
import { findUsersByRole, serializeUser, userRoleInclude } from '@/src/utils/db.helpers';
import logger from '@/src/utils/logger';

export const createUser: CustomRequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { rollNumber, name, department, email }: any = Object.fromEntries(
      Object.entries(req.body).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.trim() : value,
      ]),
    );

    if (!rollNumber || !name || !department || !email) {
      return res.status(400).json({ error: 'All fields must be non-empty.' });
    }

    if (
      validator.isEmpty(String(rollNumber)) ||
      validator.isEmpty(String(name)) ||
      validator.isEmpty(String(department)) ||
      validator.isEmpty(String(email)) ||
      !validator.isEmail(String(email))
    ) {
      return res.status(400).json({ error: 'All fields must be non-empty.' });
    }

    const user = await User.create({
      rollNumber: rollNumber,
      name: name,
      department: Department[department.toUpperCase() as keyof typeof Department],
      email: email.toLowerCase(),
    });

    await UserRole.create({
      userId: user.id,
      role: Role.Customer,
    });

    const savedUser = await User.findByPk(user.id, { include: [userRoleInclude] });
    if (!savedUser) {
      throw new Error('Failed to create user.');
    }
    const admins = await findUsersByRole(Role.Admin);
    for (const admin of admins) {
      await Notification.create({
        userId: admin.id,
        message: `New user "${savedUser.name}" signed up.`,
        role: Role.Admin,
        type: 'NEW_USER',
      });
    }

    return res.status(201).json(savedUser ? serializeUser(savedUser) : null);
  } catch (err: any) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      const field = err?.errors?.[0]?.path || 'field';
      logger.error(`Error Code: ${400} -> ${field} already exists.`);
      return res.status(400).json({ error: `${field} already exists.` });
    }

    logger.error(`Error in createUser : ${err}`);
    next(err);
  }
};
