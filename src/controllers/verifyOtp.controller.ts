/* 
© 2025 Aravinth Raj R. All rights reserved.
Unauthorized copying of this file, via any medium, is strictly prohibited.
Proprietary and confidential.  
Written by Aravinth Raj R <aravinthr235@gmail.com>, 2025.
*/

import { Request, Response, NextFunction } from 'express';
import validator from 'validator';
import { User } from '../models';
import { OtpStore } from '../services/otpStore.service';
import { CustomRequestHandler } from '../../types/express';
import { JwtService } from '../services/jwt.service';
import logger from '../utils/logger';
import { clearSignInCookie, setAuthCookie, setSignInCookie } from '../utils/cookie.helpers';
import { getUserRoles, userRoleInclude } from '../utils/db.helpers';

export const verifyOtp: CustomRequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, otp } = req.body as { email: string; otp: string };

    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email.' });
    }

    if (!otp || validator.isEmpty(String(otp))) {
      return res.status(400).json({ error: 'OTP is required.' });
    }

    const user = await User.findOne({ where: { email: normalizedEmail }, include: [userRoleInclude] });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const otpStore = OtpStore.getInstance();
    const storedOtp = await otpStore.get(normalizedEmail);

    if (!storedOtp) {
      return res.status(400).json({ error: 'OTP has expired.' });
    }

    if (String(storedOtp) !== String(otp)) {
      return res.status(401).json({ error: 'Invalid OTP.' });
    }

    await otpStore.delete(normalizedEmail);

    const roles = getUserRoles(user);
    const selectedRole = roles.length === 1 ? roles[0] : null;

    if (selectedRole) {
      const authToken = JwtService.getInstance().generateToken(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          rollNumber: user.rollNumber,
          department: user.department,
          profilePicture: user.profilePicture,
          role: selectedRole,
        },
        false,
      );

      clearSignInCookie(res);
      setAuthCookie(res, authToken);
    } else {
      const signInToken = JwtService.getInstance().generateToken(
        {
          id: user.id,
          email: user.email,
          userName: user.name,
          rollNumber: user.rollNumber,
          department: user.department,
        },
        true,
      );

      setSignInCookie(res, signInToken);
    }

    return res.status(200).json({
      message: 'OTP verified successfully.',
      roles,
      requiresRoleSelection: roles.length > 1,
      selectedRole,
    });
  } catch (err: any) {
    logger.error(`Error in verifyOtp: ${err}`);
    next(err);
  }
};
